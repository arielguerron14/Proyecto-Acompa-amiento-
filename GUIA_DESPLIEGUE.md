# 🚀 Guía de Despliegue de Microservicios

## Orden de Despliegue Recomendado

### Phase 1: Infraestructura Base
1. **EC2-DB** (Base de Datos)
   - Workflow: `deploy-ec2-db.yml`
   - Contiene: PostgreSQL, MongoDB, Redis
   - Tiempo: ~3-5 minutos

2. **EC2-CORE** (Servicios Core)
   - Workflow: `deploy-ec2-core.yml`
   - Contiene: Servicios de autenticación y base
   - Tiempo: ~5-7 minutos

### Phase 2: Servicios de Soporte
3. **EC2-Messaging** (Message Broker)
   - Workflow: `deploy-ec2-messaging.yml`
   - Contiene: Kafka, RabbitMQ, MQTT
   - Tiempo: ~5 minutos

4. **EC2-Monitoring** (Observabilidad)
   - Workflow: `deploy-ec2-monitoring.yml`
   - Contiene: Prometheus, Grafana
   - Tiempo: ~3 minutos

### Phase 3: Servicios de Aplicación
5. **EC2-API-Gateway**
   - Workflow: `deploy-ec2-api-gateway.yml`
   - Puerto: 8080
   - Tiempo: ~3 minutos

6. **EC2-Frontend**
   - Workflow: `deploy-ec2-frontend.yml`
   - Puerto: 5500
   - Tiempo: ~3 minutos

7. **EC2-Reportes**
   - Workflow: `deploy-ec2-reportes.yml`
   - Puerto: 5003-5004
   - Tiempo: ~3 minutos

8. **EC2-Notificaciones**
   - Workflow: `deploy-ec2-notificaciones.yml`
   - Puerto: 5006
   - Tiempo: ~3 minutos

9. **EC2-Analytics**
   - Workflow: `deploy-ec2-analytics.yml`
   - Puerto: 5007
   - Tiempo: ~3 minutos

10. **EC2-Bastion** (Opcional)
    - Workflow: `deploy-ec2-bastion.yml`
    - Punto de entrada SSH
    - Tiempo: ~2 minutos

---

## ¿Cómo Triggerear los Workflows?

### Opción 1: Desde GitHub UI (Recomendado)
1. Ve a tu repositorio en GitHub
2. Selecciona la rama `main`
3. Click en **Actions**
4. Selecciona el workflow (ej: `Deploy EC2-DB`)
5. Click en **Run workflow**
6. Si es necesario, configura parámetros
7. Click en **Run workflow**

### Opción 2: Desde Terminal (Manual Push)
```bash
# Solo hace push, GitHub Actions se triggeará automáticamente
# si hay cambios en los archivos del servicio
git push origin main
```

### Opción 3: GitHub CLI
```bash
# Instalar GitHub CLI si no lo tienes
brew install gh  # macOS
choco install gh # Windows

# Loguearse
gh auth login

# Triggerear workflow
gh workflow run deploy-ec2-db.yml --ref main
gh workflow run deploy-ec2-core.yml --ref main
# ... y así para todos
```

---

## Monitorear Workflows

### Desde GitHub UI
1. Ve a **Actions**
2. Selecciona el workflow en ejecución
3. Click en el job para ver logs en tiempo real

### Desde Terminal
```bash
# Con GitHub CLI
gh run list --limit 10
gh run view <RUN_ID> --log

# Ver status de un workflow específico
gh workflow view deploy-ec2-db.yml
```

---

## Validación de Endpoints

Después de cada despliegue, ejecuta:

```bash
python3 validate-endpoints.py
```

Este script verifica:
- ✅ API Gateway (puerto 8080)
- ✅ Frontend (puerto 5500)
- ✅ Monitoring (puerto 9090)
- ✅ Todos los microservicios

---

## Resolver Errores Comunes

