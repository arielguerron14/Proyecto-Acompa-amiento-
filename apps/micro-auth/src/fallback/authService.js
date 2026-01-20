// Fallback authService
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

module.exports = {
  generateToken: (payload, expiresIn = '24h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  },

  generateAccessToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  },

  generateAccessTokenWithVersion: (userId, roles, tokenVersion = 0) => {
    return jwt.sign(
      {
        userId,
        roles: Array.isArray(roles) ? roles : [roles],
        tokenVersion
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  },

  generateRefreshToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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
