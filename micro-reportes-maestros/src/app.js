require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { optionalAuth } = require('../../../shared-auth/src/middlewares/authMiddleware');
const reportesRoutes = require('./routes/reportesMaestroRoutes');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use(optionalAuth);
applySecurity(app);

connectDB()
  .then(() => logger.info('Mongo connected'))
  .catch(e => {
    logger.error(e);
    process.exit(1);
  });

app.use('/', reportesRoutes);
app.get('/health', (req, res) => res.json({ service: 'micro-reportes-maestros', status: 'ok' }));

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

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => logger.info(`micro-reportes-maestros listening on ${PORT}`));
