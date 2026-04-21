/**
 * Get system statistics and health metrics (Admin only)
 * GET /api/v1/admin/stats
 */

const os = require('os');
const mongoose = require('mongoose');
const redis = require('../../config/redis');
const logger = require('../../config/logger');

const getSystemStats = async (req, res) => {
  try {
    // System metrics
    const cpuUsage = os.loadavg();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    const uptime = process.uptime();
    const uptimeFormatted = {
      seconds: Math.floor(uptime % 60),
      minutes: Math.floor((uptime % 3600) / 60),
      hours: Math.floor((uptime % 86400) / 3600),
      days: Math.floor(uptime / 86400)
    };

    // Process memory usage
    const processMemory = process.memoryUsage();
    
    // Database stats
    let dbStats = null;
    try {
      const db = mongoose.connection.db;
      if (db) {
        const stats = await db.stats();
        dbStats = {
          collections: stats.collections,
          objects: stats.objects,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexes: stats.indexes,
          indexSize: stats.indexSize
        };
      }
    } catch (err) {
      logger.warn(`Failed to get DB stats: ${err.message}`);
    }

    // Redis health
    let redisHealthy = false;
    let redisInfo = null;
    try {
      const redisClient = redis.getClient();
      if (redisClient) {
        redisHealthy = await redis.healthCheck();
        if (redisHealthy) {
          const info = await redisClient.info();
          const lines = info.split('\n');
          const usedMemoryLine = lines.find(l => l.startsWith('used_memory_human'));
          redisInfo = {
            usedMemory: usedMemoryLine ? usedMemoryLine.split(':')[1].trim() : 'Unknown',
            connected: true
          };
        }
      }
    } catch (err) {
      logger.warn(`Redis health check failed: ${err.message}`);
      redisInfo = { connected: false, error: err.message };
    }

    // MongoDB connection state
    const mongoState = mongoose.connection.readyState;
    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // System info
    const systemStats = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.version,
      platform: os.platform(),
      hostname: os.hostname(),
      uptime: uptimeFormatted,
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        loadAverage: {
          '1min': cpuUsage[0],
          '5min': cpuUsage[1],
          '15min': cpuUsage[2]
        }
      },
      memory: {
        total: totalMemory,
        totalFormatted: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: freeMemory,
        freeFormatted: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: usedMemory,
        usedFormatted: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercent: memoryUsagePercent.toFixed(2)
      },
      process: {
        pid: process.pid,
        memory: {
          rss: processMemory.rss,
          rssFormatted: `${(processMemory.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: processMemory.heapTotal,
          heapTotalFormatted: `${(processMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: processMemory.heapUsed,
          heapUsedFormatted: `${(processMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: processMemory.external,
          externalFormatted: `${(processMemory.external / 1024 / 1024).toFixed(2)} MB`
        }
      },
      databases: {
        mongodb: {
          state: mongoStates[mongoState],
          connected: mongoState === 1,
          stats: dbStats
        },
        redis: {
          healthy: redisHealthy,
          info: redisInfo
        }
      }
    };

    logger.info(`Admin ${req.user._id} fetched system stats`);

    res.json(systemStats);
  } catch (error) {
    logger.error(`Error in getSystemStats: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve system statistics' });
  }
};

module.exports = getSystemStats;