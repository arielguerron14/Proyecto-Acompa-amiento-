# Sistema de Autenticación y Autorización (JWT + RBAC)

## 📋 Descripción

Sistema centralizado de roles y permisos implementado con:
- **JWT (JSON Web Tokens)**: Autenticación stateless
- **Refresh Tokens**: Expiración rotativa de tokens
- **RBAC (Role-Based Access Control)**: Control granular de permisos
- **4 Roles predefinidos**: admin, maestro, estudiante, auditor

---

## 🔐 Roles y Permisos

### Admin
Acceso completo al sistema:
```
- create:horarios, read:horarios, update:horarios, delete:horarios
- create:reservas, read:reservas, update:reservas, delete:reservas
- read:reportes, create:reportes, delete:reportes
- manage:users, manage:roles
```

### Maestro
Gestión de horarios y consulta de reportes:
```
- create:horarios, read:horarios, update:horarios
- read:reservas
- read:reportes
```

### Estudiante
Gestión de reservas personales:
```
- read:horarios
- create:reservas, read:reservas, update:reservas
- read:reportes
```

### Auditor
Acceso de solo lectura:
```
- read:horarios
- read:reservas
- read:reportes
```

---

## 🚀 Endpoints de Autenticación

Todos en `/auth` (gateway):
### Endpoints disponibles (actualizados)

- `POST /auth/verify-token` - Verifica la validez de un token JWT
- `GET /auth/me` - Retorna el payload del JWT enviado en `Authorization: Bearer <token>`

Nota: En la rama actual los endpoints de login/register/refresh/logout han sido retirados; el frontend de desarrollo espera que pegues un JWT válido en `login.html` para pruebas.

---

## 🔑 Credenciales de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@sistema.com | admin123 | admin |
| maestro@sistema.com | maestro123 | maestro |
| estudiante@sistema.com | estudiante123 | estudiante |
| auditor@sistema.com | auditor123 | auditor |

---

## 🛡️ Middlewares de Autenticación

### 1. `authenticateToken`
Requiere token JWT válido:
```javascript
router.get('/datos-protegidos', authenticateToken, (req, res) => {
  // req.user contiene { userId, role, email, iat, exp }
  res.json({ user: req.user });
});
```

### 2. `requirePermission(permission)`
Requiere un permiso específico:
```javascript
router.post('/horarios', 
  authenticateToken, 
  requirePermission('create:horarios'),
  (req, res) => {
    res.json({ message: 'Horario creado' });
  }
);
```

### 3. `requireAnyPermission(...permissions)`
Requiere uno de varios permisos:
```javascript
router.delete('/reservas/:id',
  authenticateToken,
  requireAnyPermission('delete:reservas', 'manage:roles'),
  (req, res) => {
    res.json({ message: 'Reserva eliminada' });
  }
);
```

### 4. `requireRole(...roles)`
Requiere un rol específico:
```javascript
router.get('/admin',
  authenticateToken,
  requireRole('admin'),
  (req, res) => {
    res.json({ message: 'Panel administrativo' });
  }
);
```

Múltiples roles:
```javascript
router.put('/reportes/:id',
  authenticateToken,
  requireRole('admin', 'maestro'),
  (req, res) => {
    res.json({ message: 'Reporte actualizado' });
  }
);
```

### 5. `optionalAuth`
Autenticación opcional (no lanza error si no hay token):
```javascript
router.get('/horarios',
  optionalAuth,
  (req, res) => {
    if (req.user) {
      res.json({ horarios: [...], authenticated: true });
    } else {
      res.json({ horarios: [...], authenticated: false });
    }
  }
);
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# .env
JWT_SECRET=desarrollo-secret-key-cambiar-en-produccion
REFRESH_SECRET=refresh-secret-key-cambiar-en-produccion
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### Cambio en Producción

**IMPORTANTE**: Cambiar los secrets antes de desplegar a producción:

```bash
# Generar secrets seguros:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Luego actualizar `.env`:
```bash
JWT_SECRET=<secret-aleatorio-64-chars>
REFRESH_SECRET=<otro-secret-aleatorio-64-chars>
```

---

## 📁 Estructura de Archivos

