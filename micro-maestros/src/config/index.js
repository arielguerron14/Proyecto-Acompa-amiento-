const dotenv = require('dotenv');
dotenv.config();

// Cargar configuración centralizada de infraestructura
let infraConfig;
try {
  infraConfig = require('../../../infrastructure.config.js');
} catch (err) {
  console.warn('⚠️  No se pudo cargar infrastructure.config.js, usando fallbacks');
  infraConfig = null;
}

const getMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  if (infraConfig && infraConfig.PRIVATE.MONGO_URL) return infraConfig.PRIVATE.MONGO_URL();
  const host = process.env.DB_HOST || 'mongo';
  const port = process.env.DB_PORT || 27017;
  const db = process.env.DB_NAME || 'maestrosdb';
  return `mongodb://${host}:${port}/${db}`;
};

module.exports = {
  PORT: process.env.PORT || 3002,
  MONGO_URI: getMongoUri(),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
  CORS_WHITELIST: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:5500','http://localhost:8080'],
};
