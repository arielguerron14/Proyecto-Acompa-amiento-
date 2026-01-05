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

// For /horarios we MUST treat the body as raw bytes and forward exactly as received.
// Use express.raw() on that path so we don't attempt JSON parsing here.
const rawBodyForHorarios = express.raw({ type: '*/*', limit: '1mb' });
app.use('/horarios', rawBodyForHorarios, (req, res, next) => {
  try {
    // req.body will be a Buffer when express.raw() is used
    req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
    if (req.rawBody && req.rawBody.length > 0) {
      const sample = req.rawBody.length > 200 ? req.rawBody.slice(0, 200) + '... (truncated)' : req.rawBody;
      console.log(`🔎 Captured raw body for ${req.method} ${req.url}:`, sample);
      // Detect double-encoded JSON string ("{...}") and unwrap it for forwarding
      if (req.rawBody.startsWith('"') || req.rawBody.startsWith("'")) {
        try {
          const unwrapped = JSON.parse(req.rawBody);
          if (typeof unwrapped === 'string') {
            console.log('ℹ️ Detected double-encoded JSON string; unwrapping before forwarding');
            req.rawBody = unwrapped;
          }
        } catch (e) {
          // ignore parse errors here; we'll forward as-is and let downstream handle it
        }
      }
    }
  } catch (e) {
    req.rawBody = '';
  }
  next();
});

// CORS - Allow all origins
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// NOTE: Do not apply JSON body parser globally because some proxied routes
// (e.g., /horarios) should be forwarded raw and may trigger parse errors
// that prevent the proxy from forwarding the request. We only parse JSON
// for internal routes (like /auth) that the gateway handles directly.

// Health check endpoint (doesn't depend on microservices)
app.get('/health', (req, res) => {
  console.log('✅ Health check');
  res.json({ status: 'OK', message: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Service URLs from environment or defaults
const auth = process.env.AUTH_SERVICE || 'http://13.223.196.229:3000';
const maestros = process.env.MAESTROS_SERVICE || 'http://13.223.196.229:3002';
const estudiantes = process.env.ESTUDIANTES_SERVICE || 'http://13.223.196.229:3001';
const reportesEst = process.env.REPORTES_EST_SERVICE || 'http://100.28.217.159:5003';
const reportesMaest = process.env.REPORTES_MAEST_SERVICE || 'http://100.28.217.159:5004';

console.log('🔗 Configured Services:');
console.log(`  Auth: ${auth}`);
console.log(`  Maestros: ${maestros}`);
console.log(`  Estudiantes: ${estudiantes}`);
console.log(`  Reportes Est: ${reportesEst}`);
console.log(`  Reportes Maest: ${reportesMaest}`);

// Auth routes: mount internal router which forwards requests with axios and explicit timeouts
// This avoids problematic proxy behavior for streaming/bodies and gives better logging
try {
  const authRoutes = require('./src/routes/authRoutes');
  console.log('✅ authRoutes module loaded successfully');
  // Parse JSON only for auth internal routes; capture raw body for debugging
  const authJson = express.json({
    verify: (req, res, buf, encoding) => {
      try { req.rawBody = buf && buf.length ? buf.toString(encoding || 'utf8') : ''; } catch (e) { req.rawBody = ''; }
    }
  });
  app.use('/auth', authJson, authRoutes);
  console.log('✅ Auth routes mounted via internal forwarder (with JSON parser)');
  console.log('📍 Available auth endpoints: /auth/register, /auth/login, /auth/logout, /auth/verify-token, /auth/me');
} catch (err) {
  console.error('❌ Failed to mount auth routes, falling back to proxy:', err.message);
  console.error('❌ Error details:', err.stack);
  // Fallback proxy
  app.use('/auth', createProxyMiddleware({
    target: auth,
    changeOrigin: true,
    logLevel: 'info',
    proxyTimeout: 20000,
    onError: (err2, req, res) => {
      console.error(`❌ Auth proxy error: ${err2.message}`);
      res.status(503).json({ success: false, error: 'Auth service unavailable' });
    }
  }));
}

// Horarios routes proxy (to maestros service)
// Capture raw body for /horarios so we can log it and forward exactly as received.
// We buffer the raw body here and then write it into the proxy request in onProxyReq.
app.use('/horarios', (req, res, next) => {
  let data = '';
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => { req.rawBody = data; next(); });
  req.on('error', () => { req.rawBody = ''; next(); });
});

app.use('/horarios', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/horarios': '/horarios' },
  onProxyReq: (proxyReq, req, res) => {
    // Write the previously captured raw body into the proxy request so the
    // maestros service receives the exact bytes sent by the client.
    if (typeof req.rawBody === 'string' && req.rawBody.length > 0) {
      console.log('➡️ Forwarding /horarios raw body (len=' + req.rawBody.length + ')');
      try {
        proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
        proxyReq.write(req.rawBody);
      } catch (e) {
        console.error('❌ Failed to write raw body to proxy request:', e.message);
      }
    }
  },
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

// Reportes routes proxy (legacy path)
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

// API Reportes routes proxy (for /api/reportes/estudiantes/... paths)
app.use('/api/reportes', createProxyMiddleware({
  target: reportesEst,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/api/reportes': '/api/reportes' },
  onError: (err, req, res) => {
    console.error(`❌ API Reportes proxy error: ${err.message}`);
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
  console.log(`🔗 Registered routes should include: /health, /test, /auth/*, /maestros/*, /estudiantes/*, /horarios/*`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    hint: 'Did you mean /auth/register, /auth/login, /maestros/*, /estudiantes/*, or /horarios/*?'
  });
});

// Error handler
app.use((err, req, res, next) => {
  // Log JSON parse body when available
  if (err && err.type === 'entity.parse.failed') {
    console.error('❌ JSON parse error body (req.rawBody):', req.rawBody);
    if (err.body) console.error('❌ JSON parse error body (err.body):', err.body);
  }
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
