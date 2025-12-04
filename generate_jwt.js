// Script para generar un token JWT de prueba
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'dev-jwt-secret';
const payload = {
  userId: 'user-001',
  role: 'maestro',
  email: 'user@example.com'
};
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
console.log('Token JWT de prueba:');
console.log(token);
