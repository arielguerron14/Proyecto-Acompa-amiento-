// Cargar configuración centralizada de infraestructura de forma segura
let infraConfig = null;
try {
  const fs = require('fs');
  const path = require('path');
  const infraPath = path.join(__dirname, '../../../infrastructure.config.js');
  if (fs.existsSync(infraPath)) {
    infraConfig = require(infraPath);
  }
} catch (err) {
  console.warn('⚠️  No se pudo cargar infrastructure.config.js, usando fallbacks:', err.message);
  infraConfig = null;
}

console.log('📋 Infrastructure config loaded:', infraConfig ? 'Yes' : 'No');

const getAuthUrl = () => {
  if (process.env.AUTH_SERVICE) return process.env.AUTH_SERVICE;
  if (infraConfig && infraConfig.PRIVATE.AUTH_URL) return infraConfig.PRIVATE.AUTH_URL();
  return 'http://localhost:3000';
};

const getEstudiantesUrl = () => {
  if (process.env.ESTUDIANTES_SERVICE) return process.env.ESTUDIANTES_SERVICE;
  if (infraConfig && infraConfig.PRIVATE.ESTUDIANTES_URL) return infraConfig.PRIVATE.ESTUDIANTES_URL();
  return 'http://localhost:3001';
};

const getMaestrosUrl = () => {
  if (process.env.MAESTROS_SERVICE) return process.env.MAESTROS_SERVICE;
  if (infraConfig && infraConfig.PRIVATE.MAESTROS_URL) return infraConfig.PRIVATE.MAESTROS_URL();
  return 'http://localhost:3002';
};

module.exports = {
  PORT: process.env.PORT || 8080,
  AUTH_SERVICE: getAuthUrl(),
  ESTUDIANTES_SERVICE: getEstudiantesUrl(),
  MAESTROS_SERVICE: getMaestrosUrl(),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 200,
  CORS_WHITELIST: process.env.CORS_WHITELIST ? process.env.CORS_WHITELIST.split(',') : ['http://localhost:5500','http://localhost:8080'],
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
};
