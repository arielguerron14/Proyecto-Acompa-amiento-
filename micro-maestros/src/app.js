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

// Health check endpoint (doesn't require DB)
app.get('/health', (req, res) => res.json({ service: 'micro-maestros', status: 'ok' }));

// Core middleware
app.use(express.json());
app.use(requestLogger);
app.use(optionalAuth);
applySecurity(app);

// Connect to DB
connectDB()
  .then(() => {
    logger.info('Mongo connected');
  })
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

// Routes
app.use('/', horariosRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => logger.info(`micro-maestros listening on ${PORT}`));
