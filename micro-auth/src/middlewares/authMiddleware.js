const AuthService = require('@proyecto/shared-auth/src/services/authService');
const SessionService = require('../services/sessionService');
const { logger } = require('@proyecto/shared-auth/src/middlewares/logger');

/**
 * Middleware de autenticación con verificación de tokenVersion
 * Valida JWT y compara tokenVersion con el almacenado en Redis
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    // Verificar firma y expiración del JWT
    let payload;
    try {
      payload = AuthService.verifyAccessToken(token);
    } catch (err) {
      logger.warn(`[authMiddleware] JWT verification failed: ${err.message}`);
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }

    // Verificar tokenVersion en Redis
    const { userId, tokenVersion } = payload;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Token incompleto'
      });
    }

    const isVersionValid = await SessionService.verifyTokenVersion(userId, tokenVersion);
    if (!isVersionValid) {
      logger.warn(`[authMiddleware] Token version mismatch for userId: ${userId}`);
      return res.status(401).json({
        success: false,
        error: 'Token inválido (versión incompatible)'
      });
    }

    // Token válido, adjuntar payload a request
    req.user = payload;
    return next();
  } catch (error) {
    logger.error(`[authMiddleware] Authentication error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar autenticación'
    });
  }
};

module.exports = { authenticateToken };
