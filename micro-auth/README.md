# micro-auth

Microservicio centralizado de autenticación, autorización y gestión de roles (RBAC).

## 🎯 Descripción

El servicio **micro-auth** proporciona endpoints para verificar tokens JWT, validar permisos y gestionar roles y permisos de usuario. Actúa como centro de control de acceso para todos los microservicios.

## ✨ Características

- ✅ Verificación de tokens JWT
- ✅ Validación de permisos basada en roles
- ✅ Gestión de roles y permisos (RBAC)
- ✅ Integración con shared-auth
- ✅ Health check / Ping
- ✅ Standardized error handling

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **Dotenv** - Gestión de variables de entorno
- **jsonwebtoken** - Generación y verificación JWT

## 📁 Estructura del Proyecto

```
micro-auth/
├── src/
│   ├── app.js                # Express app setup (standardized)
│   ├── controllers/
│   │   └── authController.js # HTTP handlers
│   ├── routes/
│   │   └── authRoutes.js     # Rutas HTTP
├── Dockerfile                # Imagen Docker
├── .dockerignore              # Exclusiones build
├── package.json               # Dependencias
└── README.md                  # Este archivo
```

## 📡 API Endpoints

### Verificación de Token

- `POST /auth/verify-token` - Verifica la validez de un token JWT

**Request:**
```json
{
  "token": "eyJhbGc..."
}
```

**Response:**
```json
{
  "valid": true,
  "payload": {
    "userId": "user-001",
    "email": "user@example.com",
    "role": "maestro",
    "iat": 1699...,
    "exp": 1699...
  }
}
```

### Validación de Permisos

- `POST /auth/validate-permission` - Valida si un usuario tiene un permiso específico

**Request:**
```json
{
  "userId": "user-001",
  "role": "maestro",
  "requiredPermission": "create:horarios"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Permiso concedido"
}
```

### Health Check

- `GET /ping` - Verifica que el servicio está activo

**Response:**
```json
{
  "status": "ok",
  "service": "micro-auth"
}
```

## Ejemplos cURL

```bash
# Verificar token
curl -X POST http://localhost:5005/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGc..."
  }'

# Validar permiso
curl -X POST http://localhost:5005/auth/validate-permission \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-001",
    "role": "maestro",
    "requiredPermission": "create:horarios"
  }'

# Health check
curl http://localhost:5005/ping
```

## Installation

### Prerequisites

- Node.js 18+ o Docker

### Local Setup

```bash
# Instalar dependencias
npm install

# Establecer variables de entorno (crear archivo .env)
PORT=5005
JWT_SECRET=tu-secret-muy-seguro

# Ejecutar el servicio
npm start
```

### Docker Setup

```bash
# Construir la imagen
docker build -t micro-auth:local .

# Ejecutar el contenedor
docker run -d \
  --name micro-auth \
  -p 5005:5005 \
  -e PORT=5005 \
  -e JWT_SECRET=tu-secret-muy-seguro \
  micro-auth:local
```

## 🏛️ Patrones Implementados

- **Thin Controllers**: Solo orquestación HTTP, sin lógica
- **Centralized Logger**: Logging consistente
- **Error Handling**: Status codes en errores
- **Stateless**: Ningún estado en memoria entre llamadas

## Environment Variables

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto del servicio | `5005` |
| `JWT_SECRET` | Secret para verificar JWT | Debe definirse |

## Roles y Permisos Soportados

```
Roles:
  - admin: Acceso total
  - maestro: Gestión de horarios y reportes
  - estudiante: Crear y gestionar reservas
  - visitante: Solo lectura

Permisos:
  - create:horarios
  - read:horarios
  - update:horarios
  - delete:horarios
  - create:reservas
  - read:reportes
  - etc...
```

## 🔌 Integración

Otros servicios pueden verificar tokens mediante:

```javascript
// Desde cualquier microservicio
const authClient = require('../utils/httpClient');
const result = await authClient.post('http://micro-auth:5005/auth/verify-token', { token });
```
