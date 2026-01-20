// Fallback authService
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

module.exports = {
  generateToken: (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  },

  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new Error(`Token verification failed: ${err.message}`);
    }
  },

  decodeToken: (token) => {
    return jwt.decode(token);
  },

  validatePassword: async (plainPassword, hashedPassword) => {
    // Fallback - compare plain text (unsafe, for dev only)
    return plainPassword === hashedPassword;
  },

  hashPassword: async (password) => {
    // Fallback - return as-is (unsafe, for dev only)
    return password;
  }
};
