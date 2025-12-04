const express = require('express');
require('dotenv').config();
const soapRoutes = require('./routes/soapRoutes');
const { requestLogger, logger } = require('../../../shared-auth/src/middlewares/logger');
const { errorHandler, notFound } = require('../../../shared-auth/src/middlewares/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/soap', soapRoutes);
app.get('/health', (req, res) =>
  res.json({ status: 'healthy', service: 'micro-soap-bridge', timestamp: new Date().toISOString() })
);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5008;
const server = app.listen(PORT, () => logger.info(`micro-soap-bridge listening on ${PORT}`));

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => logger.info('micro-soap-bridge shutdown complete'));
});

module.exports = app;
