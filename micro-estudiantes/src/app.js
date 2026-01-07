require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { optionalAuth } = require('shared-auth');
const reservasRoutes = require('./routes/reservasRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint (doesn't require DB)
app.get('/health', (req, res) => res.json({ service: 'micro-estudiantes', status: 'ok' }));

app.use(optionalAuth);
applySecurity(app);

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => logger.info(`micro-estudiantes listening on 0.0.0.0:${PORT}`));
