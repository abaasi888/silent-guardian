const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Logger Configuration
 * Provides structured logging with multiple transports and log levels
 */

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0 && meta.stack !== stack) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create transports array
const transports = [];

// Always log to file – error log
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: logFormat,
  })
);

// Always log to file – combined log
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    format: logFormat,
  })
);

// Log to console in non-production environments
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
} else {
  // In production, still log errors to console for container logs
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      level: 'error',
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exitOnError: false, // Don't crash on logging errors
});

/**
 * Helper methods for specific log contexts
 */
const logRequest = (req, message, meta = {}) => {
  logger.info(message, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?._id,
    ...meta,
  });
};

const logError = (err, req = null, meta = {}) => {
  const errorMeta = {
    error: err.message,
    stack: err.stack,
    ...meta,
  };
  
  if (req) {
    errorMeta.method = req.method;
    errorMeta.url = req.url;
    errorMeta.ip = req.ip;
    errorMeta.userId = req.user?._id;
  }
  
  logger.error(err.message, errorMeta);
};

const logDBQuery = (collection, operation, duration, meta = {}) => {
  logger.debug(`DB Query: ${collection}.${operation}`, {
    collection,
    operation,
    durationMs: duration,
    ...meta,
  });
};

module.exports = logger;
module.exports.logRequest = logRequest;
module.exports.logError = logError;
module.exports.logDBQuery = logDBQuery;