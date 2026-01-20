const AuthService = require('../services/authService');
const { ROLE_PERMISSIONS } = require('../constants/roles');

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) return res.status(401).json({ success: false, message: 'Token required' });
    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: err.message });
  }
}

function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = AuthService.extractTokenFromHeader(authHeader);
    if (!token) return next();
    const decoded = AuthService.verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    // If token is invalid, ignore and continue as unauthenticated
    return next();
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    if (!allowedRoles.includes(user.role)) return res.status(403).json({ success: false, message: 'Forbidden: role' });
    return next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const perms = ROLE_PERMISSIONS[user.role] || [];
    if (!perms.includes(permission)) return res.status(403).json({ success: false, message: 'Forbidden: permission' });
    return next();
  };
}

function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required' });
    const perms = ROLE_PERMISSIONS[user.role] || [];
    const ok = permissions.some(p => perms.includes(p));
    if (!ok) return res.status(403).json({ success: false, message: 'Forbidden: permissions' });
    return next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAnyPermission,
};
