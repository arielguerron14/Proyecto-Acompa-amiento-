require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Import auth middleware from shared package (works both locally and in containers)
let optionalAuth = (req, res, next) => next();
try {
  ({ optionalAuth } = require('shared-auth'));
} catch (err) {
  console.warn('⚠️  shared-auth not found, optionalAuth is passthrough');
}

// CQRS Infrastructure
const { CommandBus, QueryBus } = require('./infrastructure/config/cqrs-bus');

// Commands
const CreateHorarioCommand = require('./application/commands/CreateHorarioCommand');
const UpdateHorarioCommand = require('./application/commands/UpdateHorarioCommand');
const DeleteHorarioCommand = require('./application/commands/DeleteHorarioCommand');

// Queries
const GetHorariosByMaestroQuery = require('./application/queries/GetHorariosByMaestroQuery');
const GetAllHorariosQuery = require('./application/queries/GetAllHorariosQuery');
const GetHorariosReportesQuery = require('./application/queries/GetHorariosReportesQuery');

// Handlers
const CreateHorarioCommandHandler = require('./application/command-handlers/CreateHorarioCommandHandler');
const UpdateHorarioCommandHandler = require('./application/command-handlers/UpdateHorarioCommandHandler');
const DeleteHorarioCommandHandler = require('./application/command-handlers/DeleteHorarioCommandHandler');
const GetHorariosByMaestroQueryHandler = require('./application/query-handlers/GetHorariosByMaestroQueryHandler');
const GetAllHorariosQueryHandler = require('./application/query-handlers/GetAllHorariosQueryHandler');
const GetHorariosReportesQueryHandler = require('./application/query-handlers/GetHorariosReportesQueryHandler');

// Repository
const HorarioRepository = require('./infrastructure/persistence-write/HorarioRepository');

const horariosRoutes = require('./routes/horariosRoutes');

const app = express();

// Health check endpoint (doesn't require DB)
app.get('/health', (req, res) => res.json({ service: 'micro-maestros', status: 'ok' }));

// Use express.json globally for all routes (including /horarios)
app.use(express.json({ limit: '1mb' }));

// Core middleware para el resto
app.use(requestLogger);
app.use(optionalAuth);
applySecurity(app);

// Connect to DB
connectDB()
  .then(() => {
    logger.info('✅ Mongo connected successfully');
  })
  .catch(e => {
    logger.error('❌ MongoDB connection failed (will retry):', e.message);
    // Don't exit - let the app run anyway and try to reconnect later
    // process.exit(1);
  });

// Initialize CQRS buses
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const horarioRepository = new HorarioRepository();

// Register command handlers
commandBus.register(CreateHorarioCommand, new CreateHorarioCommandHandler(horarioRepository));
commandBus.register(UpdateHorarioCommand, new UpdateHorarioCommandHandler(horarioRepository));
commandBus.register(DeleteHorarioCommand, new DeleteHorarioCommandHandler(horarioRepository));

// Register query handlers
queryBus.register(GetHorariosByMaestroQuery, new GetHorariosByMaestroQueryHandler(horarioRepository));
queryBus.register(GetAllHorariosQuery, new GetAllHorariosQueryHandler(horarioRepository));
queryBus.register(GetHorariosReportesQuery, new GetHorariosReportesQueryHandler(horarioRepository));

// Make buses available to controllers
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

// Routes
app.use('/', horariosRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => logger.info(`micro-maestros listening on 0.0.0.0:${PORT}`));

// Handler global para evitar que el proceso muera por errores no controlados
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  if (err && err.stack) {
    console.error('STACKTRACE:', err.stack);
  }
  logger.error('UNCAUGHT EXCEPTION:', err.message, err.stack || '');
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION:', reason && reason.message ? reason.message : reason, reason && reason.stack ? reason.stack : '');
});
