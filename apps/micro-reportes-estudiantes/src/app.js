require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { optionalAuth } = require('shared-auth');

// CQRS Infrastructure
const { CommandBus, QueryBus } = require('./infrastructure/config/cqrs-bus');

// Commands
const RegistrarEventoCommand = require('./application/commands/RegistrarEventoCommand');

// Queries
const GetReporteByEstudianteQuery = require('./application/queries/GetReporteByEstudianteQuery');

// Handlers
const RegistrarEventoCommandHandler = require('./application/command-handlers/RegistrarEventoCommandHandler');
const GetReporteByEstudianteQueryHandler = require('./application/query-handlers/GetReporteByEstudianteQueryHandler');

// Repository
const ReporteEstudianteRepository = require('./infrastructure/persistence-write/ReporteEstudianteRepository');

const reportesRoutes = require('./routes/reportesEstRoutes');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(optionalAuth);
applySecurity(app);

connectDB()
  .then(() => logger.info('MongoDB connected'))
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

// Initialize CQRS buses
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const reporteRepository = new ReporteEstudianteRepository();

// Register command handlers
commandBus.register(RegistrarEventoCommand, new RegistrarEventoCommandHandler(reporteRepository));

// Register query handlers
queryBus.register(GetReporteByEstudianteQuery, new GetReporteByEstudianteQueryHandler(reporteRepository));

// Make buses available to controllers
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

app.use('/reportes', reportesRoutes);
app.get('/health', (req, res) => res.json({ service: 'micro-reportes-estudiantes', status: 'ok' }));

// Health endpoint for Postgres (optional)
try {
  const db = require('./config/postgres');
  app.get('/health/db', async (req, res) => {
    try {
      const result = await db.query('SELECT 1 as ok');
      res.json({ postgres: 'ok', rows: result.rowCount });
    } catch (e) {
      res.status(500).json({ postgres: 'error', message: e.message });
    }
  });
} catch (e) {
  // postgres helper not present or pg not installed
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => logger.info(`micro-reportes-estudiantes listening on ${PORT}`));
