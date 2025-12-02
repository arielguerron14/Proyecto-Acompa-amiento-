# micro-auth

Microservicio centralizado de autenticación y autorización. Proporciona endpoints para verificar tokens JWT, validar permisos y gestionar roles.

## Características
- ✅ Verificación de tokens JWT
- ✅ Validación de permisos
- ✅ Gestión de roles y permisos
- ✅ Integración con shared-auth
- ✅ Health check

## API Endpoints

### `POST /auth/verify-token`
Verifica la validez de un token JWT.

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

### `POST /auth/validate-permission`
Valida si un usuario tiene un permiso específico.

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
  "userId": "user-001",
  "role": "maestro",
  "requiredPermission": "create:horarios",
  "hasPermission": true
}
```

### `GET /auth/roles`
Retorna la lista de roles disponibles.

**Response:**
```json
{
  "roles": ["admin", "maestro", "estudiante", "auditor"]
}
```

### `GET /auth/roles/:roleId/permissions`
Retorna los permisos de un rol específico.

**Response:**
```json
{
  "role": "maestro",
  "permissions": [
    "create:horarios",
    "read:horarios",
    "update:horarios",
    "read:reservas",
    "read:reportes"
  ]
}
```

## Environment Variables
- `PORT` - Puerto en el que escucha (default: 5005)
- `JWT_SECRET` - Secreto para firmar JWT
- `REFRESH_SECRET` - Secreto para refrescar tokens

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
docker build -t micro-auth .
docker run -p 5005:5005 micro-auth
```
