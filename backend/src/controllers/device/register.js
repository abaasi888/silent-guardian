// backend/src/controllers/device/register.js
const crypto = require('crypto');
const Device = require('../../models/Device');
const logger = require('../../config/logger');

/**
 * Register a new device for the authenticated user.
 * Generates a unique deviceId and an API key for hardware authentication.
 * POST /api/v1/devices/register
 */
const registerDevice = async (req, res) => {
  try {
    const { deviceName, hardwareInfo } = req.body;

    // Basic validation
    if (!deviceName || typeof deviceName !== 'string') {
      return res.status(400).json({ error: 'deviceName is required and must be a string' });
    }

    // Generate secure identifiers
    const deviceId = crypto.randomBytes(16).toString('hex');
    const apiKey = crypto.randomBytes(32).toString('hex');

    const device = new Device({
      userId: req.user._id,
      deviceName: deviceName.trim(),
      deviceId,
      hardwareInfo: hardwareInfo || {},
      status: 'active',
      createdAt: new Date(),
      lastSeen: null,
      stealthMode: false
    });

    await device.save();

    logger.info(`New device registered: ${deviceId} for user ${req.user._id}`);

    res.status(201).json({
      success: true,
      deviceId,
      apiKey,        // Store this securely on the hardware device
      deviceName: device.deviceName
    });
  } catch (error) {
    logger.error(`Device registration error: ${error.message}`);
    res.status(500).json({ error: 'Failed to register device' });
  }
};

module.exports = registerDevice;