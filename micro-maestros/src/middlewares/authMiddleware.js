const AuthService = require('../services/authService');
const { ROLE_PERMISSIONS } = require('../constants/roles');
const { logger } = require('./logger');

/**
 * Middleware para verificar autenticación (JWT)
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = AuthService.extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Authentication error: ${error.message}`);
    return res.status(401).json({ error: error.message });
  }
}

/**
 * Middleware para verificar autorización (RBAC)
 * Uso: requirePermission('create:horarios')(req, res, next)
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    if (!userPermissions.includes(permission)) {
      logger.warn(
        `Unauthorized access attempt: user ${req.user.userId} (${userRole}) tried to access ${permission}`
      );
      return res.status(403).json({
        error: 'Permiso denegado',
        required: permission,
        role: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware para verificar múltiples permisos (cualquiera de ellos)
 */
function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasPermission = permissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      logger.warn(
        `Unauthorized access attempt: user ${req.user.userId} (${userRole}) tried to access [${permissions.join(
          ', '
        )}]`
      );
      return res.status(403).json({
        error: 'Permiso denegado',
        required: permissions,
        role: userRole,
      });
    }

    next();
  };
}

/**
 * Middleware para verificar rol específico
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Unauthorized role access: user ${req.user.userId} (${req.user.role}) tried to access restricted to [${roles.join(
          ', '
        )}]`
      );
      return res.status(403).json({
        error: 'Rol insuficiente',
        required: roles,
        actual: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware opcional de autenticación (continúa incluso sin token)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = AuthService.extractTokenFromHeader(authHeader);

  if (token) {
    try {
      const decoded = AuthService.verifyAccessToken(token);
      req.user = decoded;
    } catch (error) {
      logger.warn(`Optional auth error: ${error.message}`);
      // No lanzamos error, solo continuamos sin user
    }
  }

  next();
}

module.exports = require('../../../shared-auth/src/middlewares/authMiddleware');
