# 🔧 MANUAL SERVICE RESTART INSTRUCTIONS

## Problema Actual
Los microservicios en **EC2-Core (172.31.79.241)** no están respondiendo. 

Los endpoints del API Gateway retornan:
- ❌ `/horarios` → "Horarios service unavailable"
- ❌ `/estudiantes` → "Estudiantes service unavailable (proxy error)"

## Solución: Reiniciar Docker Compose Manualmente

### Opción 1: AWS Systems Manager Session Manager (RECOMENDADO)

**Ventaja:** No requiere SSH keys, se conecta directamente desde AWS Console

#### Pasos:

1. **Ve a AWS Console:**
   - URL: https://console.aws.amazon.com/systems-manager/session-manager/start-session
   - Región: **us-east-1**

2. **Selecciona la Instancia:**
   - Busca: **EC2-Core** o la instancia con IP privada **172.31.79.241**
   - Click en "Start session"

3. **Ejecuta los Comandos:**
   ```bash
   # Ver el estado actual de contenedores
   docker ps -a
   
   # Navegar al directorio del proyecto
   cd ~/Proyecto-Acompa-amiento-
   
   # Detener servicios
   sudo docker-compose -f docker-compose.core.yml down
   
   # Esperar 3 segundos
   sleep 3
   
   # Reiniciar servicios
   sudo docker-compose -f docker-compose.core.yml up -d
   
   # Esperar a que inicien
   sleep 15
   
   # Ver estado final
   docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{Ports}}"
   
   # Ver logs de errores
   docker logs micro-auth
   docker logs micro-estudiantes
   docker logs micro-maestros
   docker logs mongo
   ```

4. **Verifica que los contenedores estén Running:**
   ```
   micro-auth         Up ...
   micro-estudiantes  Up ...
   micro-maestros     Up ...
   mongo              Up ...
   ```

### Opción 2: AWS Systems Manager Run Command

1. **Ve a Systems Manager:**
   - https://console.aws.amazon.com/systems-manager/documents

2. **Crear Comando:**
   - Click "Run command"
   - Selecciona la instancia EC2-Core
   - Paste este comando:
   ```bash
   #!/bin/bash
   cd ~/Proyecto-Acompa-amiento-
   sudo docker-compose -f docker-compose.core.yml down
   sleep 3
   sudo docker-compose -f docker-compose.core.yml up -d
   sleep 15
   docker ps -a --format "table {{.Names}}\t{{.Status}}"
   ```

### Opción 3: EC2 Connect (si está disponible)

1. **Ve a EC2 Dashboard:**
   - https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#Instances

2. **Busca EC2-Core:**
   - Selecciona la instancia
   - Click "Connect" (arriba a la derecha)
   - Selecciona tab "EC2 Instance Connect"
   - Click "Connect"

3. **Ejecuta los mismos comandos que en Opción 1**

---

## Verificación Después del Restart

### 1. Desde CLI Local:
```bash
# Test health endpoint
curl http://52.7.168.4:8080/health

# Test horarios endpoint
curl http://52.7.168.4:8080/horarios

# Test estudiantes endpoint
curl http://52.7.168.4:8080/estudiantes/reservas/estudiante/1
```

### 2. Desde el Browser:
- Ve a: http://44.220.126.89
- Intenta cargar una reserva o horario
- No debe haber errores 503/504

### 3. En la Instancia EC2-Core:
```bash
# Ver logs en tiempo real
docker logs -f micro-estudiantes

# Ver logs de MongoDB
docker logs -f mongo

# Verificar conectividad interna
# Dentro del contenedor:
docker exec -it micro-estudiantes sh -c "curl http://mongo:27017"
```

---

## Señales de Éxito ✅

Después de ejecutar los comandos, deberías ver:

1. **docker ps output muestra todos los contenedores "Up":**
   ```
   NAMES                STATUS
   micro-auth           Up 2 minutes
   micro-estudiantes    Up 2 minutes
   micro-maestros       Up 2 minutes
   mongo                Up 2 minutes
   ```

2. **curl /horarios devuelve JSON (sin error):**
   ```json
   [
     { "id": 1, "name": "Math", ... },
     { "id": 2, "name": "Physics", ... },
     ...
   ]
   ```

3. **Frontend en http://44.220.126.89 funciona:**
   - Cargas de horarios sin errores
   - Reservas se actualizan sin 503/504

---

## Problemas Comunes

### "docker: command not found"
- Docker no está instalado en la instancia
- Solución: Necesita instalar Docker
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker ubuntu
  ```

### "Permission denied" en docker-compose
- El usuario ubuntu no tiene permiso para ejecutar docker
- Solución: Usa `sudo` o agrega ubuntu al grupo docker
  ```bash
  sudo usermod -aG docker ubuntu
  # Logout y login nuevamente
  ```

### Contenedores quedan en "Exited"
- Los servicios están fallando al iniciar
- Ver logs: `docker logs [container-name]`
- Problemas comunes:
  - MongoDB puerto ocupado
  - Variables de entorno no configuradas
  - Código de la aplicación tiene errores

---

## GitHub Actions Automation

Después de reiniciar manualmente, ejecuta el workflow para validar:

```bash
gh workflow run restart-core-services.yml
```

Este workflow:
1. Intenta conectarse vía Bastion
2. Reinicia los servicios automáticamente
3. Verifica que los endpoints responden

---

## Última Opción: Recrear Instancia

Si nada funciona:

1. **Guarda el estado actual:**
   ```bash
   # Desde la instancia, copia los archivos importantes
   mkdir ~/backup
   cp -r ~/Proyecto-Acompa-amiento- ~/backup/
   ```

2. **En AWS Console:**
   - Termina la instancia EC2-Core
   - Relanza desde el Bastion o crea una nueva con Terraform

3. **Redeploy:**
   ```bash
   gh workflow run deploy-fix.yml
   ```

---

**Status:** En proceso de diagnóstico
**Last Update:** 2026-01-15 06:58 UTC
