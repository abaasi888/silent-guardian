const Redis = require('ioredis');
const logger = require('./logger');
let redisClient;
const connectRedis = () => {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis error:', err));
  return redisClient;
};
module.exports = connectRedis;
module.exports.getClient = () => redisClient;
