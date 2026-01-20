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
const RegistrarAtencionCommand = require('./application/commands/RegistrarAtencionCommand');

// Queries
const GetReportesByMaestroQuery = require('./application/queries/GetReportesByMaestroQuery');
const GetReporteByIdQuery = require('./application/queries/GetReporteByIdQuery');

// Handlers
const RegistrarAtencionCommandHandler = require('./application/command-handlers/RegistrarAtencionCommandHandler');
const GetReportesByMaestroQueryHandler = require('./application/query-handlers/GetReportesByMaestroQueryHandler');
const GetReporteByIdQueryHandler = require('./application/query-handlers/GetReporteByIdQueryHandler');

// Repository
const ReporteMaestroRepository = require('./infrastructure/persistence-write/ReporteMaestroRepository');

const reportesRoutes = require('./routes/reportesMaestroRoutes');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(optionalAuth);
applySecurity(app);

connectDB()
  .then(() => logger.info('Mongo connected'))
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

// Initialize CQRS buses
const commandBus = new CommandBus();
const queryBus = new QueryBus();
const reporteRepository = new ReporteMaestroRepository();

// Register command handlers
commandBus.register(RegistrarAtencionCommand, new RegistrarAtencionCommandHandler(reporteRepository));

// Register query handlers
queryBus.register(GetReportesByMaestroQuery, new GetReportesByMaestroQueryHandler(reporteRepository));
queryBus.register(GetReporteByIdQuery, new GetReporteByIdQueryHandler(reporteRepository));

// Make buses available to controllers
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

app.use('/', reportesRoutes);
app.get('/health', (req, res) => res.json({ service: 'micro-reportes-maestros', status: 'ok' }));

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

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => logger.info(`micro-reportes-maestros listening on ${PORT}`));
