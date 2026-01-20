const redis = require('redis');

let logger;
try {
  ({ logger } = require('@proyecto/shared-auth/src/middlewares/logger'));
} catch (err) {
  ({ logger } = require('../fallback/logger'));
}

// Redis client configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = process.env.REDIS_DB || 0;

let client = null;
let connectionAttempted = false;

/**
 * Initialize and connect to Redis
 * Returns true if connection successful, false if failed
 */
async function initRedis() {
  if (connectionAttempted) {
    return client !== null && client.isOpen;
  }

  connectionAttempted = true;

  try {
    const options = {
      socket: {
        host: REDIS_HOST,
        port: parseInt(REDIS_PORT, 10),
        reconnectStrategy: () => {
          // Don't automatically retry connections
          return new Error('Redis connection disabled');
        },
      },
      db: parseInt(REDIS_DB, 10),
      password: REDIS_PASSWORD || undefined,
    };

    client = redis.createClient(options);

    // Suppress error logs from redis client
    client.on('error', () => {
      // Silently handle errors - fallback to memory cache
    });

    // Try to connect with a timeout. Use a cancellable timer so the timeout
    // does not remain as an open handle after connect succeeds.
    let timer = null;
    const connectPromise = client.connect().then(
      (res) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        return res;
      },
      (err) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        throw err;
      }
    );

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis connection timeout')), 2000);
    });

    await Promise.race([connectPromise, timeoutPromise]);
    logger.info(`Redis session store connected to ${REDIS_HOST}:${REDIS_PORT}`);
    return true;
  } catch (error) {
    logger.info(`Redis not available (${error.message}), using in-memory session cache`);
    client = null;
    return false;
  }
}

/**
 * Get Redis client
 */
function getClient() {
  return client;
}

/**
 * Check if Redis is connected
 */
function isConnected() {
  return client !== null && client.isOpen;
}

/**
 * Disconnect from Redis gracefully
 */
async function disconnect() {
  if (client && client.isOpen) {
    try {
      await client.disconnect();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error(`Error disconnecting Redis: ${error.message}`);
    }
  }
  client = null;
}

module.exports = {
  initRedis,
  getClient,
  isConnected,
  disconnect,
};


