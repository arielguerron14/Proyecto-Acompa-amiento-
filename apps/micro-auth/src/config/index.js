const dotenv = require('dotenv');

let sharedConfig = {};
try {
  sharedConfig = require('shared-config');
} catch (err) {
  console.warn('⚠️  shared-config not found, using environment variables only');
}

dotenv.config();

// Cargar configuración centralizada de infraestructura
let infraConfig;
try {
  infraConfig = require('../../../config/infrastructure.config.js');
} catch (err) {
  console.warn('⚠️  No se pudo cargar infrastructure.config.js, usando fallbacks');
  infraConfig = null;
}

const getMongoUri = () => {
  // Primero intenta usar variable de entorno explícita
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  
  // También intenta MONGODB_URI (alternativa común)
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  // Luego usa shared-config (recomendado)
  try {
    return sharedConfig.getMongoUrl();
  } catch (err) {
    console.warn('⚠️  sharedConfig no disponible:', err.message);
  }
  
  // Fallback: construir desde variables individuales
  const host = process.env.DB_HOST || 'mongo';
  const port = process.env.DB_PORT || 27017;
  const db = process.env.DB_NAME || 'authdb';
  return `mongodb://${host}:${port}/${db}`;
};

const getRedisHost = () => {
  if (process.env.REDIS_HOST) {
    return process.env.REDIS_HOST;
  }
  try {
    return sharedConfig.getPrivateIp('db');
  } catch (err) {
    console.warn('⚠️  sharedConfig no disponible:', err.message);
  }
  return 'redis';
};

const getRedisPort = () => {
  if (process.env.REDIS_PORT) {
    return parseInt(process.env.REDIS_PORT);
  }
  try {
    return sharedConfig.getPort('redis');
  } catch (err) {
    console.warn('⚠️  sharedConfig no disponible:', err.message);
  }
  return 6379;
};

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: getMongoUri(),
  REDIS_HOST: getRedisHost(),
  REDIS_PORT: getRedisPort(),
  
  // Debug: mostrar qué configuración se está usando
  DEBUG: process.env.DEBUG === 'true' ? {
    mongoUri: getMongoUri(),
    redisHost: getRedisHost(),
    infraConfigLoaded: !!infraConfig,
  } : null,
};
