require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = process.env.PORT || 8080;
const app = express();

const maestros = process.env.MAESTROS_URL || 'http://localhost:5001';
const estudiantes = process.env.ESTUDIANTES_URL || 'http://localhost:5002';
const reportesEst = process.env.REPORTES_EST_URL || 'http://localhost:5003';
const reportesMaest = process.env.REPORTES_MAEST_URL || 'http://localhost:5004';
const frontend = process.env.FRONTEND_URL || 'http://localhost:5500';

app.use('/maestros', createProxyMiddleware({ target: maestros, changeOrigin: true, pathRewrite: {'^/maestros': ''} }));
app.use('/estudiantes', createProxyMiddleware({ target: estudiantes, changeOrigin: true, pathRewrite: {'^/estudiantes': ''} }));
app.use('/reportes/estudiantes', createProxyMiddleware({ target: reportesEst, changeOrigin: true, pathRewrite: {'^/reportes/estudiantes': ''} }));
app.use('/reportes/maestros', createProxyMiddleware({ target: reportesMaest, changeOrigin: true, pathRewrite: {'^/reportes/maestros': ''} }));

// serve frontend (if static server running elsewhere, proxy it)
app.use('/', createProxyMiddleware({ target: frontend, changeOrigin: true }));

app.listen(PORT, ()=> console.log(`API Gateway listening on ${PORT}`));
