const dotenv = require('dotenv');

dotenv.config();

// Try to load shared config, but continue without if not available
let sharedConfig = {};
try {
  sharedConfig = require('shared-config');
} catch (err) {
  console.warn('⚠️  shared-config not found, using environment variables only');
}

let infraConfig = null;
try {
  infraConfig = require('../../../config/infrastructure.config.js');
} catch (err) {
  console.warn('⚠️  No se pudo cargar infrastructure.config.js, usando fallbacks');
  infraConfig = null;
}

const getMongoUri = () => {
  console.log('🔍 DEBUG getMongoUri():');
  console.log('  - MONGO_URI env:', process.env.MONGO_URI ? '✓ SET' : '✗ NOT SET');
  console.log('  - MONGODB_URI env:', process.env.MONGODB_URI ? '✓ SET' : '✗ NOT SET');
  
  // Prefer MONGODB_URI when both are present (compose sets this explicitly)
  if (process.env.MONGODB_URI) {
    console.log('  → Using MONGODB_URI:', process.env.MONGODB_URI);
    return process.env.MONGODB_URI;
  }
  if (process.env.MONGO_URI) {
    console.log('  → Using MONGO_URI:', process.env.MONGO_URI);
    return process.env.MONGO_URI;
  }
  
  try {
    const url = sharedConfig.getMongoUrl();
    console.log('  → Using sharedConfig.getMongoUrl():', url);
    return url;
  } catch (err) {
    console.warn('⚠️  sharedConfig no disponible:', err.message);
  }
  
  if (infraConfig && infraConfig.PRIVATE.MONGO_URL) {
    const url = infraConfig.PRIVATE.MONGO_URL();
    console.log('  → Using infraConfig MONGO_URL:', url);
    return url;
  }
  
  const host = process.env.DB_HOST || 'mongo';
  const port = process.env.DB_PORT || 27017;
  const db = process.env.DB_NAME || 'estudiantesdb';
  const fallbackUrl = `mongodb://${host}:${port}/${db}`;
  console.log('  → Using fallback:', fallbackUrl);
  return fallbackUrl;
};

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGO_URI: getMongoUri(),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 100,
  CORS_WHITELIST: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:5500','http://localhost:8080'],
};
