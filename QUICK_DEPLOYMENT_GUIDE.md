# 🚀 GUÍA RÁPIDA DE DESPLIEGUE - 10 INSTANCIAS

## ANTES DE INICIAR

1. ✅ Asegurar que GitHub Actions tiene los secrets correctos:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN` (opcional)

2. ✅ Verificar que las 10 instancias EC2 existen y están corriendo:
   - EC-Bastion
   - EC2-CORE
   - EC2-API-Gateway
   - EC2-Reportes
   - EC2-Notificaciones
   - EC2-Messaging
   - EC2-DB
   - EC2-Analytics
   - EC2-Monitoring
   - EC2-Frontend

3. ✅ Verificar que el SSH key existe y está en GitHub Secrets

## OPCIÓN A: DESPLEGAR TODAS A LA VEZ (RECOMENDADO PARA TESTING)

```bash
gh workflow run deploy.yml \
  -f instance="ALL_INSTANCES" \
  -f rebuild_docker="true" \
  -f environment="prod"
```

**Tiempo esperado:** 45-60 minutos (compilaciones paralelas)

**Verificación después:**
- Acceder a API Gateway: `http://<API-GATEWAY-IP>:8080/health`
- Acceder a Frontend: `http://<FRONTEND-IP>`
- Acceder a Grafana: `http://<MONITORING-IP>:3000`

---

## OPCIÓN B: DESPLEGAR POR FASE (RECOMENDADO PARA DEBUGGING)

### FASE 1: Servicios de Infraestructura (sin compilación custom)
Sin construir imágenes Docker personalizadas, solo arrancan servicios Docker Hub.

```bash
# Desplegar databases
gh workflow run deploy.yml \
  -f instance="EC2_DB" \
  -f rebuild_docker="false"

# Desplegar messaging (Kafka, Zookeeper, RabbitMQ)
gh workflow run deploy.yml \
  -f instance="EC2_MESSAGING" \
  -f rebuild_docker="false"

# Desplegar monitoring (Prometheus, Grafana)
gh workflow run deploy.yml \
  -f instance="EC2_MONITORING" \
  -f rebuild_docker="false"
```

**Esperar:** 10-15 minutos
**Verificar:** Las bases de datos están respondiendo

---

### FASE 2: Core Services (corazón del sistema)
Compila y despliega los 4 microservicios principales.

```bash
gh workflow run deploy.yml \
  -f instance="EC2_CORE" \
  -f rebuild_docker="true"
```

**Esperar:** 15-20 minutos
**Verificar:** 
```bash
# SSH a EC2-CORE
ssh -i your-key.pem ubuntu@<EC2-CORE-IP>
docker-compose ps  # Ver estado de servicios
docker-compose logs -f  # Ver logs en vivo
```

---

### FASE 3: API Gateway (single entry point)
**⚠️ CRÍTICO:** Se ejecuta DESPUÉS de EC2-CORE para que pueda descubrir su IP privada

```bash
gh workflow run deploy.yml \
  -f instance="EC2_API_GATEWAY" \
  -f rebuild_docker="true"
```

**Esperar:** 10-15 minutos
**Verificar:**
```bash
# Test health
curl http://<API-GATEWAY-IP>:8080/health

# O en el navegador
http://<API-GATEWAY-IP>:8080/health
```

**Si falla la conexión a Core:**
```bash
# SSH a API Gateway y revisar config
ssh -i your-key.pem ubuntu@<API-GATEWAY-IP>
docker-compose exec api-gateway env | grep CORE_HOST
docker-compose logs api-gateway | tail -100
```

---

### FASE 4: Servicios Adicionales
Después de validar que Core + API Gateway funcionan:

```bash
# Bastion host
gh workflow run deploy.yml -f instance="EC2_BASTION" -f rebuild_docker="true"

# Reportes
gh workflow run deploy.yml -f instance="EC2_REPORTES" -f rebuild_docker="true"

# Notificaciones
gh workflow run deploy.yml -f instance="EC2_NOTIFICACIONES" -f rebuild_docker="true"

# Analytics
gh workflow run deploy.yml -f instance="EC2_ANALYTICS" -f rebuild_docker="true"

# Frontend
gh workflow run deploy.yml -f instance="EC2_FRONTEND" -f rebuild_docker="true"
```

**Esperar:** 5-10 minutos por servicio
**Verificar:** Cada uno con `curl` o navegador

---

## OPCIÓN C: DESPLEGAR INSTANCIA INDIVIDUAL

```bash
gh workflow run deploy.yml \
  -f instance="EC2_CORE" \
  -f rebuild_docker="true"
```

