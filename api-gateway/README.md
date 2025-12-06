# API Gateway

Centro de enrutamiento central para la arquitectura de microservicios.

## 🎯 Descripción

El **API Gateway** actúa como punto de entrada único (single entry point) para todas las solicitudes de clientes, enrutándolas a los microservicios apropiados y sirviendo archivos estáticos del frontend. Implementa autenticación centralizada y manejo de CORS.

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **http-proxy-middleware** - Middleware de proxy para solicitudes
- **Dotenv** - Gestión de variables de entorno
- **CORS** - Soporte para múltiples orígenes

## 📁 Estructura del Proyecto

```
api-gateway/
├── server.js                   # Configuración del gateway
├── Dockerfile                  # Imagen Docker
├── .dockerignore               # Exclusiones build
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  Cliente Web / Móvil                 │
│             (navegador, app, API)                    │
└─────────────────────────┬────────────────────────────┘
                          │ http/https
        ┌─────────────────▼────────────────────┐
        │    API Gateway (puerto 8080)         │
        │  - Autenticación                     │
        │  - Enrutamiento                      │
        │  - Rate limiting                     │
        │  - CORS                              │
        └─┬────────┬───────────┬──────────┬────┘
          │        │           │          │
  ┌───────▼─┐  ┌──▼────────┐ ┌▼────────┐ │
  │Frontend  │  │Maestros   │ │Estudiantes │
  │(5500)    │  │(5001)     │ │(5002)    │
  └──────────┘  └───────────┘ └──────────┘
```

## Installation

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm start

# El servidor estará disponible en http://localhost:8080
```

## 📝 Variables de Entorno

Crear un archivo `.env`:

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=tu-secret-key-cambiar-en-produccion
REFRESH_SECRET=tu-refresh-secret-cambiar-en-produccion

# URLs de microservicios
MAESTROS_URL=http://localhost:5001
ESTUDIANTES_URL=http://localhost:5002
REPORTES_EST_URL=http://localhost:5003
REPORTES_MAEST_URL=http://localhost:5004
AUTH_URL=http://localhost:5005
NOTIFICACIONES_URL=http://localhost:5006
ANALYTICS_URL=http://localhost:5007
SOAP_URL=http://localhost:5008
FRONTEND_URL=http://localhost:5500
```

## 🔑 Rutas Públicas

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/verify-token` | Verificar JWT válido |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/me` | Obtener usuario autenticado |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/roles` | Listar roles disponibles |

### Ejemplos de uso

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m",
  "user": {
    "userId": "admin-001",
    "email": "admin@sistema.com",
    "role": "admin"
  }
}
```

**Registro:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@ejemplo.com",
    "password": "password123",
    "name": "Nuevo Usuario",
    "role": "estudiante"
  }'
```

**Verificar Token:**
```bash
curl -X POST http://localhost:8080/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGc..."}'
```

**Renovar Token:**
```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGc..."}'
```

## 🔒 Rutas Protegidas

Todas las rutas de microservicios requieren token JWT en el header:

```
Authorization: Bearer <accessToken>
```

### Ejemplo:
```bash
curl -X GET http://localhost:8080/maestros/list \
  -H "Authorization: Bearer eyJhbGc..."
```

## ⚙️ Configuración CORS

El gateway está configurado con CORS habilitado para desarrollo:

**Headers permitidos:**
- `Content-Type`
- `Authorization`
- `X-Requested-With`

**Métodos permitidos:**
- `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH`, `HEAD`

**En producción**, modificar `src/middlewares/security.js` para usar whitelist específico.

## 🚀 Despliegue con Docker

```bash
# Construir imagen
docker build -t api-gateway .

# Ejecutar contenedor
docker run -d --name api-gateway \
  -p 8080:8080 \
  -e JWT_SECRET=prod-secret \
  api-gateway

# Con docker-compose
docker-compose up -d api-gateway
```

## 📊 Middleware Implementado

- **express.json()** - Parser de JSON
- **cors()** - CORS habilitado
- **helmet()** - Headers de seguridad
- **rate-limiter** - Limitación de velocidad (100 req/min)
- **requestLogger** - Logging de solicitudes
- **errorHandler** - Manejo centralizado de errores

## 🧪 Testing

```bash
# Test de login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"admin123"}'
```

## 🐛 Resolución de Problemas

### Puerto 8080 ya en uso
```bash
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### CORS rechazando solicitudes
- Verifica que usas `http://localhost` (no `127.0.0.1`)
- Recarga el navegador con Ctrl+Shift+R
- Revisa los headers en DevTools (F12)

### Prerequisites

- Node.js 18+ o Docker
- Microservicios corriendo en los puertos configurados

### Local Setup

```bash
# Instalar dependencias
npm install

# Establecer variables de entorno (crear archivo .env)
PORT=8080
MAESTROS_URL=http://localhost:5001
ESTUDIANTES_URL=http://localhost:5002
REPORTES_EST_URL=http://localhost:5003
REPORTES_MAEST_URL=http://localhost:5004
AUTH_URL=http://localhost:5005
NOTIFICACIONES_URL=http://localhost:5006
ANALYTICS_URL=http://localhost:5007
SOAP_BRIDGE_URL=http://localhost:5008
FRONTEND_URL=http://localhost:5500

# Ejecutar el gateway
npm start

# El gateway estará disponible en http://localhost:8080
```

### Docker Setup

