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

// Global state for database connection
let mongoConnected = false;
let mongoConnecting = false;
let mongoConnectionPromise = null;

// Middleware to ensure Mongo is connected before processing requests
const ensureMongoConnected = async (req, res, next) => {
  // If already connected, continue
  if (mongoConnected) {
    return next();
  }

  // If currently connecting, wait for it
  if (mongoConnecting && mongoConnectionPromise) {
    try {
      await mongoConnectionPromise;
      mongoConnected = true;
      return next();
    } catch (err) {
      return res.status(503).json({ error: 'Database connection failed' });
    }
  }

  // If not connecting and not connected, something's wrong
  return res.status(503).json({ error: 'Database not initialized' });
};

// Middleware
app.use(express.json());
app.use(requestLogger);
app.use(metricsMiddleware());

// Routes
app.use('/auth', ensureMongoConnected, authRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-auth', timestamp: new Date().toISOString() })
);
app.get('/debug/mongo-status', (req, res) =>
  res.json({ 
    mongoConnected, 
    mongoConnecting, 
    mongoUri: MONGO_URI,
    mongoReadyState: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    timestamp: new Date().toISOString() 
  })
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

    // Initialize MongoDB connection for auth (runs in background)
    mongoConnecting = true;
    mongoConnectionPromise = mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    mongoConnectionPromise
      .then(() => {
        mongoConnected = true;
        mongoConnecting = false;
        logger.info(`Mongo connected for micro-auth`);
      })
      .catch(error => {
        mongoConnecting = false;
        logger.warn(`Mongo connection failed: ${error.message}`);
      });

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
