const express = require('express');
require('dotenv').config();
const soapRoutes = require('./routes/soapRoutes');
const { requestLogger, logger } = require('@proyecto/shared-auth/src/middlewares/logger');
const { errorHandler, notFound } = require('@proyecto/shared-auth/src/middlewares/errorHandler');

// CQRS imports
const CommandBus = require('shared-cqrs/src/buses/CommandBus');
const QueryBus = require('shared-cqrs/src/buses/QueryBus');
const CallSOAPServiceCommand = require('./application/commands/CallSOAPServiceCommand');
const TransformDataCommand = require('./application/commands/TransformDataCommand');
const ListServicesQuery = require('./application/queries/ListServicesQuery');
const GetWSDLQuery = require('./application/queries/GetWSDLQuery');
const CallSOAPServiceCommandHandler = require('./application/handlers/CallSOAPServiceCommandHandler');
const TransformDataCommandHandler = require('./application/handlers/TransformDataCommandHandler');
const ListServicesQueryHandler = require('./application/handlers/ListServicesQueryHandler');
const GetWSDLQueryHandler = require('./application/handlers/GetWSDLQueryHandler');
const SOAPServiceRepository = require('./infrastructure/persistence-write/SOAPServiceRepository');
const SoapService = require('./services/soapService');

const app = express();

// Initialize CQRS infrastructure
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const soapServiceRepository = new SOAPServiceRepository();
const soapService = new SoapService();

// Register command handlers
commandBus.register(CallSOAPServiceCommand, new CallSOAPServiceCommandHandler(soapServiceRepository, soapService));
commandBus.register(TransformDataCommand, new TransformDataCommandHandler(soapServiceRepository, soapService));

// Register query handlers
queryBus.register(ListServicesQuery, new ListServicesQueryHandler(soapServiceRepository, soapService));
queryBus.register(GetWSDLQuery, new GetWSDLQueryHandler(soapServiceRepository, soapService));

// Store buses in app locals for middleware/route access
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/soap', soapRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-soap-bridge', timestamp: new Date().toISOString() })
);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5008;
const server = app.listen(PORT, () => logger.info(`micro-soap-bridge listening on ${PORT}`));

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => logger.info('micro-soap-bridge shutdown complete'));
});

module.exports = app;
