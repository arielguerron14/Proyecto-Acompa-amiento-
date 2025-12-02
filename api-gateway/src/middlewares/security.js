const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

function applySecurity(app, { whitelist = [] } = {}) {
  app.use(helmet());

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  };
  app.use(cors(corsOptions));

  const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
  app.use(limiter);
}

module.exports = { applySecurity };

