const express = require('express');
require('dotenv').config();
const analyticsRoutes = require('./routes/analyticsRoutes');
const { requestLogger, logger, errorHandler, notFound } = require('@proyecto/shared-auth');

// CQRS imports
const { CommandBus, QueryBus } = require('./infrastructure/config/cqrs-bus');
const TrackEventCommand = require('./application/commands/TrackEventCommand');
const GetEventsQuery = require('./application/queries/GetEventsQuery');
const GetStatsQuery = require('./application/queries/GetStatsQuery');
const GenerateReportQuery = require('./application/queries/GenerateReportQuery');
const TrackEventCommandHandler = require('./application/handlers/TrackEventCommandHandler');
const GetEventsQueryHandler = require('./application/handlers/GetEventsQueryHandler');
const GetStatsQueryHandler = require('./application/handlers/GetStatsQueryHandler');
const GenerateReportQueryHandler = require('./application/handlers/GenerateReportQueryHandler');
const AnalyticsRepository = require('./infrastructure/persistence-write/AnalyticsRepository');
const AnalyticsService = require('./services/analyticsService');

const app = express();

// Initialize CQRS infrastructure
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const analyticsRepository = new AnalyticsRepository();
const analyticsService = new AnalyticsService();

// Register command handlers
commandBus.register(TrackEventCommand, new TrackEventCommandHandler(analyticsRepository, analyticsService));

// Register query handlers
queryBus.register(GetEventsQuery, new GetEventsQueryHandler(analyticsRepository, analyticsService));
queryBus.register(GetStatsQuery, new GetStatsQueryHandler(analyticsRepository, analyticsService));
queryBus.register(GenerateReportQuery, new GenerateReportQueryHandler(analyticsRepository, analyticsService));

// Store buses in app locals for middleware/route access
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/analytics', analyticsRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-analytics', timestamp: new Date().toISOString() })
);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5007;
const server = app.listen(PORT, () => logger.info(`micro-analytics listening on ${PORT}`));

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => logger.info('micro-analytics shutdown complete'));
});

module.exports = app;

module.exports = app;
