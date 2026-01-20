const express = require('express');
const analyticsController = require('../controllers/analyticsController');

// Try to load auth middleware, but continue without if not available
let authenticateToken = (req, res, next) => next();
let requireRole = (roles) => (req, res, next) => next();

try {
  const authModule = require('@proyecto/shared-auth/src/middlewares/authMiddleware');
  authenticateToken = authModule.authenticateToken;
  requireRole = authModule.requireRole;
} catch (err) {
  console.warn('⚠️  Auth middleware not found, using passthrough middleware');
}

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
