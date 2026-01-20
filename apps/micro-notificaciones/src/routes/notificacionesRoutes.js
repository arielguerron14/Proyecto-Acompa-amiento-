const express = require('express');
const notificacionesController = require('../controllers/notificacionesController');
const { authenticateToken } = require('@proyecto/shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /notificaciones/email
 * Envía una notificación por email
 */
router.post('/email', authenticateToken, (req, res) => {
  const { commandBus } = req.app.locals;
  notificacionesController.sendEmail(req, res, commandBus);
});

/**
 * POST /notificaciones/sms
 * Envía una notificación por SMS
 */
router.post('/sms', authenticateToken, (req, res) => {
  const { commandBus } = req.app.locals;
  notificacionesController.sendSMS(req, res, commandBus);
});

/**
 * POST /notificaciones/push
 * Envía una notificación push
 */
router.post('/push', authenticateToken, (req, res) => {
  const { commandBus } = req.app.locals;
  notificacionesController.sendPush(req, res, commandBus);
});

/**
 * GET /notificaciones/templates
 * Retorna los templates disponibles
 */
router.get('/templates', (req, res) => {
  const { queryBus } = req.app.locals;
  notificacionesController.getTemplates(req, res, queryBus);
});

module.exports = router;
