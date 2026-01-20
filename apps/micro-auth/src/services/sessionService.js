const { getClient, isConnected } = require('./redisClient');

let logger;
try {
  ({ logger } = require('@proyecto/shared-auth/src/middlewares/logger'));
} catch (err) {
  ({ logger } = require('../fallback/logger'));
}

/**
 * SessionService: Maneja versiones de token en Redis/memoria
 * Clave: session:userId → { tokenVersion: N, createdAt: timestamp }
 */
class SessionService {
  /**
   * Obtener tokenVersion para un usuario
   */
  static async getTokenVersion(userId) {
    try {
      if (isConnected()) {
        const client = getClient();
        const key = `session:${userId}`;
        const data = await client.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          return parsed.tokenVersion || 0;
        }
      } else {
        // Fallback a memoria (in-memory cache)
        if (!SessionService._memoryCache) SessionService._memoryCache = {};
        const data = SessionService._memoryCache[`session:${userId}`];
        if (data) return data.tokenVersion || 0;
      }
      // Setear default a 0 si no existe
      await SessionService.setTokenVersion(userId, 0);
      return 0;
    } catch (error) {
      logger.error(`[SessionService.getTokenVersion] ${error.message}`);
      return 0;
    }
  }

  /**
   * Establecer tokenVersion para un usuario
   */
  static async setTokenVersion(userId, version) {
    try {
      const sessionData = {
        tokenVersion: version,
        createdAt: new Date().toISOString(),
      };

      if (isConnected()) {
        const client = getClient();
        const key = `session:${userId}`;
        // TTL: 30 días (2592000 segundos)
        await client.setEx(key, 2592000, JSON.stringify(sessionData));
      } else {
        // Fallback a memoria
        if (!SessionService._memoryCache) SessionService._memoryCache = {};
        SessionService._memoryCache[`session:${userId}`] = sessionData;
      }
      return true;
    } catch (error) {
      logger.error(`[SessionService.setTokenVersion] ${error.message}`);
      return false;
    }
  }

  /**
   * Incrementar tokenVersion (usamos en logout)
   */
  static async incrementTokenVersion(userId) {
    try {
      const current = await SessionService.getTokenVersion(userId);
      const newVersion = (current || 0) + 1;
      await SessionService.setTokenVersion(userId, newVersion);
      return newVersion;
    } catch (error) {
      logger.error(`[SessionService.incrementTokenVersion] ${error.message}`);
      return null;
    }
  }

  /**
   * Invalidar toda la sesión de un usuario (logout)
   */
  static async invalidateSession(userId) {
    try {
      if (isConnected()) {
        const client = getClient();
        const key = `session:${userId}`;
        await client.del(key);
      } else {
        if (!SessionService._memoryCache) SessionService._memoryCache = {};
        delete SessionService._memoryCache[`session:${userId}`];
      }
      return true;
    } catch (error) {
      logger.error(`[SessionService.invalidateSession] ${error.message}`);
      return false;
    }
  }

  /**
   * Comparar tokenVersion del JWT con el almacenado en Redis
   */
  static async verifyTokenVersion(userId, tokenVersion) {
    try {
      const storedVersion = await SessionService.getTokenVersion(userId);
      return storedVersion === tokenVersion;
    } catch (error) {
      logger.error(`[SessionService.verifyTokenVersion] ${error.message}`);
      return false;
    }
  }
}

module.exports = SessionService;
