let AuthService;
try {
  AuthService = require('@proyecto/shared-auth/src/services/authService');
} catch (err) {
  AuthService = require('../fallback/authService');
}

const SessionService = require('../services/sessionService');
const User = require('../models/User');
const CreateUserCommand = require('../application/commands/CreateUserCommand');
const LoginUserCommand = require('../application/commands/LoginUserCommand');
const GetUserByIdQuery = require('../application/queries/GetUserByIdQuery');

let logger;
try {
  ({ logger } = require('@proyecto/shared-auth/src/middlewares/logger'));
} catch (err) {
  ({ logger } = require('../fallback/logger'));
}

/**
 * UserController: Maneja login, register, logout
 * MIGRADO A CQRS: Usa CommandBus y QueryBus en lugar de llamadas directas a servicios
 */

/**
 * POST /auth/register
 * Registra un nuevo usuario usando CQRS CommandBus
 */
exports.register = async (req, res, next, commandBus) => {
  try {
    const { email, password, name, role } = req.body;

    // Validación básica
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password y name son requeridos'
      });
    }

    // Crear comando
    const command = new CreateUserCommand(email, password, name, role || 'estudiante');

    // Ejecutar comando a través del CQRS Bus
    logger.info(`[userController.register] Executing CreateUserCommand for ${email}`);
    const result = await commandBus.execute(command);

    // Inicializar sesión con tokenVersion = 0
    await SessionService.setTokenVersion(result.user.userId, 0);

    return res.status(201).json(result);
  } catch (error) {
    logger.error(`[userController.register] Error: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Error al registrar usuario',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /auth/login
 * Autentica usuario usando CQRS CommandBus
 */
exports.login = async (req, res, next, commandBus) => {
  try {
    console.log(`[userController.login] Incoming request body:`, req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y password son requeridos'
      });
    }

    // Crear comando
    const command = new LoginUserCommand(email, password);

    // Ejecutar comando a través del CQRS Bus
    logger.info(`[userController.login] Executing LoginUserCommand for ${email}`);
    console.log(`[userController.login] Executing LoginUserCommand for ${email}`);
    const result = await commandBus.execute(command);

    console.log(`[userController.login] Login result:`, { status: 'ok', hasToken: !!result.token, userId: result.user?.userId });
    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[userController.login] Error: ${error.message}`);
    console.warn(`[userController.login] Error detail:`, error);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Error al autenticar usuario'
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
 * Retorna los datos del usuario actual usando CQRS QueryBus
 */
exports.me = async (req, res, next, queryBus) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado'
      });
    }

    // Crear query
    const query = new GetUserByIdQuery(req.user.userId);

    // Ejecutar query a través del CQRS Bus
    logger.info(`[userController.me] Executing GetUserByIdQuery for ${req.user.userId}`);
    const result = await queryBus.execute(query);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`[userController.me] Error: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Error al obtener datos del usuario'
    });
  }
};

