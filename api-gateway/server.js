require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { applySecurity } = require('./src/middlewares/security');
const { requestLogger, logger } = require('./src/middlewares/logger');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const { setupSwagger } = require('./src/swagger');
const authRoutes = require('./src/routes/authRoutes');
const { initRedis } = require('./src/services/redisClient');
// Monitoring
const { startDefaultMetrics, metricsMiddleware, metricsRoute } = require('../shared-monitoring/src/metrics');

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());

// start default process metrics and HTTP instrumentation
startDefaultMetrics();
app.use(metricsMiddleware());

// APLICAR SEGURIDAD Y CORS PRIMERO (antes que cualquier ruta)
const maestros = process.env.MAESTROS_URL || 'http://micro-maestros:5001';
const estudiantes = process.env.ESTUDIANTES_URL || 'http://micro-estudiantes:5002';
const reportesEst = process.env.REPORTES_EST_URL || 'http://micro-reportes-estudiantes:5003';
const reportesMaest = process.env.REPORTES_MAEST_URL || 'http://micro-reportes-maestros:5004';
const frontend = process.env.FRONTEND_URL || 'http://frontend-web:5500';

applySecurity(app, { whitelist: [frontend] });

app.use(requestLogger);

// Rutas de autenticación (públicas)
app.use('/auth', authRoutes);

app.use('/maestros', createProxyMiddleware({ target: maestros, changeOrigin: true, pathRewrite: {'^/maestros': ''} }));
app.use('/estudiantes', createProxyMiddleware({ target: estudiantes, changeOrigin: true, pathRewrite: {'^/estudiantes': ''} }));
app.use('/reportes/estudiantes', createProxyMiddleware({ target: reportesEst, changeOrigin: true, pathRewrite: {'^/reportes/estudiantes': ''} }));
app.use('/reportes/maestros', createProxyMiddleware({ target: reportesMaest, changeOrigin: true, pathRewrite: {'^/reportes/maestros': ''} }));

// proxy frontend by default (but only for specific paths, not /)
// Commented out to avoid conflicts with auth routes
// app.use('/', createProxyMiddleware({ target: frontend, changeOrigin: true }));

// Serve simple health endpoint instead of proxying everything
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// Prometheus metrics endpoint
app.get('/metrics', metricsRoute);

// Swagger UI
setupSwagger(app);

app.use(notFound);
app.use(errorHandler);

process.on('uncaughtException', (err) => {
	logger.error('API Gateway Uncaught Exception:', err);
	process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
	logger.error('API Gateway Unhandled Rejection at:', promise, 'reason:', reason);
	process.exit(1);
});

// Initialize Redis and then start server
async function startServer() {
  try {
    await initRedis();
    app.listen(PORT, '0.0.0.0', () => logger.info(`API Gateway listening on port ${PORT} (0.0.0.0)`));
  } catch (error) {
    logger.error(`Failed to start API Gateway: ${error.message}`);
    process.exit(1);
  }
}

startServer();
