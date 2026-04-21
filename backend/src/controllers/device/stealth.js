// backend/src/controllers/device/stealth.js
const Device = require('../../models/Device');
const logger = require('../../config/logger');

/**
 * Enable or disable stealth mode for a device.
 * Stealth mode hides the tracking app from the device's UI and prevents notifications.
 * POST /api/v1/devices/stealth
 * Body: { deviceId, enabled: true/false }
 */
const toggleStealth = async (req, res) => {
  try {
    const { deviceId, enabled } = req.body;

    if (!deviceId || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'deviceId and enabled (boolean) are required' });
    }

    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    device.stealthMode = enabled;
    await device.save();

    logger.info(`Stealth mode ${enabled ? 'enabled' : 'disabled'} for device ${deviceId} by user ${req.user._id}`);

    res.json({
      success: true,
      deviceId: device.deviceId,
      stealthMode: device.stealthMode
    });
  } catch (error) {
    logger.error(`toggleStealth error: ${error.message}`);
    res.status(500).json({ error: 'Failed to update stealth mode' });
  }
};

/**
 * Get current stealth mode status for a device.
 * GET /api/v1/devices/stealth/:deviceId
 */
const getStealthStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({
      deviceId: device.deviceId,
      stealthMode: device.stealthMode
    });
  } catch (error) {
    logger.error(`getStealthStatus error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve stealth status' });
  }
};

module.exports = { toggleStealth, getStealthStatus };