# 🔒 HARDCODED CONFIGURATION GUIDE

## Overview

Todos los IPs y configuraciones ahora están **hardcodeadas directamente en el código**.

**NO necesitas:**
- ❌ `.env.infrastructure`
- ❌ Variables de entorno para IPs
- ❌ Archivos de configuración externos

**Lo que tienes:**
- ✅ Configuración centralizada en `infrastructure.hardcoded.config.js`
- ✅ Configuraciones específicas por microservicio en cada `src/config/hardcoded.config.js`
- ✅ Todo hardcodeado, listo para producción

---

## 📁 Estructura de Configuración

```
Proyecto-Acompa-amiento-/
├── infrastructure.hardcoded.config.js  ← Configuración GLOBAL (todas las IPs)
│
├── micro-auth/
│   └── src/config/hardcoded.config.js  ← Config específica del servicio
├── micro-estudiantes/
│   └── src/config/hardcoded.config.js
├── micro-maestros/
│   └── src/config/hardcoded.config.js
├── api-gateway/
│   └── src/config/hardcoded.config.js
├── micro-reportes-estudiantes/
│   └── src/config/hardcoded.config.js
├── micro-reportes-maestros/
│   └── src/config/hardcoded.config.js
├── micro-notificaciones/
│   └── src/config/hardcoded.config.js
└── frontend-web/
    ├── js/config.js                    ← Config global del navegador
    └── public/js/config.js
```

---

## 🎯 IPs Hardcodeadas

### EC2 Instances

| Instance | Public IP | Private IP | Puerto | Servicios |
|----------|-----------|-----------|--------|-----------|
| **EC2-CORE** | 13.216.12.61 | 172.31.78.183 | 3000-3002 | Auth, Estudiantes, Maestros |
| **EC2-API-Gateway** | 52.71.188.181 | 172.31.76.105 | 8080 | API Gateway |
| **EC2-Frontend** | 107.21.124.81 | 172.31.69.203 | 80/443 | Frontend Web |
| **EC2-Reportes** | 54.175.62.79 | 172.31.69.133 | 5003-5004 | Reportes |
| **EC2-Notificaciones** | 100.31.143.213 | 172.31.65.57 | 5006 | Notificaciones |
| **EC2-Messaging** | 3.235.24.36 | 172.31.73.6 | 9092/5672 | Kafka, RabbitMQ |
| **EC2-Monitoring** | 54.198.235.28 | 172.31.71.151 | 9090/3000 | Prometheus, Grafana |
| **EC2-DB** | 44.222.119.15 | 172.31.79.193 | 27017/5432/6379 | MongoDB, PostgreSQL, Redis |

### Database Credentials (Hardcoded)

```javascript
MongoDB:
  - URL: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
  - User: admin
  - Password: mongodb123

PostgreSQL:
  - URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
  - User: postgres
  - Password: postgres123

Redis:
  - URL: redis://:redis123@172.31.79.193:6379
  - Password: redis123
```

---

## 📝 Cómo Usar

### 1. En Node.js (Microservicios)

```javascript
// En tu app.js o cualquier archivo

// Opción A: Usar la config específica del microservicio
const config = require('./src/config/hardcoded.config.js');
console.log('Database:', config.MONGODB.URL);
console.log('Services:', config.SERVICES);

// Opción B: Usar la config global
const { CONFIG, getServiceUrl, getDatabaseUrl } = require('./infrastructure.hardcoded.config.js');
const authService = getServiceUrl('AUTH');
const mongoUrl = getDatabaseUrl('MONGO');
```

### 2. En API Gateway

```javascript
const config = require('./src/config/hardcoded.config.js');

// Las rutas ya están configuradas
app.use('/auth', proxy(config.SERVICES.AUTH.URL));
app.use('/estudiantes', proxy(config.SERVICES.ESTUDIANTES.URL));
app.use('/maestros', proxy(config.SERVICES.MAESTROS.URL));
// etc...
```

### 3. En Frontend JavaScript

```javascript
// Ya está configurado en frontend-web/js/config.js

// Usar:
const apiUrl = window.API_CONFIG.API_BASE;
const fullUrl = window.API_CONFIG.buildUrl('/auth/login');

// O acceder a configuración completa:
console.log(window.API_CONFIG.CONFIG.API_GATEWAY_URL);
console.log(window.API_CONFIG.CONFIG.EC2_INSTANCES);
```

