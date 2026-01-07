const AuthService = require('../../../shared-auth/src/services/authService');
const SessionService = require('../services/sessionService');
const User = require('../models/User');
const { logger } = require('../../../shared-auth/src/middlewares/logger');

/**
 * UserController: Maneja login, register, logout
 */

/**
 * POST /auth/register
 * Registra un nuevo usuario
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validación básica
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password y name son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    logger.info(`[userController.register] Checking if user exists: ${email}`);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      role: role || 'estudiante'
    });

    logger.info(`[userController.register] Attempting to save user: ${email}`);
    await user.save();
    logger.info(`[userController.register] User saved successfully: ${user._id}`);

    // Inicializar sesión con tokenVersion = 0
    await SessionService.setTokenVersion(user._id.toString(), 0);

    // NO generar token aquí, solo confirmar registro
    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`[userController.register] Error: ${error.message}`);
    logger.error(`[userController.register] Stack: ${error.stack}`);
    logger.error(`[userController.register] Error code: ${error.code}`);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar usuario',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /auth/login
 * Autentica usuario y genera JWT
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y password son requeridos'
      });
    }

    // Buscar usuario en la base de datos
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Cuenta desactivada'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Obtener o inicializar tokenVersion en Redis
    const userId = user._id.toString();
    let tokenVersion = await SessionService.getTokenVersion(userId);
    if (tokenVersion === null) {
      tokenVersion = 0;
      await SessionService.setTokenVersion(userId, tokenVersion);
    }

    // Generar JWT con tokenVersion incluido
    const token = AuthService.generateAccessTokenWithVersion(userId, [user.role], tokenVersion);

    // Generar refresh token
    const refreshToken = AuthService.generateRefreshToken({ userId, role: user.role, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      refreshToken,
      user: {
        userId,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`[userController.login] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Error al autenticar usuario'
    });
  }
};

/**
 * POST /auth/logout
 * Invalida el JWT actual incrementando tokenVersion
 */
exports.logout = async (req, res) => {
  try {
    // Obtener userId del JWT (desde middleware previo)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Usuario no identificado'
      });
    }

    // Incrementar tokenVersion para invalidar JWTs anteriores
    const newVersion = await SessionService.incrementTokenVersion(userId);

    if (newVersion === null) {
      return res.status(500).json({
        success: false,
        error: 'Error al procesar logout'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    logger.error(`[userController.logout] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Error al procesar logout'
    });
  }
};

/**
 * GET /auth/me
 * Retorna los datos del usuario actual
 */
exports.me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    // Obtener datos completos del usuario desde BD
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`[userController.me] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener datos del usuario'
    });
  }
};
