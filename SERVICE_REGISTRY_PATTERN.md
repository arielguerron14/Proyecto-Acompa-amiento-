# Service Registry Pattern - Single Point Routing

## Overview

El problema que resolvemos: **cuando la IP del EC2-CORE cambia, necesitas actualizar múltiples archivos, variables de entorno y configuraciones.**

La solución: **Un único punto de verdad (`CORE_HOST`) que controla todas las rutas.**

---

## ¿Cómo Funciona?

### 1. **Service Registry** (`api-gateway/config/service-registry.js`)
Centraliza TODA la configuración de servicios:

```javascript
CORE_HOST = process.env.CORE_HOST || 'http://172.31.79.241'

// Todos los servicios usan CORE_HOST
auth → ${CORE_HOST}:3000
estudiantes → ${CORE_HOST}:3001
maestros → ${CORE_HOST}:3002
reportes-est → ${CORE_HOST}:5003
reportes-maest → ${CORE_HOST}:5004
```

### 2. **Dynamic Proxy Middleware** (`api-gateway/middleware/proxy.js`)
Intercepta TODAS las peticiones y las enruta dinámicamente:

```
Cliente → GET /estudiantes/list
  ↓
proxyMiddleware
  ↓
Busca en SERVICE_REGISTRY: /estudiantes → "estudiantes"
  ↓
Obtiene URL: ${CORE_HOST}:3001
  ↓
Proxea a: http://172.31.79.241:3001/list
```

### 3. **Simplified Server** (`api-gateway/server.js`)
Ya no tiene rutas hardcodeadas. Solo:
- Configura CORS
- Monta el proxyMiddleware en todos los paths
- Expone endpoints de diagnóstico

---

## Cambio de IP - Procedimiento

### **ANTES (El Problema)**
Cuando EC2-CORE IP cambiaba de `172.31.79.241` a `3.236.51.29`:
```bash
# Actualizar .env
EC2_CORE_IP=3.236.51.29

# Actualizar docker-compose
environment:
  CORE_HOST: http://3.236.51.29

# Actualizar scripts Python
EC2_CORE_IP = "3.236.51.29"

# Actualizar middleware hardcodeado
const auth = 'http://3.236.51.29:3000'

# ❌ Múltiples lugares = Error propenso
```

### **AHORA (La Solución)**
```bash
# ✅ UN SOLO lugar
export CORE_HOST="http://3.236.51.29"

# Todos los servicios se actualizan automáticamente
curl http://localhost:8080/config
# Verás que todos apuntan a http://3.236.51.29
```

---

## API Endpoints de Diagnóstico

### `GET /health`
```json
{
  "status": "OK",
  "message": "API Gateway is running",
  "coreHost": "http://172.31.79.241"
}
```

### `GET /config`
```json
{
  "coreHost": "http://172.31.79.241",
  "services": {
    "auth": { "baseUrl": "http://172.31.79.241:3000", "port": 3000 },
    "estudiantes": { "baseUrl": "http://172.31.79.241:3001", "port": 3001 },
    "maestros": { "baseUrl": "http://172.31.79.241:3002", "port": 3002 },
    ...
  }
}
```

### `GET /services`
Lista todos los servicios disponibles

### `GET /health/extended`
Health check con estado de cada servicio

### `GET /routes`
Muestra todas las rutas disponibles

---

## Configuración

### Option 1: Environment Variable (RECOMENDADO)
```bash
# En .env o docker-compose
CORE_HOST="http://3.236.51.29"

# O en bash
export CORE_HOST="http://3.236.51.29"
```

### Option 2: docker-compose.yml
```yaml
api-gateway:
  environment:
    CORE_HOST: "http://172.31.79.241"
    PORT: 8080
```

### Option 3: GitHub Actions
```yaml
- name: Deploy
  env:
    CORE_HOST: ${{ env.EC2_CORE_IP }}
  run: docker-compose up -d api-gateway
```

---

## Ejemplos de Uso

### Llamar a Estudiantes
```bash
# Cliente siempre usa API Gateway
curl http://localhost:8080/estudiantes/list

# Service Registry resuelve a:
# http://172.31.79.241:3001/list
```

### Cambiar IP en Producción
```bash
# EC2-CORE IP cambió a 54.123.45.67

# Actualizar en GitHub Secrets:
CORE_HOST = "http://54.123.45.67"

# Re-deploy:
docker-compose up -d

# ✅ Todos los servicios usan la nueva IP automáticamente
```

### Verificar Configuración
```bash
# Ver configuración actual
curl http://localhost:8080/config

# Ver si todo está healthy
curl http://localhost:8080/health/extended

# Ver rutas disponibles
curl http://localhost:8080/routes
```

---

## Rutas Disponibles

Todos estos paths se enrutan automáticamente:

```
/auth/*              → CORE_HOST:3000/auth/*
/api/auth/*          → CORE_HOST:3000/auth/*
/estudiantes/*       → CORE_HOST:3001/estudiantes/*
/api/estudiantes/*   → CORE_HOST:3001/estudiantes/*
/maestros/*          → CORE_HOST:3002/maestros/*
/api/maestros/*      → CORE_HOST:3002/maestros/*
/horarios/*          → CORE_HOST:3002/horarios/*
/api/horarios/*      → CORE_HOST:3002/horarios/*
/reportes/*          → CORE_HOST:5003/reportes/*
/api/reportes/*      → CORE_HOST:5003/reportes/*
```

---

## Ventajas

✅ **Single Source of Truth**: Cambia `CORE_HOST` una vez, todo funciona  
✅ **No Hardcoding**: Cero IPs hardcodeadas en código  
✅ **Environment-Based**: Configurable por entorno  
✅ **Easy Debugging**: Endpoints de diagnóstico para verificar estado  
✅ **Scalable**: Agregar nuevos servicios es trivial  
✅ **Production Ready**: Usado en arquitecturas de microservicios reales  

---

## Troubleshooting

### "Service unavailable"
```bash
# 1. Verificar CORE_HOST está correcto
curl http://localhost:8080/config | grep coreHost

# 2. Verificar que EC2-CORE está arriba
curl http://172.31.79.241:3000/health

# 3. Verificar conectividad VPC
ping 172.31.79.241
```

### "Route not found"
```bash
# Ver rutas disponibles
curl http://localhost:8080/routes

# Verificar que el servicio está registrado en SERVICE_REGISTRY
curl http://localhost:8080/services
```

---

## Archivos Involucrados

1. **`api-gateway/config/service-registry.js`** - Configuración centralizada
2. **`api-gateway/middleware/proxy.js`** - Middleware de enrutamiento dinámico
3. **`api-gateway/server.js`** - Servidor simplificado (usa Registry + Middleware)
4. **`.env`** o **`docker-compose.yml`** - Define `CORE_HOST`

---

## Siguiente Paso

Para cambiar IP en producción:

```bash
# 1. Actualizar CORE_HOST en GitHub Secrets o .env
CORE_HOST="http://<nueva-ip>"

# 2. Re-deploy
./deploy.sh

# 3. Verificar
curl http://localhost:8080/health
```

¡Eso es todo! 🎉
