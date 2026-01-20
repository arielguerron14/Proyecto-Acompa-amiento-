const express = require('express');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const { initRedis } = require('./services/redisClient');
const mongoose = require('mongoose');
const { MONGO_URI } = require('./config');

// CQRS
const { CommandBus, QueryBus } = require('./infrastructure/config/cqrs-bus');
const CreateUserCommandHandler = require('./application/command-handlers/CreateUserCommandHandler');
const LoginUserCommandHandler = require('./application/command-handlers/LoginUserCommandHandler');
const GetUserByIdQueryHandler = require('./application/query-handlers/GetUserByIdQueryHandler');
const CreateUserCommand = require('./application/commands/CreateUserCommand');
const LoginUserCommand = require('./application/commands/LoginUserCommand');
const GetUserByIdQuery = require('./application/queries/GetUserByIdQuery');
const UserRepository = require('./infrastructure/persistence-write/UserRepository');

let requestLogger, logger, errorHandler, notFound;
try {
  ({ requestLogger, logger } = require('@proyecto/shared-auth/src/middlewares/logger'));
  ({ errorHandler, notFound } = require('@proyecto/shared-auth/src/middlewares/errorHandler'));
} catch (err) {
  ({ requestLogger, logger, errorHandler, notFound } = require('./fallback/logger'));
}

let promClient, createMetrics, metricsMiddleware, metricsRoute;
try {
  promClient = require('prom-client');
  ({ createMetrics } = require('@proyecto/shared-monitoring/src/metrics'));
  ({ metricsMiddleware, metricsRoute } = createMetrics(promClient));
} catch (err) {
  // Metrics optional - create fallback middleware factories
  metricsMiddleware = () => (req, res, next) => next();
  metricsRoute = (req, res) => res.status(404).json({ error: 'Metrics not available' });
}

const app = express();

// Initialize CQRS Buses
const commandBus = new CommandBus();
const queryBus = new QueryBus();

// Register handlers
const userRepository = new UserRepository();
commandBus.register(CreateUserCommand, new CreateUserCommandHandler(userRepository));
commandBus.register(LoginUserCommand, new LoginUserCommandHandler(userRepository));
queryBus.register(GetUserByIdQuery, new GetUserByIdQueryHandler(userRepository));

// Make buses available to controllers
app.locals.commandBus = commandBus;
app.locals.queryBus = queryBus;

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

  // If not connected and not connecting, try to connect now (retry)
  if (!mongoConnected && !mongoConnecting) {
    mongoConnecting = true;
    mongoConnectionPromise = mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    try {
      await mongoConnectionPromise;
      mongoConnected = true;
      mongoConnecting = false;
      logger.info(`Mongo connected for micro-auth (retry)`);
      return next();
    } catch (err) {
      mongoConnecting = false;
      logger.warn(`Mongo connection retry failed: ${err.message}`);
      return res.status(503).json({ error: 'Database connection failed', message: err.message });
    }
  }

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
