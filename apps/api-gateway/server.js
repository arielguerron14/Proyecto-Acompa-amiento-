const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const serviceRegistry = require('./config/service-registry');
const { proxyMiddleware, configEndpoint, servicesEndpoint, healthEndpoint } = require('./middleware/proxy');

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

console.log('🚀 Starting API Gateway server with Service Registry...');

// Initialize Service Registry with environment variables
// Accept CORE_HOST as raw IP or full URL
let CORE_HOST = process.env.CORE_HOST || process.env.EC2_CORE_IP;
if (CORE_HOST && !CORE_HOST.startsWith('http')) {
  CORE_HOST = `http://${CORE_HOST}`;
}
CORE_HOST = CORE_HOST || 'http://localhost';

const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 8080;

console.log('📋 Service Registry Configuration:');
console.log(`  CORE_HOST: ${CORE_HOST}`);
console.log(`  PORT: ${PORT}`);
console.log(`  All services will be routed through: ${CORE_HOST}`);
console.log(`  🔑 KEY: Change CORE_HOST once and all routes automatically update`);

const app = express();

// Global static directory (optional UI)
// Auto-detect a usable static directory:
// 1) Respect STATIC_DIR env if it exists
// 2) Fallback to /var/www/html
// 3) Fallback to sibling frontend repo path: ../frontend-web/public
let STATIC_DIR = process.env.STATIC_DIR || '/var/www/html';
try {
  const candidates = [
    STATIC_DIR,
    '/var/www/html',
    path.resolve(__dirname, '..', 'frontend-web', 'public')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      STATIC_DIR = candidate;
      break;
    }
  }
} catch (_) {}

// Build CORS origins dynamically
let corsOrigins = [
  'http://localhost:5500',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
  'http://3.231.12.130:5500',  // Current EC2-Frontend IP
];

// Add origins from environment variables
const envOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '';
if (envOrigins) {
  corsOrigins.push(...envOrigins.split(',').map(o => o.trim()).filter(o => o));
}

// Add Frontend public IP if provided explicitly via env (from deploy workflow)
const frontendPublicIp = process.env.FRONTEND_PUBLIC_IP || '';
if (frontendPublicIp) {
  corsOrigins.push(`http://${frontendPublicIp}:5500`);
  corsOrigins.push(`https://${frontendPublicIp}:5500`);
}

// Add Frontend IP from config/instance_ips.json
try {
  const configPath = path.join(__dirname, '..', 'config', 'instance_ips.json');
  if (fs.existsSync(configPath)) {
    const instances = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (instances['EC2-Frontend']) {
      const frontendIp = instances['EC2-Frontend'].PublicIpAddress;
      corsOrigins.push(`http://${frontendIp}:5500`);
      corsOrigins.push(`https://${frontendIp}:5500`);
    }
  }
} catch (e) {
  console.warn('⚠️  Could not load Frontend IP from config:', e.message);
}

// Remove duplicates
corsOrigins = [...new Set(corsOrigins)];

console.log(`\n📌 CORS Origins allowed (${corsOrigins.length}):`);
corsOrigins.forEach(origin => console.log(`   • ${origin}`));

// Allow listed origins, and additionally allow http/https with IP:5500 seen at runtime
const isIp5500 = (origin = '') => /^(https?:\/\/)\d+\.\d+\.\d+\.\d+:5500$/.test(origin.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow same-origin/no origin
    if (corsOrigins.includes(origin) || isIp5500(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json({ limit: '1mb', type: 'application/json' }));

// ----------------------------------------------------------------------------
// Static UI serving (Optional): Serve frontend assets from /var/www/html at /app
// ----------------------------------------------------------------------------
try {
  if (fs.existsSync(STATIC_DIR)) {
    console.log(`🗂️  Serving static UI from ${STATIC_DIR} at /app`);
    // Explicit index handler for /app (no trailing slash)
    app.get('/app', (req, res) => {
      const indexPath = path.join(STATIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: 'index.html not found in static directory' });
      }
    });
    // Static assets for /app/* paths
    app.use('/app', express.static(STATIC_DIR));
    // SPA fallback: /app/* -> index.html
    app.get('/app/*', (req, res) => {
      const indexPath = path.join(STATIC_DIR, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ error: 'index.html not found in static directory' });
      }
    });

    // Also serve static assets at root paths so index.html relative links work
    app.use('/css', express.static(path.join(STATIC_DIR, 'css')));
    app.use('/js', express.static(path.join(STATIC_DIR, 'js')));
    app.use('/images', express.static(path.join(STATIC_DIR, 'images')));
    app.use('/assets', express.static(path.join(STATIC_DIR, 'assets')));

    // Also serve root-level static files (e.g., /estudiante.html)
    // This will only serve if the file exists; otherwise it falls through
    app.use(express.static(STATIC_DIR));
  } else {
    console.log(`ℹ️  Static dir not found (${STATIC_DIR}); skipping /app static serving`);
  }
} catch (e) {
  console.warn('⚠️  Static UI setup failed:', e.message);
}

