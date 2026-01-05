# 📋 PROCEDIMIENTO: Cambiar IPs en AWS Académico

## 🎯 Cuándo usar este procedimiento

Cuando AWS Académico renueve las IPs públicas/privadas de las instancias EC2 (como sucede regularmente).

---

## 📊 Paso 1: Obtener las Nuevas IPs

### De la consola de AWS:
1. Ir a EC2 → Instancias
2. Buscar instancias del proyecto
3. Anotar las nuevas IPs:
   - **EC2-API-Gateway**: IP pública (nueva)
   - **EC2-CORE**: IP privada (nueva)
   - **EC2-DB**: IP privada (nueva)
   - **EC2-Frontend**: IP pública (nueva)

**Ejemplo:**
```
Antes:
  API Gateway: 100.48.66.29 → Ahora: 100.50.12.34
  Frontend:    44.210.134.93 → Ahora: 44.211.56.78
  Core:        13.223.196.229 → Ahora: 13.224.50.100
  DB:          13.220.99.207 → Ahora: 13.221.10.50
```

---

## 📝 Paso 2: Editar Configuración

### Abrir el archivo de configuración
```bash
nano .env.infrastructure
```

### O con tu editor favorito
```bash
code .env.infrastructure
vim .env.infrastructure
```

### Cambiar las IPs

```ini
# ============================================
# IPs PÚBLICAS (acceso externo)
# ============================================

API_GATEWAY_IP=100.50.12.34              # ← CAMBIAR
API_GATEWAY_PORT=8080

FRONTEND_IP=44.211.56.78                 # ← CAMBIAR
FRONTEND_PORT=80

NOTIFICACIONES_IP=100.50.12.34            # ← Si cambió
NOTIFICACIONES_PORT=5006

MESSAGING_IP=100.50.12.34                 # ← Si cambió
MESSAGING_PORT=5007

REPORTES_IP=100.50.12.34                  # ← Si cambió
REPORTES_ESTUDIANTES_PORT=5003
REPORTES_MAESTROS_PORT=5004

# ============================================
# IPs PRIVADAS (comunicación interna)
# ============================================

CORE_IP=13.224.50.100                     # ← CAMBIAR
AUTH_PORT=3000
ESTUDIANTES_PORT=3001
MAESTROS_PORT=3002

DB_IP=13.221.10.50                        # ← CAMBIAR
MONGO_PORT=27017
POSTGRES_PORT=5432
REDIS_PORT=6379
```

**Guarda el archivo (Ctrl+S en nano, :wq en vim)**

---

## 🔨 Paso 3: Compilar Configuración

```bash
npm run build:infrastructure
```

**Debe mostrar:**
```
🏗️  Compilando configuración de infraestructura...
✅ Configuración de infraestructura validada correctamente
📊 RESUMEN DE CONFIGURACIÓN
🌐 IPs PÚBLICAS:
   API Gateway:  100.50.12.34:8080
   Frontend:     44.211.56.78:80
   ...
✅ Configuración compilada exitosamente
```

---

## ✅ Paso 4: Validar Configuración

```bash
npm run validate:infrastructure
```

**Debe mostrar:**
```
✅ VALIDACIÓN EXITOSA - Infraestructura correctamente configurada
```

Si hay errores, vuelve a Paso 2 y verifica las IPs.

---

## 🚀 Paso 5: Reconstruir y Desplegar

### Opción A: Automático (recomendado)
```bash
npm run rebuild:services
```

Esto:
1. Detiene servicios viejos
2. Reconstruye imágenes Docker
3. Inicia nuevos servicios
4. Inyecta configuración

### Opción B: Manual (más control)
```bash
# 1. Construir imágenes
docker-compose build

# 2. Detener servicios viejos
docker-compose down

# 3. Iniciar nuevos servicios
docker-compose up -d

# 4. Ver logs
docker-compose logs -f
```

---

## 🔍 Paso 6: Verificar que Funciona

### Health check
```bash
curl http://localhost:8080/health
```

Debe responder:
```json
{"status": "OK", "message": "API Gateway is running"}
```

### Verificar variables en contenedores
```bash
# Auth Service
docker exec micro-auth env | grep -E "MONGO|AUTH|DB"

# API Gateway
docker exec api-gateway env | grep -E "AUTH_SERVICE|ESTUDIANTES"

# Estudiantes
docker exec micro-estudiantes env | grep -E "MONGO|PORT"
```

