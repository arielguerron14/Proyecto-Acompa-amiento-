require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { connectDB } = require('./database');
const { applySecurity } = require('./middlewares/security');
const { requestLogger, logger } = require('./middlewares/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { authenticateToken, optionalAuth } = require('./middlewares/authMiddleware');

const horariosRoutes = require('./routes/horariosRoutes');

const app = express();

// Core middleware
app.use(bodyParser.json());
app.use(requestLogger);

// Autenticación opcional por defecto
app.use(optionalAuth);

// security, CORS, rate limit
applySecurity(app);

// connect to DB
connectDB().then(() => logger.info('Mongo connected')).catch(e => { logger.error(e); process.exit(1); });

// routes
app.use('/', horariosRoutes);
app.get('/health', (req,res)=> res.json({ service: 'micro-maestros', status: 'ok' }));

// 404 and error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, ()=> logger.info(`micro-maestros listening on ${PORT}`));
