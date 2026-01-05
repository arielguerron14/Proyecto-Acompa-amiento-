# 🏗️ Guía de Configuración Centralizada de Infraestructura

## 📋 Resumen

Este proyecto utiliza un sistema centralizado de configuración de IPs que permite cambiar todas las IPs de infraestructura desde **UN ÚNICO ARCHIVO**, sin necesidad de modificar código en los microservicios.

**Archivo Principal:**
- `infrastructure.config.js` - Configuración centralizada de todas las IPs
- `.env.infrastructure` - Variables de entrada (las que el usuario modifica)
- `.env` - Variables generadas automáticamente (NO EDITAR)

## 🎯 Arquit ectura

```
.env.infrastructure (Usuario modifica aquí)
         ↓
build-infrastructure.js (Script que compila)
         ↓
infrastructure.config.js (Lee variables)
         ↓
.env (Generado automáticamente)
         ↓
Servicios leen desde config/index.js (que usa infrastructure.config.js)
         ↓
Contenedores Docker (inyectan configuración via entrypoint.sh)
```

## 🚀 Flujo de Uso

### 1️⃣ Cuando cambian las IPs en AWS

Edita `.env.infrastructure` con las nuevas IPs:

```bash
# .env.infrastructure

# IPs PÚBLICAS (para acceso externo)
API_GATEWAY_IP=100.48.66.29      # ← Cambiar aquí
API_GATEWAY_PORT=8080
FRONTEND_IP=44.210.134.93         # ← Cambiar aquí
FRONTEND_PORT=80

# IPs PRIVADAS (para comunicación interna)
CORE_IP=13.223.196.229            # ← Cambiar aquí
DB_IP=13.220.99.207               # ← Cambiar aquí
```

### 2️⃣ Generar configuración

```bash
# Compilar variables de infraestructura
npm run build:infrastructure

# Validar que todo esté correcto
npm run validate:infrastructure
```

### 3️⃣ Reconstruir contenedores

```bash
# Opción A: Reconstruir y reiniciar
npm run rebuild:services

# Opción B: Manual (más control)
docker-compose build
docker-compose down
docker-compose up -d
```

### 4️⃣ Verificar que funciona

```bash
# Ver logs
docker-compose logs -f api-gateway

# Probar endpoint
curl http://localhost:8080/health
```

## 📁 Estructura de Archivos

```
proyecto-root/
├── infrastructure.config.js          ← Configuración centralizada (Lee .env)
├── .env.infrastructure               ← Variables de entrada (EDITAR AQUÍ)
├── .env                              ← Generado (NO EDITAR)
├── .env.generated                    ← Copia para referencia
├── docker-entrypoint.sh              ← Script que inyecta config en contenedores
├── docker-compose.yml                ← Pasa variables a contenedores
│
├── scripts/
│   ├── build-infrastructure.js       ← Compila .env desde .env.infrastructure
│   ├── validate-infrastructure.js    ← Valida la configuración
│   └── gen-config.js                 ← Genera .env.local en servicios
│
├── api-gateway/
│   ├── src/config/index.js           ← Lee infrastructure.config.js
│   ├── Dockerfile                    ← Copia infrastructure.config.js
│   └── server.js                     ← Usa config para URLs
│
├── micro-auth/
│   ├── src/config/index.js           ← Lee infrastructure.config.js
│   └── Dockerfile                    ← Copia infrastructure.config.js
│
├── micro-estudiantes/
│   ├── src/config/index.js           ← Lee infrastructure.config.js
│   └── Dockerfile                    ← Copia infrastructure.config.js
│
├── micro-maestros/
│   ├── src/config/index.js           ← Lee infrastructure.config.js
│   └── Dockerfile                    ← Copia infrastructure.config.js
│
└── frontend-web/
    ├── js/config.js                  ← Usa API Gateway URL desde entorno
    └── server.js                     ← Sirve HTML estático
```

