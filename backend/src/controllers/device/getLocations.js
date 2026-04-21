// backend/src/controllers/device/getLocations.js
const Location = require('../../models/Location');
const Device = require('../../models/Device');
const logger = require('../../config/logger');

/**
 * Get the most recent 100 locations for a specific device.
 * GET /api/v1/devices/:deviceId/locations
 */
const getLocations = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Verify device belongs to user
    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const locations = await Location.find({ deviceId, userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      deviceId,
      count: locations.length,
      locations
    });
  } catch (error) {
    logger.error(`getLocations error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve locations' });
  }
};

module.exports = getLocations;