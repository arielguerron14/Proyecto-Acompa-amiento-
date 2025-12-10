const AuthService = require('../../../shared-auth/src/services/authService');
const SessionService = require('../services/sessionService');
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

    // TODO: Guardar usuario en base de datos
    // Por ahora, simular que se guardó correctamente
    // En producción, verificar si el usuario ya existe y guardarlo en BD

    const userId = `user_${Date.now()}`; // Simular generación de ID
    const userRole = role || 'estudiante';

    // Inicializar sesión con tokenVersion = 0
    await SessionService.setTokenVersion(userId, 0);

    // NO generar token aquí, solo guardar datos del usuario
    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        userId,
        email,
        name,
        role: userRole
      }
    });
  } catch (error) {
    logger.error(`[userController.register] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar usuario'
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

    // TODO: Validar credenciales contra base de datos
    // Por ahora, simular un login exitoso
    // En producción: buscar usuario en BD y verificar contraseña con bcrypt

    // Simular búsqueda de usuario
    const userId = `user_${email.split('@')[0]}_${Date.now()}`;
    const roles = ['estudiante']; // Simulado; en producción, obtener de BD

    // Obtener o inicializar tokenVersion en Redis
    let tokenVersion = await SessionService.getTokenVersion(userId);
    if (tokenVersion === null) {
      tokenVersion = 0;
      await SessionService.setTokenVersion(userId, tokenVersion);
    }

    // Generar JWT con tokenVersion incluido
    const token = AuthService.generateAccessTokenWithVersion(userId, roles, tokenVersion);

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        userId,
        email,
        roles
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
exports.me = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logger.error(`[userController.me] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener datos del usuario'
    });
  }
};