## 🔧 Cómo Funciona Internamente

### 1. Script de compilación (npm run build:infrastructure)

```javascript
build-infrastructure.js:
1. Lee .env.infrastructure
2. Carga infrastructure.config.js
3. Valida que todas las IPs estén configuradas
4. Genera .env con todas las variables expandidas
5. Muestra resumen de configuración
```

### 2. Carga en servicios

```javascript
// En cada service (ej: micro-auth/src/config/index.js)

// Primero intenta cargar desde .env.local (generado por docker)
if (process.env.MONGO_URI) return process.env.MONGO_URI;

// Luego intenta cargar desde infrastructure.config.js
if (infraConfig && infraConfig.PRIVATE.MONGO_URL) 
  return infraConfig.PRIVATE.MONGO_URL();

// Finalmente, usa fallback
return 'mongodb://mongo:27017/authdb';
```

### 3. Inyección en Docker

```dockerfile
# En Dockerfile
COPY infrastructure.config.js /usr/src/
COPY scripts/gen-config.js /usr/src/scripts/
COPY docker-entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

```bash
# En entrypoint.sh (ejecutado al iniciar contenedor)
node scripts/gen-config.js all
exec "$@"  # Iniciar el servicio
```

## 🌍 Ambientes

### Desarrollo (Local)
- `.env.infrastructure` → ENVIRONMENT=development
- Servicios usan `localhost` o nombres DNS de docker-compose (`mongo`, `redis`)
- Frontend usa proxy `/api` → localhost:8080

### Producción (AWS)
- `.env.infrastructure` → ENVIRONMENT=production
- Servicios usan IPs privadas de EC2 (ej: 13.223.196.229)
- Frontend usa IP pública de API Gateway (ej: 100.48.66.29)

## ⚙️ Configuración por Variable

### IPs PÚBLICAS (para acceso externo)

```bash
API_GATEWAY_IP=100.48.66.29          # IP pública de API Gateway
API_GATEWAY_PORT=8080                 # Puerto API Gateway
FRONTEND_IP=44.210.134.93             # IP pública de Frontend
FRONTEND_PORT=80                      # Puerto Frontend
NOTIFICACIONES_IP=100.28.217.159      # IP Notificaciones
REPORTES_IP=100.28.217.159            # IP Reportes
```

### IPs PRIVADAS (para comunicación interna entre EC2s)

```bash
CORE_IP=13.223.196.229                # IP privada de EC2-CORE
  AUTH_PORT=3000
  ESTUDIANTES_PORT=3001
  MAESTROS_PORT=3002

DB_IP=13.220.99.207                   # IP privada de EC2-DB
  MONGO_PORT=27017
  POSTGRES_PORT=5432
  REDIS_PORT=6379
```

### Credenciales (Hardcodeadas)

```bash
DB_POSTGRES_USER=postgres
DB_POSTGRES_PASSWORD=password
DB_POSTGRES_DB=acompanamiento
```

## 🔍 Debugging

### Ver qué IPs está usando un servicio

```bash
# Ver variables de entorno en un contenedor
docker exec micro-auth env | grep -E "MONGO|AUTH|CORE|DB"

# Ver logs del entrypoint
docker compose logs api-gateway | head -50
```

### Validar configuración

```bash
# Ejecutar validador
npm run validate:infrastructure

# Ver configuración generada
cat .env
cat .env.generated
```

### Regenerar configuración

```bash
# Limpiar y reconstruir
rm .env .env.generated
npm run build:infrastructure
npm run validate:infrastructure
docker-compose build --no-cache
docker-compose up -d
```

## 📚 Referencia de Scripts

| Script | Propósito | Uso |
|--------|-----------|-----|
| `build-infrastructure.js` | Compilar .env desde .env.infrastructure | `npm run build:infrastructure` |
| `validate-infrastructure.js` | Validar configuración | `npm run validate:infrastructure` |
| `gen-config.js` | Generar .env.local en servicios | `node scripts/gen-config.js [servicio]` |
| `docker-entrypoint.sh` | Inyectar config en contenedores | Automático en Docker |

## 🚨 Casos de Uso Comunes

### Cambio de IP pública del API Gateway

```bash
# 1. Editar
nano .env.infrastructure
# Cambiar: API_GATEWAY_IP=100.48.66.29 → nueva IP

