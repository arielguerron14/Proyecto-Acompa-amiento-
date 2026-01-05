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
  // Primero intenta usar variable de entorno explícita
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }
  
  // Luego usa infraConfig si está disponible
  if (infraConfig && infraConfig.PRIVATE.MONGO_URL) {
    return infraConfig.PRIVATE.MONGO_URL();
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
  if (infraConfig && infraConfig.PRIVATE.REDIS_HOST) {
    return infraConfig.PRIVATE.REDIS_HOST();
  }
  return 'redis';
};

const getRedisPort = () => {
  if (process.env.REDIS_PORT) {
    return parseInt(process.env.REDIS_PORT);
  }
  if (infraConfig && infraConfig.PRIVATE.REDIS_PORT) {
    return infraConfig.PRIVATE.REDIS_PORT;
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
