const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

console.log('🚀 Starting API Gateway server...');

const app = express();

// Log all requests FIRST
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});

// APLICAR SEGURIDAD Y CORS PRIMERO (antes que cualquier ruta)
const maestros = 'http://micro-maestros:5001';
const estudiantes = 'http://micro-estudiantes:5002';
const reportesEst = 'http://micro-reportes-estudiantes:5003';
const reportesMaest = 'http://micro-reportes-maestros:5004';
const frontend = process.env.FRONTEND_URL || 'http://frontend-web:5500';

// Proxy middleware for microservices

// Handle preflight requests for horarios
app.options('/api/horarios', cors());

// Handle preflight requests for estudiantes
app.options('/estudiantes', cors());
app.options('/estudiantes/*', cors());

// Proxy to micro-maestros for horarios
app.use('/api/horarios', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  secure: false,
  ws: false,
  logLevel: 'debug',
  pathRewrite: { '^/api/horarios': '/horarios' },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to /api/horarios:', req.method, req.url);
    // Forward Authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
      console.log('Forwarding Authorization header');
    }
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
      console.log('Forwarding body:', bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response for /api/horarios:', proxyRes.statusCode, req.method, req.url);
  },
  onError: (err, req, res) => {
    console.log('Proxy error for /api/horarios:', err.message, req.method, req.url);
  }
}));

// Handle preflight requests for horarios
app.options('/horarios', cors());

// Handle preflight requests for auth endpoints
app.options('/auth', cors());
app.options('/auth/*', cors());

// Proxy to micro-maestros for horarios (alternative path)
app.use('/horarios', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  secure: false,
  ws: false,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to /horarios:', req.method, req.url);
    // Forward Authorization header
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
      console.log('Forwarding Authorization header');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Proxy response for /horarios:', proxyRes.statusCode, req.method, req.url);
  },
  onError: (err, req, res) => {
    console.log('Proxy error for /horarios:', err.message, req.method, req.url);
  }
}));

// applySecurity(app, { whitelist: [frontend] });

// app.use(requestLogger);

// Rutas de autenticación (públicas)
app.use('/auth', authRoutes);

app.use('/maestros', createProxyMiddleware({ target: maestros, changeOrigin: true, pathRewrite: {'^/maestros': ''} }));
app.use('/estudiantes', (req, res, next) => {
  // Skip proxy for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  // Use proxy for other requests
  createProxyMiddleware({
    target: estudiantes,
    changeOrigin: true,
    secure: false,
    ws: false,
    logLevel: 'debug',
    pathRewrite: {'^/estudiantes': ''},
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request to /estudiantes:', req.method, req.url);
      console.log('req.body:', JSON.stringify(req.body));
      console.log('req.body keys length:', req.body ? Object.keys(req.body).length : 'undefined');
      // Forward Authorization header
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
        console.log('Forwarding Authorization header');
      }
      // Forward the request body for POST/PUT/PATCH requests
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        console.log('Forwarding body data');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Proxy response for /estudiantes:', proxyRes.statusCode, req.method, req.url);
    },
    onError: (err, req, res) => {
      console.log('Proxy error for /estudiantes:', err.message, req.method, req.url);
    }
  })(req, res, next);
});
app.use('/reportes/estudiantes', createProxyMiddleware({ target: reportesEst, changeOrigin: true, pathRewrite: {'^/reportes/estudiantes': ''} }));
app.use('/reportes/maestros', createProxyMiddleware({ target: reportesMaest, changeOrigin: true, pathRewrite: {'^/reportes/maestros': ''} }));

// proxy frontend by default (but only for specific paths, not /)
// Commented out to avoid conflicts with auth routes
// app.use('/', createProxyMiddleware({ target: frontend, changeOrigin: true }));

// Gestión de Horarios de Atención
let horariosAtencion = [
  {
    id: '1',
    maestroId: 'maestro1',
    maestroName: 'Prof. García',
    carrera: 'Ingeniería',
    semestre: 1,
    materiaCodigo: 'MAT101',
    materiaNombre: 'Matemáticas Básicas',
    dia: 'Lunes',
    horaInicio: '08:00',
    horaFin: '10:00',
    duracionMinutos: 120,
    modalidad: 'Presencial',
    lugarAtencion: 'Sala 101',
    cupoMaximo: 20,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro1'
  },
  {
    id: '2',
    maestroId: 'maestro2',
    maestroName: 'Prof. López',
    carrera: 'Ingeniería',
    semestre: 2,
    materiaCodigo: 'FIS201',
    materiaNombre: 'Física General',
    dia: 'Martes',
    horaInicio: '10:00',
    horaFin: '12:00',
    duracionMinutos: 120,
    modalidad: 'Virtual',
    lugarAtencion: 'Zoom Room 1',
    cupoMaximo: 15,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro2'
  },
  {
    id: '3',
    maestroId: 'maestro1',
    maestroName: 'Prof. García',
    carrera: 'Ingeniería',
    semestre: 1,
    materiaCodigo: 'QUI102',
    materiaNombre: 'Química General',
    dia: 'Miércoles',
    horaInicio: '14:00',
    horaFin: '16:00',
    duracionMinutos: 120,
    modalidad: 'Presencial',
    lugarAtencion: 'Laboratorio 1',
    cupoMaximo: 10,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro1'
  },
  {
    id: '4',
    maestroId: 'maestro3',
    maestroName: 'Prof. Martínez',
    carrera: 'Ingeniería',
    semestre: 3,
    materiaCodigo: 'PRO301',
    materiaNombre: 'Programación Avanzada',
    dia: 'Jueves',
    horaInicio: '16:00',
    horaFin: '18:00',
    duracionMinutos: 120,
    modalidad: 'Híbrida',
    lugarAtencion: 'Sala 203',
    cupoMaximo: 12,
    estado: 'Activo',
    observaciones: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'maestro3'
  }
]; // Array en memoria para simplicidad

// Serve simple health endpoint instead of proxying everything
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Gateway is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 3000;
console.log(`🌐 Starting server on port ${PORT}...`);

app.listen(PORT, () => {
  console.log(`🎉 API Gateway listening on port ${PORT}`);
});