Reemplazar `EC2_CORE` con:
- `EC2_BASTION`
- `EC2_API_GATEWAY`
- `EC2_REPORTES`
- `EC2_NOTIFICACIONES`
- `EC2_MESSAGING`
- `EC2_DB`
- `EC2_ANALYTICS`
- `EC2_MONITORING`
- `EC2_FRONTEND`

---

## MONITOREO DE WORKFLOW

```bash
# Ver workflows activos
gh run list --workflow deploy.yml --limit 5

# Ver logs de un run específico
gh run view <RUN_ID> --log

# Ver logs en tiempo real (si está corriendo)
gh run watch <RUN_ID>
```

---

## TESTING DESPUÉS DEL DESPLIEGUE

### 1. Test API Gateway Health
```bash
curl http://<API-GATEWAY-IP>:8080/health
```

Expected response: `200 OK` con JSON

### 2. Test Core Services
```bash
# Auth service
curl http://<API-GATEWAY-IP>:8080/auth/health

# Estudiantes service
curl http://<API-GATEWAY-IP>:8080/estudiantes/health

# Maestros service
curl http://<API-GATEWAY-IP>:8080/maestros/health
```

### 3. Test en Navegador
```
Frontend: http://<FRONTEND-IP>
Grafana: http://<MONITORING-IP>:3000 (usuario: admin, password: admin)
Prometheus: http://<MONITORING-IP>:9090
```

### 4. SSH para Debugging
```bash
# SSH a cualquier instancia
ssh -i your-key.pem ubuntu@<INSTANCE-IP>

# Ver status de servicios
docker-compose ps

# Ver logs
docker-compose logs -f [service-name]

# Ejecutar comando en contenedor
docker-compose exec [service-name] [command]

# Reiniciar servicio
docker-compose restart [service-name]
```

---

## TROUBLESHOOTING RÁPIDO

### API Gateway no puede conectar a Core
```bash
# En API Gateway, verificar CORE_HOST
docker-compose config | grep CORE_HOST

# Ping a Core private IP
docker-compose exec api-gateway ping 172.31.XX.XX

# Ver logs
docker-compose logs api-gateway | tail -50
```

### Servicio no inicia
```bash
# Ver logs detallados
docker-compose logs [service-name] --tail 100

# Ver error específico
docker-compose up [service-name]  # Sin -d, en foreground
```

### Limpiar y reintentar
```bash
# En la instancia afectada
docker-compose down
rm -rf volumes/*  # Si necesario
docker-compose up -d
```

---

## INFORMACIÓN DE MAPEO

**Tabla de Instancias:**

| Instancia | Servicios | Puerto | IP Tag |
|-----------|-----------|--------|--------|
| EC-Bastion | bastion-host | 2222 | EC-Bastion |
| EC2-CORE | micro-auth, estudiantes, maestros, core | 3000-3002, 5000 | EC2-CORE |
| EC2-API-Gateway | api-gateway | 8080 | EC2-API-Gateway |
| EC2-Reportes | micro-reportes-* | 5003-5004 | EC2-Reportes |
| EC2-Notificaciones | micro-notificaciones | 5005 | EC2-Notificaciones |
| EC2-Messaging | zookeeper, kafka, rabbitmq | 2181, 9092, 5672 | EC2-Messaging |
| EC2-DB | mongo, postgres, redis | 27017, 5432, 6379 | EC2-DB |
| EC2-Analytics | micro-analytics | 5006 | EC2-Analytics |
| EC2-Monitoring | prometheus, grafana | 9090, 3000 | EC2-Monitoring |
| EC2-Frontend | frontend-web | 80, 443 | EC2-Frontend |

---

## ROLLBACK RÁPIDO

Si algo falla y necesitas volver atrás:

```bash
# Detener todos los servicios en una instancia
ssh ubuntu@<INSTANCE-IP> "cd ~/app && docker-compose down"

# O simplemente reiniciar la instancia (por AWS Console)
# Toma ~2 minutos para reiniciar

# Luego redeploy
gh workflow run deploy.yml -f instance="EC2_CORE" -f rebuild_docker="true"
```

---

## LOGS Y DIAGNOSTICS

### Ver logs de última compilación en GitHub
```bash
# Ir a Actions en repo
# Seleccionar "deploy" workflow
# Click en último run
# Click en "Build Docker Images on EC2..."
# Ver step BUILDSSH
```

### Logs en EC2 después de despliegue
```bash
# SSH a instancia
ssh ubuntu@<IP>

# Ver últimos logs
docker-compose logs --tail=100

# Logs de un servicio específico
docker-compose logs microservice-name
```

---

**ÚLTIMA ACTUALIZACIÓN:** 2024
**PROYECTO:** Acompañamiento - 10 Instancias EC2
**STATUS:** ✅ LISTO PARA DESPLEGAR

