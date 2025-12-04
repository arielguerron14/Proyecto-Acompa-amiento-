require('dotenv').config();
const express = require('express');
const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { optionalAuth } = require('./middlewares/authMiddleware');
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => logger.info(`micro-estudiantes listening on ${PORT}`));