// Basic request logger
app.use((req, res, next) => {
  req._startTime = Date.now();
  console.log(`📨 ${req.method} ${req.url}`);

  res.on('finish', () => {
    const elapsed = Date.now() - req._startTime;
    console.log(`✅ Response finished: ${req.method} ${req.url} -> ${res.statusCode} (${elapsed}ms)`);
  });

  res.on('close', () => {
    const elapsed = Date.now() - req._startTime;
    if (res.writableEnded || res.headersSent && res.finished) {
      console.log(`ℹ️  Client connection closed (normal): ${req.method} ${req.url} after ${elapsed}ms`);
    } else {
      console.log(`⚠️  Client connection closed early: ${req.method} ${req.url} after ${elapsed}ms`);
    }
  });

  next();
});

// ============================================================================
// DEDICATED HEALTH & CONFIG ENDPOINTS
// ============================================================================

// Root endpoint - simple response for ALB health checks
app.get('/', (req, res) => {
  // If static UI is available, serve index.html at root
  try {
    const indexPath = path.join(STATIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  } catch (_) {}
  // Fallback JSON root
  res.status(200).json({ 
    message: 'API Gateway v1.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (doesn't depend on microservices)
app.get('/health', (req, res) => {
  console.log('✅ Health check');
  res.json({ 
    status: 'OK', 
    message: 'API Gateway is running', 
    timestamp: new Date().toISOString(),
    coreHost: CORE_HOST
  });
});

// Configuration endpoint - returns all service configuration
app.get('/config', configEndpoint);

// Services endpoint - lists available services
app.get('/services', servicesEndpoint);

// Extended health endpoint with service status
app.get('/health/extended', healthEndpoint);

// ============================================================================
// DYNAMIC PROXY ROUTING - SINGLE POINT OF ENTRY FOR ALL REQUESTS
// ============================================================================

console.log('🔗 Routing Configuration (all routes via Service Registry):');
console.log(`  Auth service (port 3000) -> ${CORE_HOST}:3000`);
console.log(`  Estudiantes service (port 3001) -> ${CORE_HOST}:3001`);
console.log(`  Maestros service (port 3002) -> ${CORE_HOST}:3002`);
console.log(`  Reportes Est service (port 5003) -> ${CORE_HOST}:5003`);
console.log(`  Reportes Maest service (port 5004) -> ${CORE_HOST}:5004`);

// Catch-all proxy middleware for /auth, /estudiantes, /maestros, /reportes, /horarios
app.use('/auth', proxyMiddleware);
app.use('/api/auth', proxyMiddleware);
app.use('/estudiantes', proxyMiddleware);
app.use('/api/estudiantes', proxyMiddleware);
app.use('/maestros', proxyMiddleware);
app.use('/api/maestros', proxyMiddleware);
app.use('/horarios', proxyMiddleware);
app.use('/api/horarios', proxyMiddleware);
app.use('/reportes', proxyMiddleware);
app.use('/api/reportes', proxyMiddleware);

// ============================================================================
// DEBUG ENDPOINTS
// ============================================================================

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'API Gateway is working', timestamp: new Date().toISOString() });
});

// Show registered routes
app.get('/routes', (req, res) => {
  res.json({
    message: 'Available routes:',
    routes: [
      'GET /health - Health check',
      'GET /config - Service configuration',
      'GET /services - List all services',
      'GET /health/extended - Extended health status',
      'GET /test - API Gateway test',
      '/auth/* - Auth microservice',
      '/api/auth/* - Auth microservice (alternate)',
      '/estudiantes/* - Estudiantes microservice',
      '/api/estudiantes/* - Estudiantes microservice (alternate)',
      '/maestros/* - Maestros microservice',
      '/api/maestros/* - Maestros microservice (alternate)',
      '/horarios/* - Horarios proxy (maestros)',
      '/api/horarios/* - Horarios proxy (alternate)',
      '/reportes/* - Reportes microservice',
      '/api/reportes/* - Reportes microservice (alternate)'
    ]
  });
});

// ============================================================================
// 404 & ERROR HANDLERS
// ============================================================================

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  Not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    availableEndpoints: [
      '/health - Health status',
      '/config - Service configuration',
      '/services - Available services',
      '/health/extended - Extended health with service status',
      '/routes - Show registered routes',
      '/auth/* - Auth service',
      '/estudiantes/* - Estudiantes service',
      '/maestros/* - Maestros service',
      '/horarios/* - Horarios routes',
      '/reportes/* - Reportes service'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 API Gateway listening on port ${PORT}`);
  console.log(`✅ Service Registry initialized with CORE_HOST: ${CORE_HOST}`);
  console.log(`✅ Health check available at: http://localhost:${PORT}/health`);
  console.log(`✅ Configuration available at: http://localhost:${PORT}/config`);
  console.log(`✅ Services list available at: http://localhost:${PORT}/services`);
  console.log('');
  console.log('💡 QUICK START:');
  console.log(`   1. Change CORE_HOST in environment: export CORE_HOST="http://new.ip"`);
  console.log('   2. All routes automatically use new IP');
  console.log('   3. No other configuration needed!');
  console.log('');
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
