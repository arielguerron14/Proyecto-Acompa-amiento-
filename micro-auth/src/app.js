const express = require('express');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { initRedis } = require('./services/redisClient');
const { requestLogger, logger } = require('../../shared-auth/src/middlewares/logger');
const { errorHandler, notFound } = require('../../shared-auth/src/middlewares/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/auth', authRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-auth', timestamp: new Date().toISOString() })
);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

// Initialize Redis and then start server
async function startServer() {
  try {
    // Try to initialize Redis (optional, falls back to memory cache)
    await initRedis();
    
    const server = app.listen(PORT, () => logger.info(`micro-auth listening on ${PORT}`));

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => logger.info('micro-auth shutdown complete'));
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
