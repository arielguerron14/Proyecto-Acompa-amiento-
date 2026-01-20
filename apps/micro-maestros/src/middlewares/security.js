const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, CORS_WHITELIST } = require('../config');

function dynamicOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (CORS_WHITELIST.indexOf(origin) !== -1) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}

function applySecurity(app) {
  app.use(helmet());
  app.use(cors({ origin: dynamicOrigin }));

  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

module.exports = { applySecurity };
