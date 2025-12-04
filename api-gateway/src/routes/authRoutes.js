const express = require('express');
const AuthService = require('../services/authService');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { logger } = require('../middlewares/logger');

const router = express.Router();

/**
 * Datos de usuarios de ejemplo (en producción, usar BD)
 * Estructura: { userId, email, password (hash), role }
 */
const MOCK_USERS = {
  'admin@sistema.com': {
    userId: 'admin-001',
    email: 'admin@sistema.com',
    password: 'admin123', // En producción: hash con bcrypt
    role: 'admin',
  },
  'maestro@sistema.com': {
    userId: 'maestro-001',
    email: 'maestro@sistema.com',
    password: 'maestro123',
    role: 'maestro',
  },
  'estudiante@sistema.com': {
    userId: 'estudiante-001',
    email: 'estudiante@sistema.com',
    password: 'estudiante123',
    role: 'estudiante',
  },
  'auditor@sistema.com': {
    userId: 'auditor-001',
    email: 'auditor@sistema.com',
    password: 'auditor123',
    role: 'auditor',
  },
};

/**
 * POST /auth/login
 * Autentica un usuario y retorna accessToken y refreshToken
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const user = MOCK_USERS[email];
    if (!user || user.password !== password) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const { accessToken, refreshToken, expiresIn } = AuthService.generateTokenPair(
      user.userId,
      user.role,
      user.email
    );

    logger.info(`User ${user.userId} (${user.role}) logged in successfully`);

    res.json({
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
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Error en el proceso de login' });
  }
});

/**
 * POST /auth/refresh
 * Refresca el accessToken usando el refreshToken
 */
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const newAccessToken = AuthService.refreshAccessToken(refreshToken);

    logger.info('Access token refreshed successfully');

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    logger.warn(`Refresh token error: ${error.message}`);
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /auth/me
 * Obtiene información del usuario autenticado
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * POST /auth/logout
 * Desautentica el usuario (en producción, blacklistear el token)
 */
router.post('/logout', authenticateToken, (req, res) => {
  logger.info(`User ${req.user.userId} logged out`);
  res.json({ success: true, message: 'Sesión cerrada exitosamente' });
});

/**
 * POST /auth/verify-token
 * Verifica la validez de un token JWT
 */
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const payload = AuthService.verifyAccessToken(token);
    res.status(200).json({
      valid: true,
      payload,
    });
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`);
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
    });
  }
});

module.exports = router;
