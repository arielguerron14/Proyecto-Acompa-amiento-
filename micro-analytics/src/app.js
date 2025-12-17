const express = require('express');
require('dotenv').config();
const analyticsRoutes = require('./routes/analyticsRoutes');
const { requestLogger, logger } = require('shared-auth/src/middlewares/logger');
const { errorHandler, notFound } = require('shared-auth/src/middlewares/errorHandler');

const app = express();

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
