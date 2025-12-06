const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../../shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /auth/login
 * Autentica un usuario y retorna accessToken y refreshToken
 */
router.post('/login', authController.login);

/**
 * POST /auth/refresh
 * Refresca el accessToken usando el refreshToken
 */
router.post('/refresh', authController.refresh);

/**
 * POST /auth/logout
 * Desautentica el usuario y elimina el token del cache
 */
router.post('/logout', authController.logout);

/**
 * POST /auth/register
 * Registra un nuevo usuario
 */
router.post('/register', authController.register);

/**
 * POST /auth/verify-token
 * Verifica la validez de un token JWT (contra cache + JWT)
 */
router.post('/verify-token', authController.verifyToken);

/**
 * POST /auth/validate-permission
 * Valida si un usuario tiene un permiso específico
 */
router.post('/validate-permission', authenticateToken, authController.validatePermission);

/**
 * GET /auth/roles
 * Retorna la lista de roles disponibles
 */
router.get('/roles', authController.getRoles);

/**
 * GET /auth/roles/:roleId/permissions
 * Retorna los permisos de un rol específico
 */
router.get('/roles/:roleId/permissions', authController.getRolePermissions);

module.exports = router;
