const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Global error handler for unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION:', reason);
  process.exit(1);
});

// Load .env file if it exists
try {
  require('dotenv').config();
} catch (e) {
  console.log('⚠️  dotenv not available or .env file missing, using environment variables only');
}

console.log('🚀 Starting API Gateway server...');
console.log('Attempting to load configuration...');

let config = {};
try {
  config = require('./src/config');
  console.log('✅ Config loaded successfully');
  console.log('AUTH_SERVICE:', config.AUTH_SERVICE);
  console.log('ESTUDIANTES_SERVICE:', config.ESTUDIANTES_SERVICE);
  console.log('MAESTROS_SERVICE:', config.MAESTROS_SERVICE);
} catch (e) {
  console.error('❌ Failed to load config:', e.message);
  console.error('Stack:', e.stack);
  // Use sensible defaults
  config = {
    AUTH_SERVICE: process.env.AUTH_SERVICE || 'http://localhost:3000',
    ESTUDIANTES_SERVICE: process.env.ESTUDIANTES_SERVICE || 'http://localhost:3001',
    MAESTROS_SERVICE: process.env.MAESTROS_SERVICE || 'http://localhost:3002',
    PORT: process.env.PORT || 8080,
  };
  console.log('⚠️  Using fallback config:', JSON.stringify(config, null, 2));
}

const app = express();

