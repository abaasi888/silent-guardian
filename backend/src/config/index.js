/**
 * Central configuration module
 * Import this file to access all configuration modules
 */

const connectDB = require('./database');
const connectRedis = require('./redis');
const logger = require('./logger');
const constants = require('./constants');
const { securityConfig, bcrypt } = require('./security');

module.exports = {
  connectDB,
  connectRedis,
  logger,
  constants,
  securityConfig,
  bcrypt,
};