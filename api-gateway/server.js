const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const sharedConfig = require('../shared-config');

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
  // Intentar cargar config centralizada primero
  config = sharedConfig.getConfig();
  console.log('✅ Configuración centralizada cargada');
  console.log('AUTH_SERVICE:', sharedConfig.getServiceUrl('auth'));
  console.log('ESTUDIANTES_SERVICE:', sharedConfig.getServiceUrl('estudiantes'));
  console.log('MAESTROS_SERVICE:', sharedConfig.getServiceUrl('maestros'));
  
  // Mapear a variables conocidas
  config.AUTH_SERVICE = sharedConfig.getServiceUrl('auth');
  config.ESTUDIANTES_SERVICE = sharedConfig.getServiceUrl('estudiantes');
  config.MAESTROS_SERVICE = sharedConfig.getServiceUrl('maestros');
  config.REPORTES_EST_SERVICE = sharedConfig.getServiceUrl('reportes-est');
  config.REPORTES_MAEST_SERVICE = sharedConfig.getServiceUrl('reportes-maest');
  config.NOTIFICACIONES_SERVICE = sharedConfig.getServiceUrl('notificaciones');
  config.PORT = process.env.PORT || sharedConfig.getPort('gateway') || 8080;
} catch (e) {
  console.warn('⚠️  Error cargando config centralizada:', e.message);
  // Fallback a config local
  try {
    const localConfig = require('./src/config');
    config = localConfig;
    console.log('✅ Config local cargada');
  } catch (e2) {
    console.error('❌ Error cargando config local:', e2.message);
    config = {
      AUTH_SERVICE: process.env.AUTH_SERVICE || 'http://localhost:3000',
      ESTUDIANTES_SERVICE: process.env.ESTUDIANTES_SERVICE || 'http://localhost:3001',
      MAESTROS_SERVICE: process.env.MAESTROS_SERVICE || 'http://localhost:3002',
      REPORTES_EST_SERVICE: process.env.REPORTES_EST_SERVICE || 'http://localhost:5003',
      REPORTES_MAEST_SERVICE: process.env.REPORTES_MAEST_SERVICE || 'http://localhost:5004',
      NOTIFICACIONES_SERVICE: process.env.NOTIFICACIONES_SERVICE || 'http://localhost:5005',
      PORT: process.env.PORT || 8080,
    };
    console.log('⚠️  Usando config por defecto (localhost)');
  }
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
    // If response already finished, this is a normal close; otherwise it's an early abort
    if (res.writableEnded || res.headersSent && res.finished) {
      console.log(`ℹ️  Client connection closed (normal): ${req.method} ${req.url} after ${elapsed}ms`);
    } else {
      console.log(`⚠️  Client connection closed early: ${req.method} ${req.url} after ${elapsed}ms`);
    }
  });

  next();
});

// Para /horarios, usar express.raw() y reenviar el buffer tal cual, sin manipulación extra
// Eliminar manejo manual de raw body para /horarios. Usar solo express.json() global.

