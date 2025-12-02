const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../../../shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /auth/verify-token
 * Verifica la validez de un token JWT
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
