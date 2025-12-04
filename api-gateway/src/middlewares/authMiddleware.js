const AuthService = require('../services/authService');
const { logger } = require('./logger');

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateToken };
