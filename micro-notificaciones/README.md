# micro-notificaciones

Microservicio centralizado para enviar notificaciones por email, SMS y push notifications.

## Características
- ✅ Notificaciones por email (SMTP)
- ✅ Notificaciones por SMS
- ✅ Push notifications
- ✅ Templates reutilizables
- ✅ Health check

## API Endpoints

### `POST /notificaciones/email`
Envía una notificación por email.

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

### `POST /notificaciones/sms`
Envía una notificación por SMS.

**Request:**
```json
{
  "phoneNumber": "+34612345678",
  "message": "Tu código de verificación es: 123456"
}
```

### `POST /notificaciones/push`
Envía una notificación push.

**Request:**
```json
{
  "userId": "user-001",
  "title": "Nueva Reserva",
  "body": "Tu reserva ha sido confirmada",
  "data": {
    "reservaId": "RES-123",
    "action": "openReserva"
  }
}
```

### `GET /notificaciones/templates`
Retorna los templates disponibles.

## Environment Variables
- `PORT` - Puerto en el que escucha (default: 5006)
- `SMTP_HOST` - Host del servidor SMTP
- `SMTP_PORT` - Puerto SMTP (default: 587)
- `SMTP_USER` - Usuario SMTP
- `SMTP_PASS` - Contraseña SMTP
- `SMTP_FROM` - Dirección desde la que se envía
- `JWT_SECRET` - Secreto para validar JWT

## Instalación
```bash
npm install
```

## Ejecución
```bash
npm start
```

## Docker
```bash
docker build -t micro-notificaciones .
docker run -p 5006:5006 \
  -e SMTP_HOST=smtp.gmail.com \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASS=your-password \
  micro-notificaciones
```
