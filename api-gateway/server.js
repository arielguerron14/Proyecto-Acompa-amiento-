require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { applySecurity } = require('./src/middlewares/security');
const { requestLogger, logger } = require('./src/middlewares/logger');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const { setupSwagger } = require('./src/swagger');
const authRoutes = require('./src/routes/authRoutes');

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(requestLogger);

// Rutas de autenticación (públicas)
app.use('/auth', authRoutes);

const maestros = process.env.MAESTROS_URL || 'http://micro-maestros:5001';
const estudiantes = process.env.ESTUDIANTES_URL || 'http://micro-estudiantes:5002';
const reportesEst = process.env.REPORTES_EST_URL || 'http://micro-reportes-estudiantes:5003';
const reportesMaest = process.env.REPORTES_MAEST_URL || 'http://micro-reportes-maestros:5004';
const frontend = process.env.FRONTEND_URL || 'http://frontend-web:5500';

applySecurity(app, { whitelist: [frontend] });

app.use('/maestros', createProxyMiddleware({ target: maestros, changeOrigin: true, pathRewrite: {'^/maestros': ''} }));
app.use('/estudiantes', createProxyMiddleware({ target: estudiantes, changeOrigin: true, pathRewrite: {'^/estudiantes': ''} }));
app.use('/reportes/estudiantes', createProxyMiddleware({ target: reportesEst, changeOrigin: true, pathRewrite: {'^/reportes/estudiantes': ''} }));
app.use('/reportes/maestros', createProxyMiddleware({ target: reportesMaest, changeOrigin: true, pathRewrite: {'^/reportes/maestros': ''} }));

// proxy frontend by default
app.use('/', createProxyMiddleware({ target: frontend, changeOrigin: true }));

// Swagger UI
setupSwagger(app);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, ()=> logger.info(`API Gateway listening on ${PORT}`));
