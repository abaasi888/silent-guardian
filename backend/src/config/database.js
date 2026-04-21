const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * MongoDB Connection Configuration
 * Handles connection establishment, retry logic, and graceful shutdown
 */

// Connection options for production readiness
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

/**
 * Establishes connection to MongoDB
 * Exits process on failure to allow container orchestration to restart
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
    
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    // Exit process with failure code (useful for container restart policies)
    process.exit(1);
  }
};

/**
 * Gracefully close MongoDB connection
 * Call this during application shutdown
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

module.exports = connectDB;
module.exports.closeDB = closeDB;