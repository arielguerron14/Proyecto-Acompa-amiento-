# 🔧 BUILD CONTEXT FIXES - DOCKERFILES

## ❌ El Problema

El error en GitHub Actions:
```
ERROR: failed to build: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref ...: "/micro-analytics/src": not found
```

**Causa:** Los Dockerfiles tenían rutas como `COPY micro-analytics/src ./src` pero el build context era la raíz del repo, no el directorio del servicio.

---

## ✅ Correcciones Implementadas

### 1. Actualizar Dockerfiles

**Antes (❌ Incorrecto):**
```dockerfile
WORKDIR /usr/src/app
COPY micro-analytics/package*.json ./
COPY micro-analytics/src ./src
```

**Después (✅ Correcto):**
```dockerfile
WORKDIR /usr/src/app
COPY package*.json ./
COPY src ./src
```

**Archivos corregidos:**
- ✅ `micro-analytics/Dockerfile`
- ✅ `micro-maestros/Dockerfile`
- ✅ `micro-estudiantes/Dockerfile`
- ✅ `micro-auth/Dockerfile`

### 2. Actualizar Workflows

**Antes (❌ Incorrecto):**
```yaml
- name: Build and push micro-auth
  uses: docker/build-push-action@v4
  with:
    context: .  # Contexto: raíz del repo
    file: micro-auth/Dockerfile
```

**Después (✅ Correcto):**
```yaml
- name: Build and push micro-auth
  uses: docker/build-push-action@v4
  with:
    context: micro-auth  # Contexto: directorio del servicio
    file: micro-auth/Dockerfile
```

**Archivos corregidos:**
- ✅ `.github/workflows/deploy-ec2-core.yml` (micro-auth, micro-estudiantes, micro-maestros)
- ✅ `.github/workflows/deploy-ec2-analytics.yml` (ya tenía context correcto)

---

## 🚀 Cómo Funciona Ahora

### Docker Build Process

1. **GitHub Actions** ejecuta:
   ```bash
   docker buildx build \
     --file micro-analytics/Dockerfile \
     --context micro-analytics \  # ← Este es el cambio clave
     --tag caguerronp/micro-analytics:latest \
     --push .
   ```

2. **Docker** interpreta:
   - Build context: `micro-analytics/` (la raíz para COPY)
   - Dockerfile: `micro-analytics/Dockerfile`
   - COPY commands: Relativas a `micro-analytics/`

3. **Resultado:**
   ```dockerfile
   # Ahora busca en micro-analytics/package*.json ✅
   COPY package*.json ./
   
   # Ahora busca en micro-analytics/src ✅
   COPY src ./src
   ```

---

## ✅ Verificación

### Test Local

```bash
# Navegar al directorio del servicio
cd micro-analytics

# Build con contexto local
docker build -t micro-analytics:test -f Dockerfile .

# Debe funcionar sin errores de ruta
```

### Test en GitHub Actions

El siguiente push a `main` que toque alguno de estos archivos disparará el workflow:
```
- micro-auth/**
- micro-estudiantes/**
- micro-maestros/**
- micro-analytics/**
```

Deberías ver:
- ✅ `[internal] load build context: transferring context` (sin errores)
- ✅ `[3/6] COPY package*.json ./: DONE` 
- ✅ `[5/6] COPY src ./src: DONE`
- ✅ `push <service>:latest to registry`

---

## 📝 Resumen de Cambios

| Archivo | Cambio | Impacto |
|---------|--------|--------|
| Dockerfiles (4x) | Remover prefijo `micro-XXX/` en COPY | Build works correctly |
| deploy-ec2-core.yml | Cambiar context a `micro-auth`, etc | Apunta build context a directorio correcto |
| deploy-ec2-analytics.yml | Ya estaba correcto | No requiere cambio |

---

## 🎯 Próximos Pasos

1. **Commit y push** estos cambios:
   ```bash
   git add .
   git commit -m "fix: corregir Dockerfile paths y build contexts para GitHub Actions"
   git push origin main
   ```

2. **Verificar** que los workflows ejecuten exitosamente:
   - Ve a GitHub → Actions
   - Busca "Deploy EC2-CORE" o "Deploy EC2-Analytics"
   - Verifica que Build and push step sea ✅ green

3. **Monitorear** deployment en EC2:
   ```bash
   ssh -i ~/.ssh/labsuser.pem ubuntu@3.226.242.64
   docker ps
   docker logs micro-auth
   ```

---

**Estado:** ✅ BUILD CONTEXT FIXES APPLIED  
**Fecha:** 17 de Enero 2026
