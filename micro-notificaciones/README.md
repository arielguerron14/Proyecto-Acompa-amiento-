# micro-notificaciones

Microservicio centralizado para enviar notificaciones por email, SMS y push notifications.

## 🎯 Descripción

El servicio **micro-notificaciones** maneja el envío de notificaciones a usuarios a través de múltiples canales: email, SMS y notificaciones push. Otros servicios pueden hacer llamadas HTTP para disparar notificaciones.

## ✨ Características

- ✅ Notificaciones por email (SMTP)
- ✅ Notificaciones por SMS
- ✅ Push notifications
- ✅ Templates reutilizables
- ✅ Health check / Ping
- ✅ Standardized error handling

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **Dotenv** - Gestión de variables de entorno
- **Nodemailer** - Para envío de emails
- Integraciones externas: Twilio (SMS), Firebase (Push)

## 📁 Estructura del Proyecto

```
micro-notificaciones/
├── src/
│   ├── app.js                      # Express app setup (standardized)
│   ├── controllers/
│   │   └── notificacionesController.js # HTTP handlers
│   ├── routes/
│   │   └── notificacionesRoutes.js    # Rutas HTTP
├── Dockerfile                  # Imagen Docker
├── .dockerignore               # Exclusiones build
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## 📡 API Endpoints

### Email

- `POST /notificaciones/email` - Envía una notificación por email

**Request:**
```json
{
  "to": "user@example.com",
  "subject": "Asunto del email",
  "body": "<h1>Contenido del email</h1>",
  "templateId": "WELCOME",
  "data": {
    "appName": "Mi Aplicación",
    "name": "Juan"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "MSG-123"
}
```

### SMS

- `POST /notificaciones/sms` - Envía una notificación por SMS

**Request:**
```json
{
  "phoneNumber": "+34612345678",
  "message": "Tu código de verificación es: 123456"
}
```

### Push Notifications

- `POST /notificaciones/push` - Envía una notificación push

**Request:**
```json
{
  "userId": "user-001",
  "title": "Nueva Reserva",
  "body": "Tu reserva ha sido confirmada",
  "data": {
    "reservaId": "RESERVA-001"
  }
}
```

### Health Check

- `GET /ping` - Verifica que el servicio está activo

**Response:**
```json
{
  "status": "ok",
  "service": "micro-notificaciones"
}
```

## Ejemplos cURL

```bash
# Enviar email
curl -X POST http://localhost:5006/notificaciones/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Bienvenido",
    "body": "<h1>Bienvenido a nuestra plataforma</h1>",
    "templateId": "WELCOME"
  }'

# Enviar SMS
curl -X POST http://localhost:5006/notificaciones/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+34612345678",
    "message": "Tu reserva ha sido confirmada"
  }'

# Enviar notificación push
curl -X POST http://localhost:5006/notificaciones/push \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "title": "Nueva Reserva",
    "body": "Tu reserva ha sido confirmada"
  }'

# Health check
curl http://localhost:5006/ping
```

## Installation

### Prerequisites

- Node.js 18+ o Docker
- Credenciales de email (SMTP)
- Credenciales de Twilio (para SMS, opcional)
- Credenciales de Firebase (para Push, opcional)

### Local Setup

```bash
# Instalar dependencias
npm install

# Establecer variables de entorno (crear archivo .env)
PORT=5006
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
FIREBASE_PROJECT_ID=tu-project-id

# Ejecutar el servicio
npm start
```

### Docker Setup

```bash
# Construir la imagen
docker build -t micro-notificaciones:local .

# Ejecutar el contenedor
docker run -d \
  --name micro-notificaciones \
  -p 5006:5006 \
  -e PORT=5006 \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_USER=tu-email@gmail.com \
  -e SMTP_PASS=tu-password \
  micro-notificaciones:local
```

## 🏛️ Patrones Implementados

- **Thin Controllers**: Solo orquestación HTTP, sin lógica
- **Centralized Logger**: Logging consistente
- **Error Handling**: Status codes en errores
- **Async/Fire-and-Forget**: No bloquea respuesta HTTP

## Environment Variables

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servicio (default: 5006) |
| `SMTP_HOST` | Host del servidor SMTP |
| `SMTP_PORT` | Puerto SMTP (default: 587) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |
| `TWILIO_ACCOUNT_SID` | SID de cuenta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticación Twilio |
| `FIREBASE_PROJECT_ID` | ID de proyecto Firebase |

## Templates Disponibles

```
- WELCOME: Bienvenida nuevo usuario
- RESERVATION_CREATED: Confirmación de reserva
- RESERVATION_CANCELLED: Cancelación de reserva
- REMINDER: Recordatorio de sesión
- PASSWORD_RESET: Reseteo de contraseña
```

## 🔌 Integración

Otros servicios pueden enviar notificaciones mediante:

```javascript
// Desde micro-estudiantes, por ejemplo
const { post } = require('../utils/httpClient');
await post('http://micro-notificaciones:5006/notificaciones/email', {
  to: 'estudiante@example.com',
  subject: 'Tu reserva fue confirmada',
  templateId: 'RESERVATION_CREATED',
  data: { reservaId: 'RESERVA-001' }
});
```
