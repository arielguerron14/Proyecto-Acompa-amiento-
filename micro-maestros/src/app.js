require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
// Import auth middleware from shared package (works both locally and in containers)
const { optionalAuth } = require('shared-auth');
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
