require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
let optionalAuth;
try {
  optionalAuth = require('/usr/src/shared-auth/src/middlewares/authMiddleware').optionalAuth;
} catch (e) {
  // Fallback to local path when running outside container
  optionalAuth = require('../../shared-auth/src/middlewares/authMiddleware').optionalAuth;
}
const horariosRoutes = require('./routes/horariosRoutes');

const app = express();

// Middleware to ensure MongoDB is connected
let mongoConnected = false;
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next(); // Health check doesn't require DB
  }
  if (!mongoConnected) {
    return res.status(503).json({ error: 'Database not ready, try again later' });
  }
  next();
});

// Core middleware
app.use(express.json());
app.use(requestLogger);
app.use(optionalAuth);
applySecurity(app);

// Connect to DB
connectDB()
  .then(() => {
    logger.info('Mongo connected');
    mongoConnected = true;
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

// Routes
app.use('/', horariosRoutes);
app.get('/health', (req, res) => res.json({ service: 'micro-maestros', status: 'ok' }));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => logger.info(`micro-maestros listening on ${PORT}`));
