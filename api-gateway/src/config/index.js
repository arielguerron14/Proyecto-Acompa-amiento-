const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 8080,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 200,
  CORS_WHITELIST: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:5500','http://localhost:8080'],
};
