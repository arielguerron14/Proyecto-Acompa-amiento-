console.log('[DEBUG] AUTH_URL:', process.env.AUTH_URL, '| AUTH_SERVICE:', process.env.AUTH_SERVICE);
module.exports = {
  AUTH_SERVICE: process.env.AUTH_URL || process.env.AUTH_SERVICE || 'http://localhost:3000',
  ESTUDIANTES_SERVICE: process.env.ESTUDIANTES_URL || process.env.ESTUDIANTES_SERVICE || 'http://micro-estudiantes:3002',
  MAESTROS_SERVICE: process.env.MAESTROS_URL || process.env.MAESTROS_SERVICE || 'http://micro-maestros:5001',
  PORT: process.env.PORT || 8080,
};
