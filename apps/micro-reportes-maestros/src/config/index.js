const dotenv = require('dotenv');
const sharedConfig = require('shared-config');

dotenv.config();

const getMongoUri = () => {
  // Prefer MONGODB_URI used by docker-compose
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  if (process.env.MONGO_URL) return process.env.MONGO_URL;
  
  try {
    return sharedConfig.getMongoUrl();
  } catch (err) {
    console.warn('⚠️  sharedConfig no disponible:', err.message);
  }
  
  return `mongodb://${process.env.DB_HOST || 'mongo'}:${process.env.DB_PORT || 27017}/reportes-maestros`;
};

module.exports = {
  PORT: process.env.PORT || 5004,
  MONGO_URI: getMongoUri(),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
  CORS_WHITELIST: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:5500','http://localhost:8080'],
};
