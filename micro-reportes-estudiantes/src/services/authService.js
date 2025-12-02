const jwt = require('jsonwebtoken');
const { logger } = require('../middlewares/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'desarrollo-secret-key-cambiar-en-produccion';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret-key-cambiar-en-produccion';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

class AuthService {
  /**
   * Generar un token de acceso (access token)
   */
  static generateAccessToken(payload) {
    try {
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
      return token;
    } catch (error) {
      logger.error(`Error generating access token: ${error.message}`);
      throw new Error('Error al generar token de acceso');
    }
  }

  /**
   * Generar un refresh token
   */
  static generateRefreshToken(payload) {
    try {
      const token = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
      return token;
    } catch (error) {
      logger.error(`Error generating refresh token: ${error.message}`);
      throw new Error('Error al generar refresh token');
    }
  }

  /**
   * Generar par de tokens (access + refresh)
   */
  static generateTokenPair(userId, role, email) {
    const payload = { userId, role, email };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ userId, role, email });

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    };
  }

  /**
   * Verificar y decodificar un access token
   */
  static verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Token inválido');
      }
      throw error;
    }
  }

  /**
   * Verificar y decodificar un refresh token
   */
  static verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expirado');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Refresh token inválido');
      }
      throw error;
    }
  }

  /**
   * Refrescar token de acceso usando un refresh token
   */
  static refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const newAccessToken = this.generateAccessToken({
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
      });
      return newAccessToken;
    } catch (error) {
      logger.error(`Error refreshing access token: ${error.message}`);
      throw new Error('Error al refrescar token de acceso');
    }
  }

  /**
   * Extraer token del header Authorization
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }
    return parts[1];
  }
}

module.exports = require('../../../shared-auth/src/services/authService');
