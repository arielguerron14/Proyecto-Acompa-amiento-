const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

console.log('🚀 Starting API Gateway server...');

const app = express();

// Log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// CORS - Allow all origins
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint (doesn't depend on microservices)
app.get('/health', (req, res) => {
  console.log('✅ Health check');
  res.json({ status: 'OK', message: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Service URLs from environment or defaults
const auth = process.env.AUTH_SERVICE || 'http://micro-auth:5005';
const maestros = process.env.MAESTROS_SERVICE || 'http://micro-maestros:5001';
const estudiantes = process.env.ESTUDIANTES_SERVICE || 'http://micro-estudiantes:5002';
const reportesEst = process.env.REPORTES_EST_SERVICE || 'http://micro-reportes-estudiantes:5003';
const reportesMaest = process.env.REPORTES_MAEST_SERVICE || 'http://micro-reportes-maestros:5004';

console.log('🔗 Configured Services:');
console.log(`  Auth: ${auth}`);
console.log(`  Maestros: ${maestros}`);
console.log(`  Estudiantes: ${estudiantes}`);
console.log(`  Reportes Est: ${reportesEst}`);
console.log(`  Reportes Maest: ${reportesMaest}`);

// Auth routes proxy
app.use('/auth', createProxyMiddleware({
  target: auth,
  changeOrigin: true,
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error(`❌ Auth proxy error: ${err.message}`);
    res.status(503).json({ success: false, error: 'Auth service unavailable' });
  }
}));

// Horarios routes proxy (to maestros service)
app.use('/horarios', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/horarios': '/horarios' },
  onError: (err, req, res) => {
    console.error(`❌ Horarios proxy error: ${err.message}`);
    res.status(503).json({ success: false, error: 'Horarios service unavailable' });
  }
}));

// Maestros routes proxy
app.use('/maestros', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/maestros': '' },
  onError: (err, req, res) => {
    console.error(`❌ Maestros proxy error: ${err.message}`);
    res.status(503).json({ success: false, error: 'Maestros service unavailable' });
  }
}));

// Estudiantes routes proxy
app.use('/estudiantes', createProxyMiddleware({
  target: estudiantes,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/estudiantes': '' },
  onError: (err, req, res) => {
    console.error(`❌ Estudiantes proxy error: ${err.message}`);
    res.status(503).json({ success: false, error: 'Estudiantes service unavailable' });
  }
}));

// Reportes routes proxy
app.use('/reportes', createProxyMiddleware({
  target: reportesEst,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/reportes': '' },
  onError: (err, req, res) => {
    console.error(`❌ Reportes proxy error: ${err.message}`);
    res.status(503).json({ success: false, error: 'Reportes service unavailable' });
  }
}));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'API Gateway is working', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  Not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 8080;
console.log(`🌐 Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 API Gateway listening on port ${PORT}`);
  console.log(`✅ Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📋 SIGTERM received, closing gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📋 SIGINT received, closing gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