### Ver logs
```bash
docker-compose logs -f api-gateway
docker-compose logs -f micro-auth
docker-compose logs -f micro-estudiantes
docker-compose logs -f micro-maestros
```

### Probar login en navegador
```
http://localhost:5500   (Frontend local)
http://44.211.56.78     (Frontend en AWS - con nuevas IPs)
```

---

## 📊 Verificación Completa

| Servicio | Verificación | Comando |
|----------|--------------|---------|
| API Gateway | Health check | `curl http://localhost:8080/health` |
| Auth | Log de conexión | `docker logs micro-auth \| grep MONGO` |
| Estudiantes | Log de conexión | `docker logs micro-estudiantes \| grep MONGO` |
| Maestros | Log de conexión | `docker logs micro-maestros \| grep MONGO` |
| Frontend | Cargar en navegador | http://localhost:5500 |

---

## 🆘 Troubleshooting

### Si Auth no conecta a MongoDB:
```bash
# Ver logs detallados
docker logs micro-auth

# Revisar si .env tiene la IP correcta
docker exec micro-auth env | grep MONGO_URI

# Reconstruir Auth
docker-compose build micro-auth
docker-compose up -d micro-auth
docker logs -f micro-auth
```

### Si API Gateway no llega a Auth:
```bash
# Ver configuración del gateway
docker exec api-gateway env | grep AUTH_SERVICE

# Probar conectividad
docker exec api-gateway curl -v http://13.224.50.100:3000/health

# Reconstruir gateway
docker-compose build api-gateway
docker-compose up -d api-gateway
```

### Si Frontend no carga:
```bash
# Verificar que servidor esté corriendo
curl -v http://localhost:5500

# Ver logs del frontend
docker logs frontend-web

# Reconstruir
docker-compose build frontend-web
docker-compose up -d frontend-web
```

---

## 📋 Checklist de Verificación

- [ ] Obtuve las nuevas IPs de AWS
- [ ] Edité `.env.infrastructure` con las nuevas IPs
- [ ] Ejecuté `npm run build:infrastructure`
- [ ] Ejecuté `npm run validate:infrastructure` (sin errores)
- [ ] Ejecuté `npm run rebuild:services`
- [ ] Esperé 30-60 segundos a que inicie todo
- [ ] Ejecuté `curl http://localhost:8080/health` (responde OK)
- [ ] Verifiqué logs de servicios (sin errores)
- [ ] Probé login en navegador (funciona)
- [ ] Verifiqué que reports, notificaciones, etc. funcionan

---

## ⏱️ Tiempo Total

| Paso | Tiempo |
|------|--------|
| 1. Obtener IPs | 2 min |
| 2. Editar archivo | 2 min |
| 3. Compilar | 1 min |
| 4. Validar | 1 min |
| 5. Reconstruir | 3-5 min |
| 6. Verificar | 3-5 min |
| **Total** | **12-16 min** |

---

## 💾 Guardar Cambios en Git (Opcional)

Si quieres guardar este cambio en la historia de Git:

```bash
git add .env.infrastructure .env .env.generated
git commit -m "chore: Actualizar IPs de AWS - nuevo rango de direcciones"
git push origin main
```

---

## 🔄 Si Algo Sale Mal

### Rollback a IPs anteriores
```bash
# 1. Deshacer cambios
git checkout .env.infrastructure

# 2. Reconstruir
npm run build:infrastructure
npm run rebuild:services

# 3. Verificar
curl http://localhost:8080/health
```

### Limpiar todo y empezar de nuevo
```bash
# 1. Detener servicios
docker-compose down

# 2. Editar IPs
nano .env.infrastructure

# 3. Compilar
npm run build:infrastructure

# 4. Reconstruir desde cero
docker-compose build --no-cache
docker-compose up -d

# 5. Ver logs
docker-compose logs -f
```

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica las IPs en AWS (Console → EC2 → Instancias)
2. Confirma que `.env.infrastructure` tiene las IPs correctas
3. Ejecuta `npm run validate:infrastructure`
4. Revisa logs: `docker-compose logs`
5. Si persiste, limpia todo y empieza de nuevo (ver sección anterior)

---

**Procedimiento versión:** 1.0
**Última actualización:** 5 Enero 2026

**Duración esperada:** 15 minutos
**Complejidad:** Baja (solo editar 1 archivo)
