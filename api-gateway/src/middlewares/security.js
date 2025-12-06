const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function applySecurity(app, { whitelist = [] } = {}) {
  app.use(helmet());

  const corsOptions = {
    origin: true, // Permitir cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 3600,
  };
  
  // Aplicar CORS globalmente ANTES que cualquier middleware
  app.use(cors(corsOptions));
  
  // Manejar preflight requests explícitamente
  app.options('*', cors(corsOptions));

  const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
  app.use(limiter);
}

module.exports = { applySecurity };