---

## 🔄 Comunicación Entre Servicios

### Dentro de la VPC (Private IPs)

Los microservicios se comunican entre sí usando IPs **privadas**:

```
Micro-Auth (172.31.78.183:3000)
         ↓
API-Gateway (172.31.76.105:8080)
         ↓
Micro-Estudiantes (172.31.78.183:3001)
         ↓
Base de Datos (172.31.79.193)
```

**Ventajas:**
- ✅ Comunicación segura (no sale de la VPC)
- ✅ No hay latencia de internet
- ✅ No necesita IPs públicas

### Desde el Navegador (Public IPs)

El frontend accede usando **IPs públicas**:

```
Browser
   ↓
Frontend (107.21.124.81:80)
   ↓
API-Gateway (52.71.188.181:8080)  ← IP PÚBLICA
   ↓
Servicios (via VPC privado)
```

---

## 🔧 Cambiar IPs en el Futuro

Si necesitas cambiar las IPs:

1. **Edita** `infrastructure.hardcoded.config.js`
2. **Edita** cada `src/config/hardcoded.config.js` en los microservicios
3. **Edita** `frontend-web/js/config.js`
4. **Rebuild** los Dockerfiles (los cambios se codifican)
5. **Redeploy** con `docker-compose up -d`

---

## ✅ Verificación

### Ver todas las configuraciones cargadas

```bash
# En cualquier microservicio
node -e "const c = require('./src/config/hardcoded.config.js'); console.log(JSON.stringify(c, null, 2));"
```

### Probar conectividad a una base de datos

```bash
# MongoDB
mongosh mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin

# PostgreSQL
psql postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento

# Redis
redis-cli -h 172.31.79.193 -p 6379 -a redis123 ping
```

---

## 🚀 Deployment

Una vez que las configuraciones están hardcodeadas:

```bash
# 1. Build del Dockerfile
docker build -t micro-auth:latest .

# 2. Run del contenedor
docker run -p 3000:3000 micro-auth:latest

# 3. O usar docker-compose
docker-compose up -d
```

No necesitas pasar variables de entorno porque todo está hardcodeado.

---

## ⚠️ Seguridad (IMPORTANTE)

### Credenciales Hardcodeadas

**Advertencia:** Las credenciales están hardcodeadas en el código.

**Para producción real:**
1. Cambiar contraseñas
2. Usar AWS Secrets Manager
3. Usar IAM roles en lugar de hardcoding
4. Implementar rotación de credenciales

**Para ahora (desarrollo/testing):**
- Las contraseñas actuales son suficientes
- Todas son dentro de la VPC (no accesibles desde internet)

---

## 📚 Archivos de Configuración

| Archivo | Propósito | Ámbito |
|---------|-----------|--------|
| `infrastructure.hardcoded.config.js` | Todas las IPs y servicios | Global |
| `micro-auth/src/config/hardcoded.config.js` | Config específica Auth | Microservicio |
| `micro-estudiantes/src/config/hardcoded.config.js` | Config específica Estudiantes | Microservicio |
| `micro-maestros/src/config/hardcoded.config.js` | Config específica Maestros | Microservicio |
| `api-gateway/src/config/hardcoded.config.js` | Routes y servicios | API Gateway |
| `micro-reportes-*/src/config/hardcoded.config.js` | Config Reportes | Microservicio |
| `micro-notificaciones/src/config/hardcoded.config.js` | Config Notificaciones | Microservicio |
| `frontend-web/js/config.js` | URLs para el navegador | Frontend |

---

## 🎯 Resumen

✅ **Ventajas de Hardcoding:**
- No necesitas archivos `.env`
- No necesitas variables de entorno
- Todo está en el código
- Fácil de reproducir y debuggear
- Seguro dentro de la VPC

❌ **Desventajas:**
- Para cambiar IPs necesitas rebuilds
- Las credenciales están en el código
- No es flexible para múltiples ambientes

**Mejor para:** Producción estable con IPs fijas (como AWS EC2 con Elastic IPs)

---

## 🚀 Próximo Paso

Ahora puedes proceder con el deployment:

```bash
bash deploy-step-1-db.sh
```

Todas las configuraciones ya están hardcodeadas y listas para usar.