// Basic request logger + timing and client connection events
app.use((req, res, next) => {
  req._startTime = Date.now();
  console.log(`📨 ${req.method} ${req.url}`);

  // Log when response finishes normally
  res.on('finish', () => {
    const elapsed = Date.now() - req._startTime;
    console.log(`✅ Response finished: ${req.method} ${req.url} -> ${res.statusCode} (${elapsed}ms)`);
  });

  // Log if the client connection closes before response finished
  res.on('close', () => {
    const elapsed = Date.now() - req._startTime;
    console.log(`⚠️  Client connection closed early: ${req.method} ${req.url} after ${elapsed}ms`);
  });

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

// NOTE: Apply JSON body parser globally so all routes get parsed bodies,
// EXCEPT we skip /horarios which needs raw body handling.
// The rawBodyForHorarios middleware at the top handles /horarios separately.
app.use(express.json());

// Health check endpoint (doesn't depend on microservices)
app.get('/health', (req, res) => {
  console.log('✅ Health check');
  res.json({ status: 'OK', message: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Use config already loaded
const AUTH_SERVICE = config.AUTH_SERVICE;
const MAESTROS_SERVICE = config.MAESTROS_SERVICE;
const ESTUDIANTES_SERVICE = config.ESTUDIANTES_SERVICE;

// Load infrastructure config for reportes services
let infraConfig;
try {
  infraConfig = require('./infrastructure.config.js');
} catch (err) {
  infraConfig = null;
}

const getReportesEstUrl = () => {
  if (process.env.REPORTES_EST_SERVICE) return process.env.REPORTES_EST_SERVICE;
  if (infraConfig && infraConfig.PUBLIC.REPORTES_ESTUDIANTES_URL) return infraConfig.PUBLIC.REPORTES_ESTUDIANTES_URL();
  return 'http://100.28.217.159:5003';
};

const getReportesMaestUrl = () => {
  if (process.env.REPORTES_MAEST_SERVICE) return process.env.REPORTES_MAEST_SERVICE;
  if (infraConfig && infraConfig.PUBLIC.REPORTES_MAESTROS_URL) return infraConfig.PUBLIC.REPORTES_MAESTROS_URL();
  return 'http://100.28.217.159:5004';
};

const auth = AUTH_SERVICE;
const maestros = MAESTROS_SERVICE;
const estudiantes = ESTUDIANTES_SERVICE;
const reportesEst = getReportesEstUrl();
const reportesMaest = getReportesMaestUrl();

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
  app.use('/api/auth', authJson, authRoutes);  // Also support /api/auth prefix
  console.log('✅ Auth routes mounted via internal forwarder (with JSON parser)');
  console.log('📍 Available auth endpoints: /auth/register, /auth/login, /auth/logout, /auth/verify-token, /auth/me');
  console.log('📍 Also available with /api prefix: /api/auth/register, /api/auth/login, etc.');
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
  // Also add /api/auth proxy fallback
  app.use('/api/auth', createProxyMiddleware({
    target: auth,
    changeOrigin: true,
    logLevel: 'info',
    proxyTimeout: 20000,
    onError: (err2, req, res) => {
      console.error(`❌ Auth proxy error: ${err2.message}`);
      res.status(503).json({ success: false, error: 'Auth service unavailable' });
    }
  }));

  // Debug endpoint for MongoDB status
  app.use('/debug/mongo-status', createProxyMiddleware({
    target: auth,
    changeOrigin: true,
    logLevel: 'info'
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

// Also support /api/horarios for clients that use the /api prefix
app.use('/api/horarios', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  logLevel: 'info',
  pathRewrite: { '^/api/horarios': '/horarios' },
  onProxyReq: (proxyReq, req, res) => {
    if (typeof req.rawBody === 'string' && req.rawBody.length > 0) {
      console.log('➡️ Forwarding /api/horarios raw body (len=' + req.rawBody.length + ')');
      try {
        proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
        proxyReq.write(req.rawBody);
      } catch (e) {
        console.error('❌ Failed to write raw body to /api/horarios proxy request:', e.message);
      }
    }
  },
  onError: (err, req, res) => {
    console.error(`❌ /api/horarios proxy error: ${err.message}`);
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

// Estudiantes routes proxy (instrumented for request/response lifecycle)
app.use('/estudiantes', createProxyMiddleware({
  target: estudiantes,
  changeOrigin: true,
  logLevel: 'debug',
  proxyTimeout: 30000,
  timeout: 30000,
  pathRewrite: { '^/estudiantes': '' },
  onProxyReq: (proxyReq, req, res) => {
    try {
      req._proxyStart = Date.now();
      console.log(`➡️ [estudiantes] Proxying request to ${proxyReq.getHeader('host')}${proxyReq.path} ${req.method}`);
      if (req.body && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyStr = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
        proxyReq.write(bodyStr);
        console.log(`   ✍️ Wrote ${Buffer.byteLength(bodyStr)} bytes of JSON body to proxy request`);
      }
    } catch (e) {
      console.error('❌ Error in onProxyReq [estudiantes]:', e && e.message ? e.message : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    try {
      console.log(`⬅️ [estudiantes] Backend responded: ${proxyRes.statusCode}`);
      let bytes = 0;
      proxyRes.on('data', chunk => { bytes += chunk.length; });
      proxyRes.on('end', () => {
        const took = Date.now() - (req._proxyStart || req._startTime);
        console.log(`🔁 [estudiantes] Completed proxy response: ${proxyRes.statusCode} (${bytes} bytes) in ${took}ms`);
      });
    } catch (e) {
      console.error('❌ Error in onProxyRes [estudiantes]:', e && e.message ? e.message : e);
    }
  },
  onError: (err, req, res) => {
    console.error(`❌ Estudiantes proxy error: ${err && err.message ? err.message : err}`);
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: 'Estudiantes service unavailable (proxy error)' });
    } else {
      console.error('❌ Headers already sent when proxy error occurred');
    }
  }
}));

// API Estudiantes routes proxy (for /api/estudiantes/... paths)
app.use('/api/estudiantes', createProxyMiddleware({
  target: estudiantes,
  changeOrigin: true,
  logLevel: 'debug',
  proxyTimeout: 30000,
  timeout: 30000,
  pathRewrite: { '^/api/estudiantes': '' },
  onProxyReq: (proxyReq, req, res) => {
    try {
      req._proxyStart = Date.now();
      console.log(`➡️ [/api/estudiantes] Proxying request to ${proxyReq.getHeader('host')}${proxyReq.path} ${req.method}`);
      if (req.body && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyStr = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
        proxyReq.write(bodyStr);
        console.log(`   ✍️ Wrote ${Buffer.byteLength(bodyStr)} bytes of JSON body to proxy request`);
      }
    } catch (e) {
      console.error('❌ Error in onProxyReq [/api/estudiantes]:', e && e.message ? e.message : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    try {
      console.log(`⬅️ [/api/estudiantes] Backend responded: ${proxyRes.statusCode}`);
      let bytes = 0;
      proxyRes.on('data', chunk => { bytes += chunk.length; });
      proxyRes.on('end', () => {
        const took = Date.now() - (req._proxyStart || req._startTime);
        console.log(`🔁 [/api/estudiantes] Completed proxy response: ${proxyRes.statusCode} (${bytes} bytes) in ${took}ms`);
      });
    } catch (e) {
      console.error('❌ Error in onProxyRes [/api/estudiantes]:', e && e.message ? e.message : e);
    }
  },
  onError: (err, req, res) => {
    console.error(`❌ API Estudiantes proxy error: ${err && err.message ? err.message : err}`);
    if (!res.headersSent) {
      res.status(504).json({ success: false, error: 'Estudiantes service unavailable (proxy error)' });
    } else {
      console.error('❌ Headers already sent when proxy error occurred');
    }
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
  console.log(`🔗 Registered routes should include: /health, /test, /auth/*, /maestros/*, /estudiantes/*, /horarios/*, /api/horarios`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    hint: 'Did you mean /auth/register, /auth/login, /maestros/*, /estudiantes/*, /horarios/* or /api/horarios?'
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
