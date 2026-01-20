const AuthService = require('../services/authService');
const SessionService = require('../services/sessionService');
const { logger } = require('./logger');

/**
 * Authenticate token middleware
 * Validates JWT locally, verifies tokenVersion in Redis, and attaches payload to `req.user`.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);

    logger.info(`authHeader present: ${!!authHeader}`);

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Verify JWT signature and expiry locally
    let payload;
    try {
      payload = AuthService.verifyAccessToken(token);
    } catch (err) {
      logger.warn(`Local JWT verification failed: ${err.message}`);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Verify tokenVersion in Redis
    const { userId, tokenVersion } = payload;

    if (!userId) {
      return res.status(401).json({ error: 'Token incompleto' });
    }

    const isVersionValid = await SessionService.verifyTokenVersion(userId, tokenVersion);
    if (!isVersionValid) {
      logger.warn(`Token version mismatch for userId: ${userId}`);
      return res.status(401).json({ error: 'Token inválido (versión incompatible)' });
    }

    // Token is valid, attach payload and continue
    req.user = payload;
    return next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };
