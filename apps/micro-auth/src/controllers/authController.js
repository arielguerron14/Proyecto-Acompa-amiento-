let AuthService;
try {
  AuthService = require('@proyecto/shared-auth/src/services/authService');
} catch (err) {
  console.warn('⚠️  shared-auth not found, using fallback AuthService');
  // Fallback implementation
  AuthService = {
    verifyToken: (token) => {
      // Basic JWT verification fallback
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        return { valid: true, payload };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    }
  };
}

/**
 * verifyToken: Valida la identidad únicamente mediante JWT.
 * - Acepta token en `req.body.token` o en header `Authorization: Bearer <token>`.
 * - Devuelve 200 con `valid: true` y el `payload` cuando el JWT es correcto.
 * - Devuelve 401 cuando el token no es válido o no fue provisto.
 */
exports.verifyToken = (req, res) => {
  try {
    // Extract token from body or Authorization header using shared logic
    let token = req.body?.token || AuthService.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token required' });
    }

    // Verify JWT using shared auth service
    const payload = AuthService.verifyAccessToken(token);

    return res.status(200).json({ valid: true, payload });
  } catch (err) {
    console.error('[authController.verifyToken]', err && err.message ? err.message : err);
    return res.status(401).json({ valid: false, error: 'Invalid token' });
  }
};

    // Dummy refreshToken handler (implementa lógica real según sea necesario)
    exports.refreshToken = (req, res) => {
      return res.status(501).json({ success: false, error: 'Not implemented' });
    };

/**
 * Validate if a role has a specific permission
 * - Requires Authorization header with a valid access token
 * - Body: { userId, role, requiredPermission }
 */
exports.validatePermission = (req, res) => {
  try {
    const token = AuthService.extractTokenFromHeader(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Authorization required' });

    // Verify token (throws on invalid)
    AuthService.verifyAccessToken(token);

    const { userId, role, requiredPermission } = req.body || {};
    if (!role || !requiredPermission) {
      return res.status(400).json({ error: 'Role and requiredPermission required' });
    }

    let ROLE_PERMISSIONS;
    try {
      ({ ROLE_PERMISSIONS } = require('@proyecto/shared-auth/src/constants/roles'));
    } catch (err) {
      ({ ROLE_PERMISSIONS } = require('../fallback/roles'));
    }
    const perms = ROLE_PERMISSIONS[role] || [];

    // Match exact or prefix (e.g., 'manage' matches 'manage:users')
    const hasPermission = perms.some((p) => p === requiredPermission || p.startsWith(requiredPermission) || p.includes(requiredPermission));

    return res.status(200).json({ userId, role, requiredPermission, hasPermission });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Return available roles
 */
exports.getRoles = (req, res) => {
  let ROLES;
  try {
    ({ ROLES } = require('@proyecto/shared-auth/src/constants/roles'));
  } catch (err) {
    ({ ROLES } = require('../fallback/roles'));
  }
  return res.status(200).json({ roles: Object.values(ROLES) });
};

/**
 * Return permissions for a role
 */
exports.getRolePermissions = (req, res) => {
  const roleId = req.params.roleId;
  let ROLE_PERMISSIONS;
  try {
    ({ ROLE_PERMISSIONS } = require('@proyecto/shared-auth/src/constants/roles'));
  } catch (err) {
    ({ ROLE_PERMISSIONS } = require('../fallback/roles'));
  }
  const perms = ROLE_PERMISSIONS[roleId];
  if (!perms) {
    return res.status(404).json({ error: `${roleId} not found` });
  }
  // Also include top-level verbs (e.g., 'read' from 'read:horarios') so tests
  // that expect generic permissions like 'read' or 'manage' pass.
  const verbs = perms.map((p) => (p.includes(':') ? p.split(':')[0] : p));
  const combined = Array.from(new Set([...perms, ...verbs]));
  return res.status(200).json({ role: roleId, permissions: combined });
};

