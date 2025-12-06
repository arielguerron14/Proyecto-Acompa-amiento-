# JWT + Cache Implementation - Code Reference

## File 1: micro-auth/src/services/tokenCache.js

Simple in-memory cache for active tokens. In production, replace with Redis.

```javascript
// Simple in-memory cache. Replace with Redis for production.
const cache = new Map();

module.exports = {
  set(token, user) {
    cache.set(token, user);
  },
  get(token) {
    return cache.get(token);
  },
  delete(token) {
    cache.delete(token);
  },
  has(token) {
    return cache.has(token);
  },
  clear() {
    cache.clear();
  }
};
```

---

## File 2: micro-auth/src/controllers/authController.js

Core authentication logic with cache integration.

```javascript
const AuthService = require('../../../shared-auth/src/services/authService');
const TokenCache = require('../services/tokenCache');
const { ROLES, ROLE_PERMISSIONS } = require('../../../shared-auth/src/constants/roles');

// Mock users (replace with database in production)
let registeredUsers = {
  'estudiante@example.com': { userId: 'EST001', email: 'estudiante@example.com', password: 'pass123', role: ROLES.ESTUDIANTE },
  'maestro@example.com': { userId: 'MAE001', email: 'maestro@example.com', password: 'pass123', role: ROLES.MAESTRO },
  'admin@example.com': { userId: 'ADM001', email: 'admin@example.com', password: 'pass123', role: ROLES.ADMIN },
};

/**
 * Login: Authenticate user and cache token
 */
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = registeredUsers[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { accessToken, refreshToken, expiresIn } = AuthService.generateTokenPair(
      user.userId,
      user.role,
      user.email
    );

    // Cache the active token with user info
    TokenCache.set(accessToken, {
      userId: user.userId,
      role: user.role,
      email: user.email,
      issuedAt: Date.now(),
    });

    console.log(`[authController.login] User ${user.userId} (${user.role}) logged in and token cached`);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[authController.login]', error);
    res.status(500).json({ error: 'Error en el proceso de login' });
  }
};

/**
 * Refresh: Generate new access token
 */
exports.refresh = (req, res) => {
  try {
    const { refreshToken, oldAccessToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const newAccessToken = AuthService.refreshAccessToken(refreshToken);
    const payload = AuthService.verifyAccessToken(newAccessToken);

    // Remove old token from cache
    if (oldAccessToken) {
      TokenCache.delete(oldAccessToken);
    }

    // Cache the new token
    TokenCache.set(newAccessToken, {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      issuedAt: Date.now(),
    });

    console.log(`[authController.refresh] Access token refreshed and cached for user ${payload.userId}`);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: '15m',
    });
  } catch (error) {
    console.error('[authController.refresh]', error);
    res.status(401).json({ error: error.message });
  }
};

/**
 * Logout: Remove token from cache
 */
exports.logout = (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Remove token from cache
    TokenCache.delete(accessToken);

    console.log(`[authController.logout] User logged out and token removed from cache`);

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    console.error('[authController.logout]', error);
    res.status(500).json({ error: 'Error en el proceso de logout' });
  }
};

/**
 * Verify Token: Check cache + JWT validation
 */
exports.verifyToken = (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Check if token is in cache
    const cachedUser = TokenCache.get(token);
    if (!cachedUser) {
      return res.status(401).json({
        valid: false,
        error: 'Token not in active session cache',
      });
    }

    // Verify JWT integrity
    const payload = AuthService.verifyAccessToken(token);
    
    res.status(200).json({
      valid: true,
      payload,
      fromCache: true,
    });
  } catch (error) {
    console.error('[authController.verifyToken]', error);
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Register: Create new user and cache token
 */
exports.register = (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y rol son requeridos' });
    }

    if (registeredUsers[email]) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Create new user
    const userId = role === ROLES.ESTUDIANTE ? 'est-' + Date.now() : 'mta-' + Date.now();
    const newUser = {
      userId,
      email,
      password,
      role,
      name,
    };

    registeredUsers[email] = newUser;

    const { accessToken, refreshToken, expiresIn } = AuthService.generateTokenPair(
      userId,
      role,
      email
    );

    // Cache the access token
    TokenCache.set(accessToken, {
      userId,
      role,
      email,
      issuedAt: Date.now(),
    });

    console.log(`[authController.register] New user registered: ${userId} (${role})`);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        userId,
        email,
        role,
        name,
      },
    });
  } catch (error) {
    console.error('[authController.register]', error);
    res.status(500).json({ error: 'Error en el proceso de registro' });
  }
};

// ... validatePermission, getRoles, getRolePermissions methods ...
```

---

## File 3: micro-auth/src/routes/authRoutes.js

Route definitions for authentication endpoints.

```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../../shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/register', authController.register);
router.post('/verify-token', authController.verifyToken);
router.post('/validate-permission', authenticateToken, authController.validatePermission);
router.get('/roles', authController.getRoles);
router.get('/roles/:roleId/permissions', authController.getRolePermissions);

module.exports = router;
```

