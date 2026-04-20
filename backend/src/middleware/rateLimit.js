const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis').getClient();
const createLimiter = (windowMs = 15 * 60 * 1000, max = 100) => rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redis.call(...args) }),
  windowMs, max, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
module.exports = { createLimiter };