# 2. Compilar
npm run build:infrastructure

# 3. Reconstruir
docker-compose build api-gateway
docker-compose up -d api-gateway

# 4. Verificar
curl http://nueva-ip:8080/health
```

### Cambio de IP privada del Database

```bash
# 1. Editar
nano .env.infrastructure
# Cambiar: DB_IP=13.220.99.207 → nueva IP

# 2. Compilar
npm run build:infrastructure

# 3. Reconstruir todos (necesitan conectar a DB)
docker-compose build
docker-compose up -d

# 4. Verificar logs
docker-compose logs micro-auth | grep -i mongo
```

### Agregar nuevo servicio

1. Crear directorio: `micro-nuevo/`
2. Crear `micro-nuevo/src/config/index.js`:
```javascript
const infraConfig = require('../../../infrastructure.config.js');

module.exports = {
  PORT: process.env.PORT || 3099,
  MONGO_URI: infraConfig.PRIVATE.MONGO_URL(),
};
```
3. Actualizar `infrastructure.config.js` con nueva IP/puerto
4. Agregar en `docker-compose.yml`
5. Ejecutar: `npm run rebuild:services`

## ✅ Checklist de Despliegue

- [ ] Editar `.env.infrastructure` con nuevas IPs
- [ ] Ejecutar `npm run build:infrastructure`
- [ ] Ejecutar `npm run validate:infrastructure`
- [ ] Revisar `.env` generado
- [ ] Ejecutar `npm run rebuild:services`
- [ ] Esperar a que todos los contenedores inicien
- [ ] Verificar logs: `docker-compose logs -f`
- [ ] Probar endpoints: `curl http://IP:puerto/health`

## 🎓 Conceptos Clave

**IPs Públicas:** Accesibles desde internet (navegador, clientes externos)
- API Gateway IP: Donde el navegador envía solicitudes
- Frontend IP: Donde carga la aplicación web
- Reportes IP: Acceso público a reportes

**IPs Privadas:** Solo dentro de AWS/VPC (comunicación interna entre EC2s)
- Core IP: Donde corren Auth, Estudiantes, Maestros
- DB IP: Donde están MongoDB, PostgreSQL, Redis
- Nunca accesibles desde fuera de AWS

**Fallbacks:** Si una IP no está definida, el código usa valores por defecto
- Desarrollo: `localhost`, `mongo`, `redis`
- Producción: Requiere configuración explícita

## 📝 Notas Importantes

1. **No editar .env manualmente** - Se sobrescribe cada vez que ejecutas `build-infrastructure`
2. **Las credenciales siguen hardcodeadas** - Por especificación, no cambiar
3. **Cambios requieren rebuild** - No basta con cambiar .env, necesitas `docker build`
4. **Validar siempre** - Ejecuta `validate-infrastructure` antes de desplegar
5. **Los containers necesitan el archivo** - `infrastructure.config.js` se copia en Dockerfile

## 🔗 Flujo Completo de Cambio de IPs

```
Usuario edita .env.infrastructure
             ↓
npm run build:infrastructure
             ↓
infrastructure.config.js genera .env
             ↓
npm run validate:infrastructure
             ↓
docker-compose build (reconstruye imágenes)
             ↓
docker-compose up -d (inicia contenedores)
             ↓
docker-entrypoint.sh (inyecta config)
             ↓
Servicios leen infrastructure.config.js
             ↓
✅ Sistema funcional con nuevas IPs
```

---

**Última actualización:** Enero 2026
**Versión:** 1.0.0
