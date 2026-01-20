console.log('[CONFIG DEBUG] AUTH_URL env:', process.env.AUTH_URL);
console.log('[CONFIG DEBUG] AUTH_SERVICE env:', process.env.AUTH_SERVICE);
console.log('[CONFIG DEBUG] ESTUDIANTES_SERVICE env:', process.env.ESTUDIANTES_SERVICE);
console.log('[CONFIG DEBUG] MAESTROS_SERVICE env:', process.env.MAESTROS_SERVICE);

module.exports = {
  AUTH_SERVICE: process.env.AUTH_URL || process.env.AUTH_SERVICE || 'http://localhost:3000',
  ESTUDIANTES_SERVICE: process.env.ESTUDIANTES_URL || process.env.ESTUDIANTES_SERVICE || 'http://micro-estudiantes:3002',
  MAESTROS_SERVICE: process.env.MAESTROS_URL || process.env.MAESTROS_SERVICE || 'http://micro-maestros:5001',
  PORT: process.env.PORT || 8080,
};

console.log('[CONFIG DEBUG] RESOLVED AUTH_SERVICE:', module.exports.AUTH_SERVICE);
console.log('[CONFIG DEBUG] RESOLVED ESTUDIANTES_SERVICE:', module.exports.ESTUDIANTES_SERVICE);
console.log('[CONFIG DEBUG] RESOLVED MAESTROS_SERVICE:', module.exports.MAESTROS_SERVICE);
