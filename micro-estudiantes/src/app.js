require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { optionalAuth } = require('/usr/src/shared-auth/src/middlewares/authMiddleware');
const reservasRoutes = require('./routes/reservasRoutes');

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

app.use('/', reservasRoutes);
app.get('/health', (req, res) => res.json({ service: 'micro-estudiantes', status: 'ok' }));

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

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => logger.info(`micro-estudiantes listening on ${PORT}`));
