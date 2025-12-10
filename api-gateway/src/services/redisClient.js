const redis = require('redis');
const { logger } = require('../middlewares/logger');

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
          return new Error('Redis connection disabled');
        },
      },
      db: parseInt(REDIS_DB, 10),
      password: REDIS_PASSWORD || undefined,
    };

    client = redis.createClient(options);

    client.on('error', () => {
      // Silently handle errors - fallback to memory cache
    });

    const connectPromise = Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
      ),
    ]);

    await connectPromise;
    logger.info(`Redis session store connected to ${REDIS_HOST}:${REDIS_PORT}`);
    return true;
  } catch (error) {
    logger.info(`Redis not available (${error.message}), using in-memory session cache`);
    client = null;
    return false;
  }
}

function getClient() {
  return client;
}

function isConnected() {
  return client !== null && client.isOpen;
}

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
