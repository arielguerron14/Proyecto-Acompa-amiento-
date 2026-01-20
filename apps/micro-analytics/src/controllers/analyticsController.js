const TrackEventCommand = require('../application/commands/TrackEventCommand');
const GetEventsQuery = require('../application/queries/GetEventsQuery');
const GetStatsQuery = require('../application/queries/GetStatsQuery');
const GenerateReportQuery = require('../application/queries/GenerateReportQuery');

/**
 * Retorna los eventos registrados
 */
exports.getEvents = async (req, res, queryBus) => {
  try {
    const { limit = 50, offset = 0, type } = req.query;

    const query = new GetEventsQuery(limit, offset, type);
    const result = await queryBus.execute(query);

    res.status(result.status || 200).json({
      success: true,
      count: result.data.length,
      events: result.data,
    });
  } catch (error) {
    console.error('[analyticsController.getEvents]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Retorna estadísticas agregadas
 */
exports.getStats = async (req, res, queryBus) => {
  try {
    const { period = '7d' } = req.query;

    const query = new GetStatsQuery(period);
    const result = await queryBus.execute(query);

    res.status(result.status || 200).json({
      success: true,
      period: result.data.period,
      stats: result.data.stats,
      total: result.data.total,
    });
  } catch (error) {
    console.error('[analyticsController.getStats]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Registra un evento manualmente
 */
exports.trackEvent = async (req, res, commandBus) => {
  try {
    const { eventType, userId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const command = new TrackEventCommand(eventType, userId, metadata);
    const result = await commandBus.execute(command);

    res.status(result.status || 201).json({
      success: true,
      message: result.message,
      event: result.result,
    });
  } catch (error) {
    console.error('[analyticsController.trackEvent]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};

/**
 * Genera un reporte de analytics
 */
exports.generateReport = async (req, res, queryBus) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const query = new GenerateReportQuery(startDate, endDate, format);
    const result = await queryBus.execute(query);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.csv"');
      res.send(result.data);
    } else {
      res.status(result.status || 200).json({
        success: true,
        report: result.data,
      });
    }
  } catch (error) {
    console.error('[analyticsController.generateReport]', error);
    const status = error.status || 500;
    res.status(status).json({ 
      error: error.message || 'Internal Server Error' 
    });
  }
};
