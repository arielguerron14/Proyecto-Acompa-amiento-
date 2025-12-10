const cors = require('cors');

/**
 * Returns a configured CORS middleware.
 * Read allowed origins from `process.env.ALLOWED_ORIGINS` (comma-separated)
 */
function corsMiddleware() {
  const raw = process.env.ALLOWED_ORIGINS || 'http://localhost:5500';
  const allowedOrigins = raw.split(',').map(s => s.trim()).filter(Boolean);

  const options = {
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Forwarded-For', 'CF-Connecting-IP']
  };

  return cors(options);
}

module.exports = { corsMiddleware };