// CORS - Allow all origins
app.use(cors({
  origin: 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Responder manualmente a OPTIONS con los headers CORS correctos
app.options('*', cors({
  origin: 'http://localhost:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Use express.json() globally (including /horarios). This avoids complex raw handling and
// matches typical client behavior where Content-Type: application/json is used.
app.use(express.json({ limit: '1mb', type: 'application/json' }));

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
  if (process.env.REPORTES_EST_URL) return process.env.REPORTES_EST_URL;
  if (process.env.REPORTES_EST_SERVICE) return process.env.REPORTES_EST_SERVICE;
  if (infraConfig && infraConfig.PUBLIC && infraConfig.PUBLIC.REPORTES_ESTUDIANTES_URL) return infraConfig.PUBLIC.REPORTES_ESTUDIANTES_URL();
  return 'http://micro-reportes-estudiantes:5003';
};

const getReportesMaestUrl = () => {
  if (process.env.REPORTES_MAEST_URL) return process.env.REPORTES_MAEST_URL;
  if (process.env.REPORTES_MAEST_SERVICE) return process.env.REPORTES_MAEST_SERVICE;
  if (infraConfig && infraConfig.PUBLIC && infraConfig.PUBLIC.REPORTES_MAESTROS_URL) return infraConfig.PUBLIC.REPORTES_MAESTROS_URL();
  return 'http://micro-reportes-maestros:5004';
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



app.use('/horarios', createProxyMiddleware({
  target: maestros,
  changeOrigin: true,
  logLevel: 'info',
  selfHandleResponse: true,
  pathRewrite: { '^/horarios': '/horarios' },
  proxyTimeout: 20000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[onProxyReq /horarios] method=${req.method} url=${req.url} bodyType=${typeof req.body}`);
    try {
      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        let bodyBuffer;
        if (Buffer.isBuffer(req.body)) {
          bodyBuffer = req.body;
        } else if (typeof req.body === 'object') {
          const bodyStr = JSON.stringify(req.body);
          bodyBuffer = Buffer.from(bodyStr, 'utf8');
        }
        if (bodyBuffer && bodyBuffer.length > 0) {
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', bodyBuffer.length);
          proxyReq.write(bodyBuffer);
          // Ensure upstream receives EOF so it can process the request
          try {
            proxyReq.end();
            console.log(`➡️ [horarios] Wrote and ended ${bodyBuffer.length} bytes to proxy request for ${req.method} ${req.url}`);
          } catch (e) {
            console.error('❌ Error ending proxyReq [/horarios]:', e && e.message ? e.message : e);
          }
        } else {
          console.log(`➡️ [horarios] No body to forward for ${req.method} ${req.url}`);
        }
      }
    } catch (e) {
      console.error('❌ Error in onProxyReq [/horarios]:', e && e.message ? e.message : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[onProxyRes /horarios] status=${proxyRes.statusCode} for ${req.method} ${req.url}`);
    let body = '';
    proxyRes.on('data', chunk => { body += chunk.toString(); });
    proxyRes.on('end', () => {
      console.log(`[onProxyRes /horarios] upstream response ended, ${Buffer.byteLength(body)} bytes for ${req.method} ${req.url}`);
      try {
        if (res.headersSent) {
          console.warn('[onProxyRes /horarios] headers already sent, skipping response send');
          return;
        }
        res.status(proxyRes.statusCode).set(proxyRes.headers).send(body);
      } catch (e) {
        console.error('❌ Error sending proxied response [/horarios]:', e && e.message ? e.message : e);
      }
    });
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
  selfHandleResponse: true,
  pathRewrite: { '^/api/horarios': '/horarios' },
  proxyTimeout: 20000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[onProxyReq /api/horarios] method=${req.method} url=${req.url} bodyType=${typeof req.body}`);
    try {
      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        let bodyBuffer;
        if (Buffer.isBuffer(req.body)) {
          bodyBuffer = req.body;
        } else if (typeof req.body === 'object') {
          const bodyStr = JSON.stringify(req.body);
          bodyBuffer = Buffer.from(bodyStr, 'utf8');
        }
        if (bodyBuffer && bodyBuffer.length > 0) {
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', bodyBuffer.length);
            proxyReq.write(bodyBuffer);
            try {
              proxyReq.end();
              console.log(`➡️ [/api/horarios] Wrote and ended ${bodyBuffer.length} bytes to proxy request for ${req.method} ${req.url}`);
            } catch (e) {
              console.error('❌ Error ending proxyReq [/api/horarios]:', e && e.message ? e.message : e);
            }
        } else {
          console.log(`➡️ [/api/horarios] No body to forward for ${req.method} ${req.url}`);
        }
      }
    } catch (e) {
      console.error('❌ Error in onProxyReq [/api/horarios]:', e && e.message ? e.message : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[onProxyRes /api/horarios] status=${proxyRes.statusCode} for ${req.method} ${req.url}`);
    let body = '';
    proxyRes.on('data', chunk => { body += chunk.toString(); });
    proxyRes.on('end', () => {
      console.log(`[onProxyRes /api/horarios] upstream response ended, ${Buffer.byteLength(body)} bytes for ${req.method} ${req.url}`);
      try {
        if (res.headersSent) {
          console.warn('[onProxyRes /api/horarios] headers already sent, skipping response send');
          return;
        }
        res.status(proxyRes.statusCode).set(proxyRes.headers).send(body);
      } catch (e) {
        console.error('❌ Error sending proxied response [/api/horarios]:', e && e.message ? e.message : e);
      }
    });
  },
  onError: (err, req, res) => {
    console.error(`❌ /api/horarios proxy error: ${err.message}`);
    res.status(503).json({ success: false, error: 'Horarios service unavailable' });
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.on('aborted', () => {
      if (!res.headersSent) {
        res.status(504).json({ message: 'Timeout esperando respuesta de micro-maestros' });
      }
    });
    // Note: aborted will be handled above; other lifecycle logging is in the buffering onProxyRes
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
  selfHandleResponse: true,
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
        try {
          proxyReq.end();
          console.log(`   ✍️ Wrote and ended ${Buffer.byteLength(bodyStr)} bytes of JSON body to proxy request`);
        } catch (e) {
          console.error('❌ Error ending proxyReq [estudiantes]:', e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      console.error('❌ Error in onProxyReq [estudiantes]:', e && e.message ? e.message : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[onProxyRes /estudiantes] status=${proxyRes.statusCode} for ${req.method} ${req.url}`);
    let body = '';
    proxyRes.on('data', chunk => { body += chunk.toString(); });
    proxyRes.on('end', () => {
      console.log(`[onProxyRes /estudiantes] upstream response ended, ${Buffer.byteLength(body)} bytes for ${req.method} ${req.url}`);
      try {
        if (res.headersSent) {
          console.warn('[onProxyRes /estudiantes] headers already sent, skipping response send');
          return;
        }
        res.status(proxyRes.statusCode).set(proxyRes.headers).send(body);
      } catch (e) {
        console.error('❌ Error sending proxied response [/estudiantes]:', e && e.message ? e.message : e);
      }
    });
    proxyRes.on('aborted', () => {
      if (!res.headersSent) {
        res.status(504).json({ message: 'Timeout esperando respuesta de micro-estudiantes' });
      }
    });
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
  selfHandleResponse: true,
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
        try {
          proxyReq.end();
          console.log(`   ✍️ Wrote and ended ${Buffer.byteLength(bodyStr)} bytes of JSON body to proxy request`);
        } catch (e) {
          console.error('❌ Error ending proxyReq [/api/estudiantes]:', e && e.message ? e.message : e);
        }
      }
    } catch (e) {
      console.error('❌ Error in onProxyReq [/api/estudiantes]:', e && e.message ? e.message : e);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[onProxyRes /api/estudiantes] status=${proxyRes.statusCode} for ${req.method} ${req.url}`);
    let body = '';
    proxyRes.on('data', chunk => { body += chunk.toString(); });
    proxyRes.on('end', () => {
      console.log(`[onProxyRes /api/estudiantes] upstream response ended, ${Buffer.byteLength(body)} bytes for ${req.method} ${req.url}`);
      try {
        if (res.headersSent) {
          console.warn('[onProxyRes /api/estudiantes] headers already sent, skipping response send');
          return;
        }
        res.status(proxyRes.statusCode).set(proxyRes.headers).send(body);
      } catch (e) {
        console.error('❌ Error sending proxied response [/api/estudiantes]:', e && e.message ? e.message : e);
      }
    });
    proxyRes.on('aborted', () => {
      if (!res.headersSent) {
        res.status(504).json({ message: 'Timeout esperando respuesta de micro-estudiantes' });
      }
    });
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
  selfHandleResponse: true,
  // No pathRewrite: preserve full path so /reportes/estudiantes/reporte/:id is forwarded as-is
  onError: (err, req, res) => {
    console.error(`❌ Reportes proxy error: ${err.message}`);
    if (!res.headersSent) {
      res.status(503).json({ success: false, error: 'Reportes service unavailable' });
    } else {
      console.warn('[Reportes proxy onError] headers already sent, skipping error response');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[onProxyRes /reportes] status=${proxyRes.statusCode} for ${req.method} ${req.url}`);
    let body = '';
    proxyRes.on('data', chunk => { body += chunk.toString(); });
    proxyRes.on('end', () => {
      console.log(`[onProxyRes /reportes] upstream response ended, ${Buffer.byteLength(body)} bytes for ${req.method} ${req.url}`);
      try {
        if (res.headersSent) {
          console.warn('[onProxyRes /reportes] headers already sent, skipping response send');
          return;
        }
        if (proxyRes.statusCode === 404) {
          res.status(404).set(proxyRes.headers).send(body);
        } else {
          res.status(proxyRes.statusCode).set(proxyRes.headers).send(body);
        }
      } catch (e) {
        console.error('❌ Error sending proxied response [/reportes]:', e && e.message ? e.message : e);
      }
    });
    proxyRes.on('aborted', () => {
      if (!res.headersSent) {
        res.status(504).json({ message: 'Timeout esperando respuesta de reportes' });
      }
    });
  }
}));

// API Reportes routes proxy (for /api/reportes/estudiantes/... paths)
app.use('/api/reportes', createProxyMiddleware({
  target: reportesEst,
  changeOrigin: true,
  logLevel: 'info',
  selfHandleResponse: true,
  pathRewrite: { '^/api/reportes': '/api/reportes' },
  onError: (err, req, res) => {
    console.error(`❌ API Reportes proxy error: ${err.message}`);
    if (!res.headersSent) {
      res.status(503).json({ success: false, error: 'Reportes service unavailable' });
    } else {
      console.warn('[API Reportes proxy onError] headers already sent, skipping error response');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[onProxyRes /api/reportes] status=${proxyRes.statusCode} for ${req.method} ${req.url}`);
    let body = '';
    proxyRes.on('data', chunk => { body += chunk.toString(); });
    proxyRes.on('end', () => {
      console.log(`[onProxyRes /api/reportes] upstream response ended, ${Buffer.byteLength(body)} bytes for ${req.method} ${req.url}`);
      try {
        if (res.headersSent) {
          console.warn('[onProxyRes /api/reportes] headers already sent, skipping response send');
          return;
        }
        res.status(proxyRes.statusCode).set(proxyRes.headers).send(body);
      } catch (e) {
        console.error('❌ Error sending proxied response [/api/reportes]:', e && e.message ? e.message : e);
      }
    });
    proxyRes.on('aborted', () => {
      if (!res.headersSent) {
        res.status(504).json({ message: 'Timeout esperando respuesta de reportes' });
      }
    });
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
