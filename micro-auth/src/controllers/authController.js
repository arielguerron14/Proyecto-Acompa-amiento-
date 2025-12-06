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
 * Autentica un usuario y retorna accessToken y refreshToken
 * Cache: Stores accessToken -> user payload mapping for session validation
 */
exports.login = async (req, res) => {
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

    // Cache the active token with user info for session validation
    await TokenCache.set(accessToken, {
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
 * Refresca el accessToken usando el refreshToken
 * Cache: Stores new accessToken and removes old one
 */
exports.refresh = async (req, res) => {
  try {
    const { refreshToken, oldAccessToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const newAccessToken = AuthService.refreshAccessToken(refreshToken);
    const payload = AuthService.verifyAccessToken(newAccessToken);

    // Remove old token from cache if provided
    if (oldAccessToken) {
      await TokenCache.delete(oldAccessToken);
    }

    // Cache the new token
    await TokenCache.set(newAccessToken, {
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
 * Logout: Removes token from cache (simple implementation)
 * In production, this could also blacklist the token in a database
 */
exports.logout = async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Remove token from cache
    await TokenCache.delete(accessToken);

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
 * Verifica la validez de un token JWT
 * Cache: Checks if token is in active session cache before verifying JWT
 */
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Check if token is in cache (active session)
    const cachedUser = await TokenCache.get(token);
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

/**
 * Registra un nuevo usuario
 * Cache: Stores accessToken -> user payload mapping
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
      password, // In production: hash with bcrypt
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

