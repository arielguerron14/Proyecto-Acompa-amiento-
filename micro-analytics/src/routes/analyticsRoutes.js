const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireRole } = require('@proyecto/shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

/**
 * GET /analytics/events
 * Retorna los eventos registrados
 */
router.get('/events', authenticateToken, analyticsController.getEvents);

/**
 * GET /analytics/stats
 * Retorna estadísticas agregadas
 */
router.get('/stats', authenticateToken, analyticsController.getStats);

/**
 * POST /analytics/events
 * Registra un evento manualmente
 */
router.post('/events', authenticateToken, analyticsController.trackEvent);

/**
 * GET /analytics/report
 * Genera un reporte de analytics
 */
router.get('/report', authenticateToken, requireRole('admin'), analyticsController.generateReport);

module.exports = router;
