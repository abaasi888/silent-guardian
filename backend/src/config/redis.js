const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

/**
 * Redis Configuration
 * Handles connection, retry logic, and event monitoring
 */

// Connection configuration
const getRedisConfig = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection attempt ${times} failed. Retrying in ${delay}ms...`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
  connectTimeout: 10000, // 10 seconds
  keepAlive: 30000, // Send keep-alive every 30 seconds
  family: 4, // IPv4
  db: parseInt(process.env.REDIS_DB, 10) || 0,
});

/**
 * Establishes Redis connection
 * @returns {Redis} Redis client instance
 */
const connectRedis = () => {
  if (redisClient) {
    logger.warn('Redis client already exists, returning existing connection');
    return redisClient;
  }

  const config = getRedisConfig();
  redisClient = new Redis(config);

  // Connection event handlers
  redisClient.on('connect', () => {
    logger.info(`🔴 Redis connecting to ${config.host}:${config.port}...`);
  });

  redisClient.on('ready', () => {
    logger.info(`✅ Redis connected successfully to ${config.host}:${config.port}`);
  });

  redisClient.on('error', (err) => {
    logger.error(`Redis error: ${err.message}`);
    // Don't exit process – allow retry logic to handle
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redisClient.on('reconnecting', (delay) => {
    logger.info(`Redis reconnecting in ${delay}ms...`);
  });

  redisClient.on('end', () => {
    logger.warn('Redis connection ended');
  });

  return redisClient;
};

/**
 * Gracefully close Redis connection
 * @returns {Promise<void>}
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
    redisClient = null;
  }
};

/**
 * Get the Redis client instance
 * @returns {Redis|null} Redis client or null if not connected
 */
const getClient = () => redisClient;

/**
 * Health check for Redis
 * @returns {Promise<boolean>} True if Redis is healthy
 */
const healthCheck = async () => {
  if (!redisClient) return false;
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error(`Redis health check failed: ${error.message}`);
    return false;
  }
};

module.exports = connectRedis;
module.exports.closeRedis = closeRedis;
module.exports.getClient = getClient;
module.exports.healthCheck = healthCheck;