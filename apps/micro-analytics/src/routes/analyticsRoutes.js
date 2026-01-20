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
router.get('/events', authenticateToken, (req, res) => {
  const { queryBus } = req.app.locals;
  analyticsController.getEvents(req, res, queryBus);
});

/**
 * GET /analytics/stats
 * Retorna estadísticas agregadas
 */
router.get('/stats', authenticateToken, (req, res) => {
  const { queryBus } = req.app.locals;
  analyticsController.getStats(req, res, queryBus);
});

/**
 * POST /analytics/events
 * Registra un evento manualmente
 */
router.post('/events', authenticateToken, (req, res) => {
  const { commandBus } = req.app.locals;
  analyticsController.trackEvent(req, res, commandBus);
});

/**
 * GET /analytics/report
 * Genera un reporte de analytics
 */
router.get('/report', authenticateToken, requireRole('admin'), (req, res) => {
  const { queryBus } = req.app.locals;
  analyticsController.generateReport(req, res, queryBus);
});

module.exports = router;
