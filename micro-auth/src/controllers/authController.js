const AuthService = require('../../../shared-auth/src/services/authService');
const { ROLES, ROLE_PERMISSIONS } = require('../../../shared-auth/src/constants/roles');

/**
 * Verifica la validez de un token JWT
 */
exports.verifyToken = (req, res) => {
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
    res.status(401).json({
      valid: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Valida si un usuario tiene un permiso específico
 */
exports.validatePermission = (req, res) => {
  try {
    const { userId, role, requiredPermission } = req.body;

    if (!role || !requiredPermission) {
      return res.status(400).json({ error: 'Role and requiredPermission required' });
    }

    const permissions = ROLE_PERMISSIONS[role] || [];
    const hasPermission = permissions.includes(requiredPermission);

    res.status(200).json({
      userId,
      role,
      requiredPermission,
      hasPermission,
    });
  } catch (error) {
    console.error('[authController.validatePermission]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Retorna la lista de roles disponibles
 */
exports.getRoles = (req, res) => {
  res.status(200).json({
    roles: Object.values(ROLES),
  });
};

/**
 * Retorna los permisos de un rol específico
 */
exports.getRolePermissions = (req, res) => {
  try {
    const { roleId } = req.params;

    if (!ROLE_PERMISSIONS[roleId]) {
      return res.status(404).json({ error: `Role '${roleId}' not found` });
    }

    res.status(200).json({
      role: roleId,
      permissions: ROLE_PERMISSIONS[roleId],
    });
  } catch (error) {
    console.error('[authController.getRolePermissions]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
