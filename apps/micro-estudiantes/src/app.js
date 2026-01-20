require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const reservasRoutes = require('./routes/reservasRoutes');

// CQRS
const { CommandBus, QueryBus } = require('./infrastructure/config/cqrs-bus');
const CreateReservaCommandHandler = require('./application/command-handlers/CreateReservaCommandHandler');
const CancelReservaCommandHandler = require('./application/command-handlers/CancelReservaCommandHandler');
const GetReservasByEstudianteQueryHandler = require('./application/query-handlers/GetReservasByEstudianteQueryHandler');
const GetReservasByMaestroQueryHandler = require('./application/query-handlers/GetReservasByMaestroQueryHandler');
const CheckAvailabilityQueryHandler = require('./application/query-handlers/CheckAvailabilityQueryHandler');
const CreateReservaCommand = require('./application/commands/CreateReservaCommand');
const CancelReservaCommand = require('./application/commands/CancelReservaCommand');
const GetReservasByEstudianteQuery = require('./application/queries/GetReservasByEstudianteQuery');
const GetReservasByMaestroQuery = require('./application/queries/GetReservasByMaestroQuery');
const CheckAvailabilityQuery = require('./application/queries/CheckAvailabilityQuery');
const ReservaRepository = require('./infrastructure/persistence-write/ReservaRepository');

const app = express();

// Initialize CQRS Buses
const commandBus = new CommandBus();
const queryBus = new QueryBus();

// Register handlers
const reservaRepository = new ReservaRepository();
commandBus.register(CreateReservaCommand, new CreateReservaCommandHandler(reservaRepository));
commandBus.register(CancelReservaCommand, new CancelReservaCommandHandler(reservaRepository));
queryBus.register(GetReservasByEstudianteQuery, new GetReservasByEstudianteQueryHandler(reservaRepository));
queryBus.register(GetReservasByMaestroQuery, new GetReservasByMaestroQueryHandler(reservaRepository));
queryBus.register(CheckAvailabilityQuery, new CheckAvailabilityQueryHandler(reservaRepository));

// Make buses available to controllers
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint (doesn't require DB)
app.get('/health', (req, res) => res.json({ service: 'micro-estudiantes', status: 'ok' }));

// applySecurity(app); // Si es necesario para el flujo mínimo, dejarlo

// Connect to database
connectDB()
  .then(() => {
    logger.info('✅ Mongo connected successfully');
  })
  .catch(e => {
    logger.error('❌ MongoDB connection failed (will retry):', e.message);
    // Don't exit - let the app run anyway and try to reconnect later
    // process.exit(1);
  });

app.use('/', reservasRoutes);

// Debug endpoint - check MongoDB connection status
app.get('/debug/mongo', (req, res) => {
  const mongoose = require('mongoose');
  const status = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({ 
    mongodb: states[status] || 'unknown',
    status: status,
    host: mongoose.connection.host || 'N/A',
    name: mongoose.connection.name || 'N/A'
  });
});

// Debug endpoint - test query
app.get('/debug/test-query', async (req, res) => {
  try {
    const Reserva = require('./models/Reserva');
    const count = await Reserva.countDocuments();
    res.json({ success: true, count: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

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

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => logger.info(`micro-estudiantes listening on 0.0.0.0:${PORT}`));
