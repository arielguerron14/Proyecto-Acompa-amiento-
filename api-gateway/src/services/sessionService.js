const { getClient, isConnected } = require('./redisClient');
const { logger } = require('../middlewares/logger');

/**
 * SessionService para el gateway
 * Verifica tokenVersion almacenado en Redis
 */
class SessionService {
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
        if (!SessionService._memoryCache) SessionService._memoryCache = {};
        const data = SessionService._memoryCache[`session:${userId}`];
        if (data) return data.tokenVersion || 0;
      }
      return 0;
    } catch (error) {
      logger.error(`[SessionService.getTokenVersion] ${error.message}`);
      return 0;
    }
  }

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