### Error: "SSH connection refused"
**Causa:** Instancia no tiene IP pública o Security Group no permite SSH
**Solución:**
```bash
# Verificar que EC2-Bastion está corriendo
ssh bastion

# Luego acceder a través de Bastion
ssh -J bastion core
```

### Error: "Docker image not found"
**Causa:** Imagen no se subió a Docker Hub correctamente
**Solución:**
```bash
# Verificar que existen los secrets:
# - DOCKER_USERNAME
# - DOCKER_TOKEN

# Re-triggerear el build
gh workflow run deploy-ec2-<SERVICE>.yml --ref main
```

### Error: "Connection to database failed"
**Causa:** EC2-DB no está corriendo o Puerto 5432 no es accesible
**Solución:**
1. Primero desplegar EC2-DB
2. Verificar Security Group permite 5432 desde EC2-Microservicios
3. Verificar que contenedores estén activos:
```bash
ssh db
docker ps
docker logs postgres
```

### Error: "Port already in use"
**Causa:** Contenedor anterior aún está corriendo
**Solución:**
```bash
ssh -i ~/.ssh/labsuser.pem ubuntu@<IP>
docker stop <container_name>
docker rm <container_name>
```

---

## Verificación Post-Despliegue

### 1. Verificar Contenedores
```bash
ssh core
docker ps  # Ver contenedores activos
docker logs <container_id>  # Ver logs
```

### 2. Verificar Conectividad Interna
```bash
ssh core

# Probar conexión a BD
nc -zv 172.31.67.126 5432
nc -zv 172.31.67.126 27017
nc -zv 172.31.67.126 6379
```

### 3. Verificar Endpoints Externos
```bash
# Desde tu máquina local
curl http://<EC2-API-Gateway-IP>:8080/api/health
curl http://<EC2-Frontend-IP>:5500/
```

### 4. Verificar Logs
```bash
python3 validate-endpoints.py
python3 check-container-logs.py
```

---

## Timeouts y Reintentos

Cada workflow:
- Intenta 3 veces si falla SSH
- Timeout de 5 minutos por step
- Total aprox: **30-45 minutos** para todos los despliegues

---

## Limpiar y Reintentar

Si algo sale mal, puedes:

### Opción 1: Re-triggerear (Recomendado)
```bash
gh workflow run deploy-ec2-<SERVICE>.yml --ref main
```

### Opción 2: Limpiar Contenedores (Manual)
```bash
# En cada instancia EC2
ssh <host>
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker system prune -f
```

### Opción 3: Rollback (Volver a versión anterior)
```bash
git revert <COMMIT_HASH>
git push origin main
# Trigger workflows nuevamente
```

---

## Variables de Entorno Necesarias

Todos los workflows usan estas variables. Asegurate que estén en GitHub Secrets:

```
✅ AWS_ACCESS_KEY_ID
✅ AWS_SECRET_ACCESS_KEY
✅ AWS_SESSION_TOKEN
✅ AWS_REGION (default: us-east-1)
✅ DOCKER_USERNAME
✅ DOCKER_TOKEN
✅ SSH_PRIVATE_KEY (base64 encoded)
```

---

## Resumen del Flujo

```
1. Push a main (si hay cambios en archivos del servicio)
   ↓
2. GitHub Actions triggeerea automáticamente el workflow
   ↓
3. Workflow ejecuta:
   - update_instance_ips.py (obtiene IPs actuales)
   - get_instance_ip.py (resuelve IP del servicio)
   - Build Docker image
   - Push a Docker Hub
   - SSH a instancia
   - Pull imagen, stop, remove, run
   ↓
4. Validar con validate-endpoints.py
   ↓
5. ✅ Servicio desplegado y funcionando
```

---

## Documentación de Referencia

- **Configuración de IPs**: [CONFIGURACION_VERIFICACION.md](CONFIGURACION_VERIFICACION.md)
- **Validador de Configuración**: `python3 validate-aws-config.py`
- **Validador de Endpoints**: `python3 validate-endpoints.py`
- **Workflows**: `.github/workflows/deploy-ec2-*.yml`

