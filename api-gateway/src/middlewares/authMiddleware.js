const axios = require('axios');
const AuthService = require('../services/authService');
const { logger } = require('./logger');

const MICRO_AUTH_URL = process.env.MICRO_AUTH_URL || 'http://localhost:5005';

/**
 * Authenticate token middleware
 * Verifies token signature locally, then delegates active-session validation to micro-auth
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);

    // debug logs for token extraction
    logger.info(`authHeader: ${authHeader}`);
    logger.info(`extracted token present: ${!!token}`);

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verify JWT signature and expiry locally to fail fast
    try {
      AuthService.verifyAccessToken(token);
    } catch (err) {
      logger.warn(`Local JWT verification failed: ${err.message}`);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Delegate session/cache validation to micro-auth
    try {
      const resp = await axios.post(`${MICRO_AUTH_URL}/auth/verify-token`, { token });
      const data = resp && resp.data;
      if (!data || data.valid !== true) {
        logger.warn('Token not valid according to micro-auth');
        return res.status(401).json({ error: 'Token no válido o no en sesión activa' });
      }

      // Attach the payload returned by micro-auth to req.user
      req.user = data.payload;
      return next();
    } catch (err) {
      logger.warn(`Remote token verification failed: ${err.message}`);
      return res.status(401).json({ error: 'Error verificando token en micro-auth' });
    }
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };
