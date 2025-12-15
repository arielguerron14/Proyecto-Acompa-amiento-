const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

class AuthService {
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  /**
   * Generar JWT con tokenVersion incluido
   * @param {string} userId - ID del usuario
   * @param {array} roles - Array de roles del usuario
   * @param {number} tokenVersion - Versión del token actual para invalidación
   * @returns {object} { accessToken, expiresIn }
   */
  static generateAccessTokenWithVersion(userId, roles, tokenVersion = 0) {
    const payload = { userId, roles, tokenVersion };
    return AuthService.generateAccessToken(payload);
  }

  static generateTokenPair(userId, role, email) {
    const payload = { userId, role, email };
    const accessToken = AuthService.generateAccessToken(payload);
    const refreshToken = AuthService.generateRefreshToken(payload);
    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_EXPIRY };
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, REFRESH_SECRET);
  }

  static refreshAccessToken(refreshToken) {
    const decoded = AuthService.verifyRefreshToken(refreshToken);
    const { userId, role, email } = decoded;
    return AuthService.generateAccessToken({ userId, role, email });
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2) return null;
    const scheme = parts[0];
    const token = parts[1];
    if (/^Bearer$/i.test(scheme)) return token;
    return null;
  }
}

module.exports = AuthService;
