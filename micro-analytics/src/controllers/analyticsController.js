const AnalyticsService = require('../services/analyticsService');

/**
 * Retorna los eventos registrados
 */
exports.getEvents = async (req, res) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    const events = await AnalyticsService.getEvents({
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
    });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('[analyticsController.getEvents]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Retorna estadísticas agregadas
 */
exports.getStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    const stats = await AnalyticsService.getStats(period);

    res.status(200).json({
      success: true,
      period,
      stats,
    });
  } catch (error) {
    console.error('[analyticsController.getStats]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Registra un evento manualmente
 */
exports.trackEvent = async (req, res) => {
  try {
    const { eventType, userId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const event = await AnalyticsService.trackEvent({
      eventType,
      userId,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      event,
    });
  } catch (error) {
    console.error('[analyticsController.trackEvent]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Genera un reporte de analytics
 */
exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const report = await AnalyticsService.generateReport({
      startDate,
      endDate,
      format,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
      res.send(report);
    } else {
      res.status(200).json({
        success: true,
        report,
      });
    }
  } catch (error) {
    console.error('[analyticsController.generateReport]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
