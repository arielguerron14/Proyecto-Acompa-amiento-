const { getClient, isConnected } = require('./redisClient');
const { logger } = require('../../../shared-auth/src/middlewares/logger');

// Fallback to in-memory cache if Redis is not available
const memoryCache = new Map();

// Redis key prefix for tokens
const REDIS_KEY_PREFIX = 'session:token:';
const REDIS_TTL = 7 * 24 * 60 * 60; // 7 days in seconds (matches REFRESH_TOKEN_EXPIRY)

/**
 * Set a token in cache (Redis or in-memory fallback)
 */
async function set(token, user) {
  if (isConnected()) {
    try {
      const redisClient = getClient();
      const key = `${REDIS_KEY_PREFIX}${token}`;
      const value = JSON.stringify(user);
      // Set key with TTL of 7 days using setEx
      await redisClient.setEx(key, REDIS_TTL, value);
    } catch (error) {
      logger.warn(`Redis set error: ${error.message}, using fallback cache`);
      memoryCache.set(token, user);
    }
  } else {
    memoryCache.set(token, user);
  }
}

/**
 * Get a token from cache (Redis or in-memory fallback)
 */
async function get(token) {
  if (isConnected()) {
    try {
      const redisClient = getClient();
      const key = `${REDIS_KEY_PREFIX}${token}`;
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.warn(`Redis get error: ${error.message}, checking fallback cache`);
      return memoryCache.get(token) || null;
    }
  } else {
    return memoryCache.get(token) || null;
  }
}

/**
 * Delete a token from cache (Redis or in-memory fallback)
 */
async function deleteToken(token) {
  if (isConnected()) {
    try {
      const redisClient = getClient();
      const key = `${REDIS_KEY_PREFIX}${token}`;
      await redisClient.del(key);
    } catch (error) {
      logger.warn(`Redis delete error: ${error.message}, using fallback cache`);
      memoryCache.delete(token);
    }
  } else {
    memoryCache.delete(token);
  }
}

/**
 * Check if a token exists in cache (Redis or in-memory fallback)
 */
async function has(token) {
  if (isConnected()) {
    try {
      const redisClient = getClient();
      const key = `${REDIS_KEY_PREFIX}${token}`;
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.warn(`Redis exists check error: ${error.message}, checking fallback cache`);
      return memoryCache.has(token);
    }
  } else {
    return memoryCache.has(token);
  }
}

/**
 * Clear all tokens from cache (Redis or in-memory fallback)
 * WARNING: This clears ALL session tokens, use with caution
 */
async function clear() {
  if (isConnected()) {
    try {
      const redisClient = getClient();
      const keys = await redisClient.keys(`${REDIS_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Cleared ${keys.length} tokens from Redis`);
      }
    } catch (error) {
      logger.warn(`Redis clear error: ${error.message}, using fallback cache`);
      memoryCache.clear();
    }
  } else {
    memoryCache.clear();
  }
}

module.exports = {
  set,
  get,
  delete: deleteToken, // Note: 'delete' is reserved, so we use deleteToken
  has,
  clear,
};


