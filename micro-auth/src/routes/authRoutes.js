const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * Rutas públicas
 */

/**
 * POST /auth/register
 * Registra un nuevo usuario (sin generar token)
 */
router.post('/register', userController.register);

/**
 * POST /auth/login
 * Autentica usuario y genera JWT con tokenVersion
 */
router.post('/login', userController.login);

/**
 * POST /auth/verify-token
 * Verifica la validez de un token JWT
 */
router.post('/verify-token', authController.verifyToken);

/**
 * Validate permission for a role (requires Authorization header)
 */
router.post('/validate-permission', authController.validatePermission);

/**
 * Roles and permissions endpoints
 */
router.get('/roles', authController.getRoles);
router.get('/roles/:roleId/permissions', authController.getRolePermissions);

/**
 * POST /auth/refresh
 * Refresca el access token usando refresh token
 */
router.post('/refresh', authController.refreshToken);

/**
 * Rutas protegidas
 */

/**
 * POST /auth/logout
 * Invalida el JWT actual
 */
router.post('/logout', authenticateToken, userController.logout);

/**
 * GET /auth/me
 * Obtiene datos del usuario autenticado
 */
router.get('/me', authenticateToken, userController.me);

module.exports = router;
