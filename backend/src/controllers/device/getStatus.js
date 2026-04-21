// backend/src/controllers/device/getStatus.js
const Device = require('../../models/Device');
const redis = require('../../config/redis').getClient();
const logger = require('../../config/logger');

/**
 * Get full device information including cached last location.
 * GET /api/v1/devices/:deviceId/status
 */
const getStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Try to get the latest location from Redis cache (faster)
    let cachedLocation = null;
    try {
      const cached = await redis.get(`device:${deviceId}:last`);
      if (cached) cachedLocation = JSON.parse(cached);
    } catch (err) {
      logger.warn(`Redis error for device ${deviceId}: ${err.message}`);
    }

    const response = {
      ...device.toObject(),
      lastLocationCache: cachedLocation || device.lastLocation
    };

    res.json(response);
  } catch (error) {
    logger.error(`getStatus error: ${error.message}`);
    res.status(500).json({ error: 'Failed to get device status' });
  }
};

module.exports = getStatus;