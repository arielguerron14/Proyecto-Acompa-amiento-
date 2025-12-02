require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const reportesRoutes = require('./routes/reportesEstRoutes');

const app = express();
app.use(bodyParser.json());
app.use(requestLogger);
const { authenticateToken, optionalAuth } = require('./middlewares/authMiddleware');
app.use(optionalAuth);
applySecurity(app);

connectDB().then(() => logger.info('Mongo connected')).catch(e => { logger.error(e); process.exit(1); });

app.use('/', reportesRoutes);
app.get('/health', (req,res)=> res.json({ service: 'micro-reportes-estudiantes', status: 'ok' }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5003;
app.listen(PORT, ()=> logger.info(`micro-reportes-estudiantes listening on ${PORT}`));