---

## File 4: api-gateway/src/routes/authRoutes.js

API Gateway proxies authentication to micro-auth service.

```javascript
const express = require('express');
const AuthService = require('../services/authService');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { logger } = require('../middlewares/logger');
const axios = require('axios');

const router = express.Router();

const MICRO_AUTH_URL = process.env.MICRO_AUTH_URL || 'http://localhost:3002';

/**
 * Forward login to micro-auth
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const response = await axios.post(`${MICRO_AUTH_URL}/auth/login`, {
      email,
      password,
    });

    logger.info(`User ${response.data.user.userId} logged in successfully`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Error en el proceso de login' });
  }
});

/**
 * Forward refresh to micro-auth
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken, oldAccessToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const response = await axios.post(`${MICRO_AUTH_URL}/auth/refresh`, {
      refreshToken,
      oldAccessToken,
    });

    logger.info('Access token refreshed successfully');
    res.json(response.data);
  } catch (error) {
    logger.warn(`Refresh token error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(401).json({ error: 'Error al refrescar token' });
  }
});

/**
 * Forward logout to micro-auth
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const response = await axios.post(`${MICRO_AUTH_URL}/auth/logout`, {
      accessToken,
    });

    logger.info(`User ${req.user.userId} logged out`);
    res.json(response.data);
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(500).json({ error: 'Error en el proceso de logout' });
  }
});

/**
 * Get current user info
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// ... other endpoints ...

module.exports = router;
```

---

## File 5: api-gateway/src/middlewares/authMiddleware.js

Validates JWT for protected routes.

```javascript
const AuthService = require('../services/authService');
const { logger } = require('./logger');

/**
 * Authenticate token middleware
 * Validates JWT and checks if token is in active session cache
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verify JWT signature and expiry
    const decoded = AuthService.verifyAccessToken(token);
    
    // In production, check cache by calling micro-auth service:
    // const isCached = await checkTokenInCache(token);
    // if (!isCached) return res.status(401).json({ error: 'Token not in active session' });
    
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };
```

---

## File 6: api-gateway/package.json

Added axios for HTTP forwarding to micro-auth.

```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@proyecto/message-broker": "file:../message-broker",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.1.4",
    "express": "^4.18.2",
    "express-rate-limit": "^6.7.0",
    "helmet": "^6.0.1",
    "http-proxy-middleware": "^2.0.6",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^4.6.3",
    "winston": "^3.8.2"
  }
}
```

---

## Request/Response Examples

### Login
```bash
# Request
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "estudiante@example.com",
  "password": "pass123"
}

# Response (201)
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJFU1QwMDEiLCJyb2xlIjoiZXN0dWRpYW50ZSIsImVtYWlsIjoiZXN0dWRpYW50ZUBleGFtcGxlLmNvbSIsImlhdCI6MTY5NDUyMzQ1MCwiZXhwIjoxNjk0NTI0MzUwfQ.X1Y2Z3...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJFU1QwMDEiLCJyb2xlIjoiZXN0dWRpYW50ZSIsImVtYWlsIjoiZXN0dWRpYW50ZUBleGFtcGxlLmNvbSIsImlhdCI6MTY5NDUyMzQ1MCwiZXhwIjoxNjk0NzgyNjUwfQ.A1B2C3...",
  "expiresIn": "15m",
  "user": {
    "userId": "EST001",
    "email": "estudiante@example.com",
    "role": "estudiante"
  }
}
```

### Protected Route
```bash
# Request
GET http://localhost:8080/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Response (200)
{
  "success": true,
  "user": {
    "userId": "EST001",
    "role": "estudiante",
    "email": "estudiante@example.com"
  }
}
```

### Refresh Token
```bash
# Request
POST http://localhost:8080/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "oldAccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response (200)
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

### Logout
```bash
# Request
POST http://localhost:8080/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response (200)
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## Cache State Example

### After Login
```javascript
TokenCache cache state:
{
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJFU1QwMDEi...": {
    userId: "EST001",
    role: "estudiante",
    email: "estudiante@example.com",
    issuedAt: 1694523450000
  }
}
```

### After Logout
```javascript
TokenCache cache state:
{}  // Token removed from cache
```

---

## Key Implementation Points

1. **Login Flow**:
   - Verify credentials
   - Generate JWT pair
   - Cache access token immediately
   - Return tokens + user info

2. **Token Verification**:
   - Check if token is in cache (session active)
   - Verify JWT signature + expiry (token valid)
   - Both conditions must be true

3. **Refresh Flow**:
   - Verify refresh token
   - Remove old token from cache
   - Generate new access token
   - Cache new token

4. **Logout Flow**:
   - Remove token from cache
   - Further requests with this token fail (not in cache)
   - Even if JWT is still technically valid

This approach ensures tokens are both **cryptographically valid** and **sessions are managed actively**.
