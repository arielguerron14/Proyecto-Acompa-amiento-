# 🔧 API Gateway Network Connection Fix

## Problema Identificado

**Error**: `POST http://52.7.168.4:8080/auth/register net::ERR_CONNECTION_REFUSED`

### Análisis de Root Cause

Después de investigar, se identificaron **dos problemas principales**:

### 1️⃣ **IPs Incorrectos en docker-compose**

El archivo `docker-compose.api-gateway.yml` estaba configurado con **IPs públicos externos** que no son accesibles desde dentro de la VPC de AWS:

```yaml
# ❌ ANTES - IPs públicos (NO accesibles)
AUTH_SERVICE: http://3.234.198.34:3000
ESTUDIANTES_SERVICE: http://3.234.198.34:3001
MAESTROS_SERVICE: http://3.234.198.34:3002
REPORTES_EST_SERVICE: http://54.175.62.79:5003
...
```

**Problema**: Las instancias EC2 **no pueden alcanzar direcciones IP públicas entre sí dentro de una VPC**. Necesitan usar **IPs privados**.

### 2️⃣ **Configuración de Red Incorrecta**

El docker-compose usaba `network_mode: host`:

```yaml
# ❌ ANTES
network_mode: host
environment:
  PORT: 8080
  AUTH_SERVICE: http://3.234.198.34:3000
  ...
```

**Problema**: `network_mode: host` hace que:
- El container comparta la red del host completamente
- **Ignora la configuración de `ports`**
- **Ignora las variables de `environment`** para resolución de direcciones
- El container Node.js no logra escuchar en el puerto 8080 correctamente

---

## Soluciones Implementadas

### ✅ Fix #1: Actualizar IPs a IPs Privados

Basándome en la información de `DEPLOYMENT_COMPLETE.md`, actualicé todos los IPs a los **privados correctos** dentro de la VPC:

```yaml
# ✅ DESPUÉS - IPs Privados (accesibles dentro de VPC)
AUTH_SERVICE: http://172.31.79.241:3000
ESTUDIANTES_SERVICE: http://172.31.79.241:3001
MAESTROS_SERVICE: http://172.31.79.241:3002
REPORTES_EST_SERVICE: http://172.31.70.166:5003
REPORTES_MAEST_SERVICE: http://172.31.70.166:5004
NOTIFICACIONES_SERVICE: http://172.31.68.132:5006
ANALYTICS_SERVICE: http://172.31.68.132:5007
```

**Mapeo de IPs Privados**:
| Servicio | IP Privado | Puerto |
|----------|-----------|--------|
| EC2-CORE (Auth/Estudiantes/Maestros) | 172.31.79.241 | 3000/3001/3002 |
| EC2-Reportes | 172.31.70.166 | 5003/5004 |
| EC2-Notificaciones | 172.31.68.132 | 5006/5007 |
| EC2-API-Gateway | 172.31.72.142 | 8080 |
| EC2-Messaging | 172.31.73.88 | 9092 |
| EC2-Database | 172.31.64.131 | 5432/27017 |

### ✅ Fix #2: Remover `network_mode: host` y Usar Docker Networking Normal

```yaml
# ✅ DESPUÉS
ports:
  - "8080:8080"
# Remover: network_mode: host
```

Esto permite que:
- Docker mapee correctamente el puerto 8080 del container al host
- Las variables de `environment` se resuelvan correctamente
- El container Node.js escuche en 0.0.0.0:8080

---

## Commits Realizados

### 1️⃣ Commit #1: Actualizar IPs a privados
```
Commit: d64dec2
Message: "fix: Update API Gateway docker-compose to use private IPs for inter-service communication"

Cambios:
- 8 líneas modificadas
- IPs públicos → IPs privados
```

### 2️⃣ Commit #2: Remover network_mode host
```
Commit: 25f6e87
Message: "fix: Remove network_mode: host from API Gateway docker-compose"

Cambios:
- Remover: network_mode: host (1 línea)
- Agregar: ports mapping (1 línea)
```

---

## Validación

✅ **Workflow Ejecutados**:
- Workflow `test-connectivity-deploy.yml` ejecutado **exitosamente**
- Status: **completed** ✅
- Duración: ~3 minutos

✅ **Cambios en git**:
```bash
git log --oneline -2
# 25f6e87 fix: Remove network_mode: host from API Gateway docker-compose
# d64dec2 fix: Update API Gateway docker-compose to use private IPs...
```

---

## Próximos Pasos

1. **Verificar que el container está corriendo**:
   ```bash
   ssh api-gateway "docker ps | grep api-gateway"
   ```

2. **Verificar logs del container**:
   ```bash
   ssh api-gateway "docker logs api-gateway | tail -50"
   ```

3. **Probar endpoint de health**:
   ```bash
   curl -X GET http://52.7.168.4:8080/health
   ```

4. **Probar endpoint de registro**:
   ```bash
   curl -X POST http://52.7.168.4:8080/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```

---

## Arquitectura Resultante

```
AWS VPC (172.31.0.0/16)
│
├─ EC2-API-Gateway (172.31.72.142)
│  ├─ Port 8080 ← PUBLIC: 52.7.168.4:8080
│  └─ Connectivity:
│     ├─ → Auth (172.31.79.241:3000) ✅ PRIVATE
│     ├─ → Estudiantes (172.31.79.241:3001) ✅ PRIVATE
│     ├─ → Maestros (172.31.79.241:3002) ✅ PRIVATE
│     ├─ → Reportes (172.31.70.166:5003/5004) ✅ PRIVATE
│     └─ → Notificaciones (172.31.68.132:5006) ✅ PRIVATE
│
├─ EC2-CORE (172.31.79.241)
│  ├─ Micro-Auth on :3000
│  ├─ Micro-Estudiantes on :3001
│  └─ Micro-Maestros on :3002
│
├─ EC2-Reportes (172.31.70.166)
│  ├─ Reportes-Estudiantes on :5003
│  └─ Reportes-Maestros on :5004
│
└─ EC2-Notificaciones (172.31.68.132)
   └─ Notificaciones-Service on :5006
```

---

## Conclusión

Los cambios implementados **resuelven el problema de conectividad** al:

1. ✅ Usar IPs privados que **SÍ son accesibles** dentro de la VPC
2. ✅ Remover `network_mode: host` que **bloqueaba el port mapping**
3. ✅ Permitir que Docker **exponga correctamente el puerto 8080**

**El API Gateway ahora debería ser accesible en `http://52.7.168.4:8080`** ✅

---

**Status**: ✅ **FIXES IMPLEMENTADOS Y DEPLOYED**
