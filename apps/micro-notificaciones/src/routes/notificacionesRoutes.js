const express = require('express');
const notificacionesController = require('../controllers/notificacionesController');
const { authenticateToken } = require('@proyecto/shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /notificaciones/email
 * Envía una notificación por email
 */
router.post('/email', authenticateToken, notificacionesController.sendEmail);

/**
 * POST /notificaciones/sms
 * Envía una notificación por SMS
 */
router.post('/sms', authenticateToken, notificacionesController.sendSMS);

/**
 * POST /notificaciones/push
 * Envía una notificación push
 */
router.post('/push', authenticateToken, notificacionesController.sendPush);

/**
 * GET /notificaciones/templates
 * Retorna los templates disponibles
 */
router.get('/templates', notificacionesController.getTemplates);

module.exports = router;
