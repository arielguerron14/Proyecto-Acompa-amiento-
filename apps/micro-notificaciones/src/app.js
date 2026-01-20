const express = require('express');
require('dotenv').config();
const notificacionesRoutes = require('./routes/notificacionesRoutes');
const { requestLogger, logger } = require('shared-auth/src/middlewares/logger');
const { errorHandler, notFound } = require('shared-auth/src/middlewares/errorHandler');

// CQRS imports
const CommandBus = require('shared-cqrs/src/buses/CommandBus');
const QueryBus = require('shared-cqrs/src/buses/QueryBus');
const SendEmailCommand = require('./application/commands/SendEmailCommand');
const SendSMSCommand = require('./application/commands/SendSMSCommand');
const SendPushCommand = require('./application/commands/SendPushCommand');
const GetTemplatesQuery = require('./application/queries/GetTemplatesQuery');
const SendEmailCommandHandler = require('./application/handlers/SendEmailCommandHandler');
const SendSMSCommandHandler = require('./application/handlers/SendSMSCommandHandler');
const SendPushCommandHandler = require('./application/handlers/SendPushCommandHandler');
const GetTemplatesQueryHandler = require('./application/handlers/GetTemplatesQueryHandler');
const NotificationRepository = require('./infrastructure/persistence-write/NotificationRepository');
const NotificacionesService = require('./services/notificacionesService');

const app = express();

// Initialize CQRS infrastructure
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const notificationRepository = new NotificationRepository();
const notificacionesService = new NotificacionesService();

// Register command handlers
commandBus.register(SendEmailCommand, new SendEmailCommandHandler(notificationRepository, notificacionesService));
commandBus.register(SendSMSCommand, new SendSMSCommandHandler(notificationRepository, notificacionesService));
commandBus.register(SendPushCommand, new SendPushCommandHandler(notificationRepository, notificacionesService));

// Register query handlers
queryBus.register(GetTemplatesQuery, new GetTemplatesQueryHandler(notificacionesService));

// Store buses in app locals for middleware/route access
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/notificaciones', notificacionesRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-notificaciones', timestamp: new Date().toISOString() })
);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5006;
const server = app.listen(PORT, () => logger.info(`micro-notificaciones listening on ${PORT}`));

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => logger.info('micro-notificaciones shutdown complete'));
});

module.exports = app;
