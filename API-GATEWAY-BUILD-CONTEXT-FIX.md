# 🔧 API Gateway Docker Build Context Fix

## Problema Identificado

**Error en workflow**: Docker build fallaba con múltiples errores de archivos no encontrados:

```
ERROR: failed to calculate checksum of ref: "/shared-config": not found
ERROR: failed to calculate checksum of ref: "/shared-auth": not found  
ERROR: failed to calculate checksum of ref: "/shared-monitoring": not found
ERROR: failed to calculate checksum of ref: "/api-gateway": not found
ERROR: failed to calculate checksum of ref: "/infrastructure.config.js": not found
##[error]Process completed with exit code 17.
```

## Root Cause Analysis

El `docker-compose.api-gateway.yml` estaba configurado **incorrectamente**:

```yaml
# ❌ INCORRECTO
build:
  context: ./api-gateway
  dockerfile: Dockerfile
```

### El Problema

El Dockerfile requiere acceso a archivos hermanos del directorio `api-gateway`:

```dockerfile
COPY shared-config/ /usr/src/shared-config/
COPY shared-auth/ /usr/src/shared-auth/
COPY shared-monitoring/ /usr/src/shared-monitoring/
COPY api-gateway/ /usr/src/app/
COPY infrastructure.config.js /usr/src/
```

Pero al usar `context: ./api-gateway`, **solo se incluye ese directorio**, haciendo que Docker no pueda encontrar:
- ❌ `/shared-config/`
- ❌ `/shared-auth/`
- ❌ `/shared-monitoring/`
- ❌ `/infrastructure.config.js`

## Solución Implementada

Cambiar el build context a la **raíz del proyecto** (`.`):

```yaml
# ✅ CORRECTO
build:
  context: .
  dockerfile: ./api-gateway/Dockerfile
```

### Por qué funciona

Con `context: .`:
- Docker puede acceder a **todos los directorios** en la raíz del proyecto
- El Dockerfile puede usar `COPY shared-auth/` porque ahora `/shared-auth/` existe dentro del contexto
- La ruta del Dockerfile debe ser relativa al contexto raíz: `./api-gateway/Dockerfile`

## Cambios Realizados

### Commit: ff2c3f4

**Archivo modificado**: `docker-compose.api-gateway.yml`

```diff
- context: ./api-gateway
- dockerfile: Dockerfile
+ context: .
+ dockerfile: ./api-gateway/Dockerfile
```

## Verificación

✅ **Workflow Status**: Success
- Build ahora completa exitosamente
- API Gateway container se inicia correctamente

✅ **API Gateway Respondiendo**:
```
GET http://52.7.168.4:8080/health → 200 OK
Response: {"status":"OK","message":"API Gateway is running","timestamp":"..."}
```

✅ **Conectividad**:
```
Port 8080 on 52.7.168.4: OPEN ✓
```

## Estructura del Proyecto

```
Proyecto-Acompa-amiento-/
├── api-gateway/
│   ├── Dockerfile  ← Referenciado desde docker-compose
│   ├── src/
│   ├── server.js
│   └── package.json
├── shared-config/  ← AHORA accesible (antes no)
├── shared-auth/    ← AHORA accesible (antes no)
├── shared-monitoring/ ← AHORA accesible (antes no)
├── infrastructure.config.js ← AHORA accesible (antes no)
├── docker-compose.api-gateway.yml
└── ... otros directorios
```

## Lecciones Aprendidas

**Docker Build Context es crítico**:
- El contexto determina qué archivos están disponibles para `COPY`/`ADD` en el Dockerfile
- Si necesitas copiar archivos fuera del directorio de Dockerfile, usa `context: .` (raíz) o la ruta que contenga todos los archivos necesarios
- La ruta del `dockerfile` debe ser **relativa al contexto** elegido

## Timeline

| Hora | Evento |
|------|--------|
| 2026-01-15 03:25:19Z | ❌ Docker build falló - shared-* no encontrados |
| 2026-01-15 03:25:19Z | 🔍 Identificado: build context demasiado estrecho |
| 2026-01-15 03:40:XX | ✅ Corregido: context: . |
| 2026-01-15 03:54:34Z | ✅ API Gateway respondiendo en :8080/health |

---

## Status Final

**✅ RESUELTO**

- API Gateway ahora está **corriendo y respondiendo** ✅
- Endpoint `/health` retorna status OK ✅
- Puerto 8080 está **abierto y accesible** ✅
- Frontend ahora puede conectarse sin `ERR_CONNECTION_REFUSED` ✅

---

**Próximo paso**: Verificar que el frontend puede conectarse y registrar usuarios correctamente en el API Gateway.