```bash
# Construir la imagen
docker build -t api-gateway:local .

# Ejecutar el contenedor
docker run -d \
  --name api-gateway \
  -p 8080:8080 \
  -e MAESTROS_URL=http://micro-maestros:5001 \
  -e ESTUDIANTES_URL=http://micro-estudiantes:5002 \
  -e REPORTES_EST_URL=http://micro-reportes-estudiantes:5003 \
  -e REPORTES_MAEST_URL=http://micro-reportes-maestros:5004 \
  -e AUTH_URL=http://micro-auth:5005 \
  -e NOTIFICACIONES_URL=http://micro-notificaciones:5006 \
  -e ANALYTICS_URL=http://micro-analytics:5007 \
  -e SOAP_BRIDGE_URL=http://micro-soap-bridge:5008 \
  -e FRONTEND_URL=http://frontend-web:5500 \
  api-gateway:local
```

## 📡 Rutas del Gateway

### Frontend (Archivos Estáticos)

| Ruta | Destino | Descripción |
|------|---------|-------------|
| `/` | Frontend Static Files | Página de inicio |
| `/estudiante.html` | Frontend Static Files | Interfaz estudiante |
| `/styles.css` | Frontend Static Files | Estilos |
| `/*.js` | Frontend Static Files | JavaScript |

### Microservicios

| Ruta | Destino | Puerto |
|------|---------|--------|
| `/maestros/*` | micro-maestros | 5001 |
| `/estudiantes/*` | micro-estudiantes | 5002 |
| `/reportes/estudiantes/*` | micro-reportes-estudiantes | 5003 |
| `/reportes/maestros/*` | micro-reportes-maestros | 5004 |
| `/auth/*` | micro-auth | 5005 |
| `/notificaciones/*` | micro-notificaciones | 5006 |
| `/analytics/*` | micro-analytics | 5007 |
| `/soap/*` | micro-soap-bridge | 5008 |

## 🧪 Testing con cURL

```bash
# Health check del gateway
curl http://localhost:8080/

# Obtener horarios (maestros)
curl http://localhost:8080/maestros/horarios

# Obtener reservas (estudiantes)
curl http://localhost:8080/estudiantes/reservas

# Crear horario
curl -X POST http://localhost:8080/maestros/horarios \
  -H "Content-Type: application/json" \
  -d '{
    "maestroId": "MAE-001",
    "diaSemana": "lunes",
    "horaInicio": "09:00",
    "horaFin": "10:00",
    "aula": "Aula 101"
  }'

# Crear reserva
curl -X POST http://localhost:8080/estudiantes/reservas \
  -H "Content-Type: application/json" \
  -d '{
    "estudianteId": "EST-001",
    "horarioId": "HORARIO-001"
  }'

# Obtener estadísticas
curl "http://localhost:8080/analytics/stats?period=7d"

# Verificar token de autenticación
curl -X POST http://localhost:8080/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGc..."
  }'
```

## 🔄 Orden de Inicialización Recomendado

Para evitar errores de conexión, iniciar en este orden:

1. **Infraestructura**: MongoDB, Kafka, Zookeeper, RabbitMQ, MQTT
2. **Microservicios base**: micro-maestros, micro-estudiantes, micro-reportes-*
3. **Microservicios auxiliares**: micro-auth, micro-notificaciones, micro-analytics
4. **API Gateway**
5. **Frontend Web**

```bash
# Con Docker Compose (hace todo automáticamente)
docker-compose up -d

# Verificar estado
docker-compose ps
```

## ✅ Health Checks

```bash
# Verificar que el gateway está activo
curl -i http://localhost:8080/

# Debería responder con 200 OK
# HTTP/1.1 200 OK
```

## 🔐 Consideraciones de Seguridad

- ✅ CORS habilitado para desarrollo
- ⚠️ En producción: Configurar CORS específico
- ⚠️ En producción: Agregar Rate Limiting
- ⚠️ En producción: Usar HTTPS/TLS

## Environment Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del gateway | `8080` |
| `MAESTROS_URL` | URL de micro-maestros | `http://micro-maestros:5001` |
| `ESTUDIANTES_URL` | URL de micro-estudiantes | `http://micro-estudiantes:5002` |
| `REPORTES_EST_URL` | URL de reportes estudiantes | `http://micro-reportes-estudiantes:5003` |
| `REPORTES_MAEST_URL` | URL de reportes maestros | `http://micro-reportes-maestros:5004` |
| `AUTH_URL` | URL de autenticación | `http://micro-auth:5005` |
| `NOTIFICACIONES_URL` | URL de notificaciones | `http://micro-notificaciones:5006` |
| `ANALYTICS_URL` | URL de analytics | `http://micro-analytics:5007` |
| `SOAP_BRIDGE_URL` | URL del puente SOAP | `http://micro-soap-bridge:5008` |
| `FRONTEND_URL` | URL del frontend | `http://frontend-web:5500` |

## 📊 Monitoreo

- Logs en tiempo real: `docker-compose logs -f api-gateway`
- Verificar rutas: `curl -v http://localhost:8080/maestros/horarios`
- Dashboard Kafka: http://localhost:8081

## 🚀 Performance

- **Connection Pooling**: Habilitado por defecto
- **Timeout**: 30s (configurable)
- **Buffer**: 16MB (configurable)

Para ajustar en producción, editar `server.js`:

```javascript
const gateway = createProxyMiddleware({
  timeout: 60000,  // 60 segundos
  maxBodySize: '50mb'
});
```
