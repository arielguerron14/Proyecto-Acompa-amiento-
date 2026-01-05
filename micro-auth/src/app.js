const express = require('express');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { initRedis } = require('./services/redisClient');
const mongoose = require('mongoose');
const { MONGO_URI } = require('./config');
const { requestLogger, logger } = require('@proyecto/shared-auth/src/middlewares/logger');
const { errorHandler, notFound } = require('@proyecto/shared-auth/src/middlewares/errorHandler');
const promClient = require('prom-client');
const { createMetrics } = require('@proyecto/shared-monitoring/src/metrics');
const { metricsMiddleware, metricsRoute } = createMetrics(promClient);

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);
app.use(metricsMiddleware());

// Routes
app.use('/auth', authRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-auth', timestamp: new Date().toISOString() })
);
app.get('/metrics', metricsRoute);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

// Initialize Redis and then start server
async function startServer() {
  try {
    // Try to initialize Redis (optional, falls back to memory cache)
    await initRedis();

    // Start the server first
    const server = app.listen(PORT, () => logger.info(`micro-auth listening on ${PORT}`));

    // Initialize MongoDB connection for auth (optional, runs in background)
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => logger.info(`Mongo connected for micro-auth`))
      .catch(error => logger.warn(`Mongo connection failed: ${error.message}`));

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => logger.info('micro-auth shutdown complete'));
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Only start the server when this file is executed directly. This prevents
// tests (which import `app`) from auto-starting connections to Redis/Mongo
// and keeps the test environment clean.
if (require.main === module) {
  startServer();
}

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
