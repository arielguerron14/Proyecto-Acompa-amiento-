# 🎯 GUÍA DE PRUEBA POST-DESPLIEGUE

## ✅ Estado Actual

Todos los 9 servicios han sido desplegados exitosamente en sus respectivas instancias AWS EC2 con Docker y docker-compose instalados automáticamente.

---

## 🌐 PASO 1: Verificar Frontend

### En tu navegador:
```
http://44.220.126.89
```

**Esperado:**
- Página de inicio de la aplicación cargue correctamente
- Sin errores de conexión
- Interfaz de usuario visible

**Si hay problemas:**
```bash
# Verificar contenedor Docker
ssh ubuntu@44.220.126.89
sudo docker ps | grep frontend
docker logs [CONTAINER_NAME]
```

---

## 🔌 PASO 2: Verificar API Gateway

### URL:
```
http://52.7.168.4:8080
```

**Esperado:**
- Respuesta HTTP de la API
- Endpoints disponibles
- Sin errores 500

**Prueba simple:**
```bash
curl http://52.7.168.4:8080/api/health
```

---

## 💻 PASO 3: Verificar Core Services

### URL:
```
http://98.80.149.136:3000
```

**Esperado:**
- Servicio respondiendo en puerto 3000
- Lógica de negocio accesible
- Comunicación con API Gateway funcional

---

## 🗄️ PASO 4: Verificar Conectividad a Base de Datos

### Conexión PostgreSQL:
```
Host: 100.31.92.150
Puerto: 5432
Base de datos: [ver docker-compose.infrastructure.yml]
```

**Verificar desde tu máquina:**
```bash
# Si tienes psql instalado
psql -h 100.31.92.150 -U [usuario] -d [database]

# O desde una instancia EC2
ssh ubuntu@100.31.92.150
docker ps | grep postgres
```

---

## 📨 PASO 5: Verificar Message Queue (RabbitMQ)

### Conexión:
```
Host: 13.217.211.183
Puerto: 5672 (AMQP)
Panel Admin: http://13.217.211.183:15672 (si está habilitado)
```

**Verificar que está corriendo:**
```bash
ssh ubuntu@13.217.211.183
docker ps | grep rabbit
```

---

## 🔔 PASO 6: Verificar Notificaciones

### URL:
```
http://100.31.135.46:8000
```

**Esperado:**
- Servicio de notificaciones disponible
- Puede recibir y procesar mensajes

---

## 📊 PASO 7: Verificar Reportes

### URL:
```
http://52.200.32.56:8080
```

**Esperado:**
- Generador de reportes funcional
- Acceso a datos de la aplicación

---

## 📈 PASO 8: Verificar Monitoring

### URL:
```
http://98.88.93.98:3000
```

**Esperado:**
- Dashboard de monitoreo visible
- Métricas de la aplicación
- Estado de todos los servicios

---

## 🔗 PASO 9: Probar Comunicación Entre Servicios

### Flujo esperado:
```
Frontend (44.220.126.89)
    ↓
API Gateway (52.7.168.4:8080)
    ↓
Core Services (98.80.149.136:3000)
    ↓
Database (100.31.92.150:5432)
```

**Verificar cada salto:**

1. **Frontend → API Gateway**
   ```bash
   curl -I http://52.7.168.4:8080
   # Debe responder con HTTP 200 u otro código válido
   ```

2. **API Gateway → Core Services**
   ```bash
   curl -I http://98.80.149.136:3000
   # Debe responder correctamente
   ```

3. **Core Services → Database**
   ```bash
   ssh ubuntu@98.80.149.136
   docker exec [core-container] psql -h 100.31.92.150 -c "SELECT 1"
   # Debe conectar exitosamente
   ```

---

## 🚪 PASO 10: Verificar Bastion (Jump Host)

### Acceso:
```bash
ssh -i [tu_clave] ubuntu@34.235.224.202
```

**Desde Bastion, acceder a instancias internas:**
```bash
# Desde Bastion, hacia cualquier otra instancia
ssh ubuntu@172.31.x.x  # IPs internas
```

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Los servicios no responden:

```bash
# 1. Verificar que Docker está corriendo
ssh ubuntu@[IP]
sudo systemctl status docker

# 2. Ver contenedores
sudo docker ps -a

# 3. Ver logs
sudo docker logs [container-name]

# 4. Reiniciar servicio
sudo docker-compose -f docker-compose.[service].yml restart

# 5. Ver estado completo
sudo docker-compose -f docker-compose.[service].yml status
```

### Error de conectividad entre servicios:

```bash
# Verificar que pueden ping-earse
ping 100.31.92.150  # Desde otra instancia
telnet 100.31.92.150 5432  # Pruebar puerto específico

# Revisar Security Groups en AWS Console
# Asegurarse que todos los puertos están abiertos entre instancias
```

### Docker no está instalado:

```bash
# Ejecutar workflow nuevamente
gh workflow run test-connectivity-deploy.yml

# O instalar manualmente
ssh ubuntu@[IP]
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
```

---

## 📊 Verificación Rápida (Script)

Guardar como `verify-deployment.sh` y ejecutar:

```bash
#!/bin/bash

echo "🚀 Verificando despliegue..."

# Array de servicios a verificar
declare -a services=(
    "Frontend:44.220.126.89:80"
    "API_Gateway:52.7.168.4:8080"
    "Core:98.80.149.136:3000"
    "Notificaciones:100.31.135.46:8000"
    "Reportes:52.200.32.56:8080"
    "Monitoring:98.88.93.98:3000"
)

for service in "${services[@]}"; do
    IFS=':' read -r name ip port <<< "$service"
    echo -n "Probando $name ($ip:$port)... "
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$ip/$port" 2>/dev/null; then
        echo "✅ OK"
    else
        echo "❌ FALLO"
    fi
done

echo "✅ Verificación completada"
```

---

## 🎯 Resumen de Validación

Marcar conforme valides cada servicio:

- [ ] Frontend carga correctamente
- [ ] API Gateway responde a requests
- [ ] Core Services está operativo
- [ ] Database conecta exitosamente
- [ ] Messaging (RabbitMQ) está corriendo
- [ ] Notificaciones enviando correctamente
- [ ] Reportes generándose
- [ ] Monitoring mostrando métricas
- [ ] Comunicación entre servicios funcional
- [ ] Bastion accesible para acceso remoto

---

## 📞 Si algo falla:

1. **Revisar logs del workflow:**
   ```bash
   gh run list --workflow=test-connectivity-deploy.yml
   gh run view [RUN_ID] --log
   ```

2. **Verificar en GitHub Actions:**
   Ir a: Repository → Actions → Test Connectivity & Deploy

3. **Revisar AWS Console:**
   - Verificar instancias están corriendo
   - Revisar Security Groups
   - Comprobar Internet Gateway

4. **Redeploy si es necesario:**
   ```bash
   gh workflow run test-connectivity-deploy.yml
   ```

---

## ✨ Éxito Esperado

Si todos los pasos pasan correctamente, tienes un despliegue COMPLETO y FUNCIONAL de toda la aplicación distribuida en 9 instancias AWS con:

✅ Automatización end-to-end  
✅ Docker completamente instalado  
✅ Todos los servicios corriendo  
✅ Conectividad verificada  
✅ Listo para producción  

---

**Fecha de Despliegue**: 2026-01-15  
**Versión Workflow**: 2.0  
**Estado**: 🟢 COMPLETO