```
api-gateway/src/
├── constants/
│   └── roles.js              # Definición de roles y permisos
├── services/
│   └── authService.js        # Lógica de JWT y tokens
├── middlewares/
│   └── authMiddleware.js     # Middlewares de autenticación
└── routes/
    └── authRoutes.js         # Endpoints /auth/login, /auth/refresh, etc.

micro-maestros/src/
├── constants/
│   └── roles.js
├── services/
│   └── authService.js
└── middlewares/
    └── authMiddleware.js
    
# Mismo patrón para:
# - micro-estudiantes
# - micro-reportes-estudiantes
# - micro-reportes-maestros
```

---

## 🧪 Ejemplos de Uso

### Curl - Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maestro@sistema.com","password":"maestro123"}'
```

### Curl - Acceso con Token
```bash
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:8080/auth/me
```

### JavaScript/Fetch
```javascript
// Login
const loginRes = await fetch('http://localhost:8080/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'maestro@sistema.com',
    password: 'maestro123'
  })
});

const { accessToken, refreshToken } = await loginRes.json();

// Usar token
const userRes = await fetch('http://localhost:8080/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const user = await userRes.json();
console.log(user); // { success: true, user: { userId, role, email, ... } }

// Refrescar token
const refreshRes = await fetch('http://localhost:8080/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { accessToken: newAccessToken } = await refreshRes.json();
```

---

## 🔄 Flujo de Autenticación

```
1. Usuario hace login con credenciales
   ↓
2. AuthService genera accessToken (15min) + refreshToken (7 días)
   ↓
3. Cliente almacena tokens (localStorage/sessionStorage)
   ↓
4. Cliente envía accessToken en Header: Authorization: Bearer <token>
   ↓
5. Middleware authenticateToken valida el JWT
   ↓
6. Si token es válido, req.user se poblada con datos
   ↓
7. Si token expirado, cliente usa refreshToken para obtener nuevo accessToken
   ↓
8. Si refreshToken expirado, usuario debe hacer login nuevamente
```

---

## ⚠️ Consideraciones de Seguridad

1. **HTTPS en Producción**: Siempre usar HTTPS para transmisión de tokens
2. **CORS**: Configurar CORS para dominios permitidos únicamente
3. **HttpOnly Cookies**: En producción, guardar tokens en cookies HttpOnly
4. **Rate Limiting**: Ya implementado con `express-rate-limit`
5. **Token Rotation**: Implementar blacklist de tokens revocados (en BD o Redis)
6. **Secret Rotation**: Cambiar secrets periódicamente
7. **Validation**: Validar entrada en `/auth/login` (email format, password strength)

---

## 🐛 Solución de Problemas

### "Token expirado"
- Use el endpoint `/auth/refresh` con el `refreshToken` para obtener un nuevo `accessToken`

### "Permiso denegado" (403)
- Verifique que el usuario tiene el rol/permiso requerido
- Use `GET /auth/me` para confirmar el rol del usuario actual

### "Token no proporcionado" (401)
- Asegúrese de enviar el token en el header `Authorization: Bearer <token>`
- El formato debe ser exacto: "Bearer " + token (con espacio)

### "Token inválido" (401)
- El token puede estar corrupto o mal formado
- Intente hacer login nuevamente para obtener nuevos tokens

---

## 📊 Flujo de Permisos

El sistema usa una matriz de permisos que se valida en cada request:

```
User Request
  ↓
authenticateToken (valida JWT)
  ↓
requirePermission/requireRole (valida RBAC)
  ↓
Permiso concedido → Continúa
Permiso denegado → Error 403
```

---

## 🔗 Integración en Microservicios

Cada microservicio incluye:

1. **AuthService**: Generación y validación de JWT
2. **AuthMiddleware**: Middlewares RBAC reutilizables
3. **authRoutes**: (En gateway) Endpoints de login/refresh
4. **roles.js**: Matriz de permisos centralizada

Para proteger una ruta en cualquier microservicio:

```javascript
const { authenticateToken, requirePermission } = require('./middlewares/authMiddleware');

router.post('/horarios', 
  authenticateToken, 
  requirePermission('create:horarios'),
  horariosController.create
);
```

---

## 📝 Próximas Mejoras

- [ ] Implementar logout con token blacklist (Redis)
- [ ] Validación de fortaleza de contraseña
- [ ] Autenticación multi-factor (MFA)
- [ ] Auditoría de acceso (logging avanzado)
- [ ] Gestión de usuarios en base de datos
- [ ] Recuperación de contraseña
- [ ] OAuth2 / OIDC
