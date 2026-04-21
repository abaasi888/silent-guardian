// backend/src/controllers/device/markStolen.js
const Device = require('../../models/Device');
const { createAlert } = require('../../services/notificationService');
const logger = require('../../config/logger');

/**
 * Mark a device as stolen. The device status becomes 'stolen'
 * and an alert is sent to the owner.
 * POST /api/v1/devices/:deviceId/stolen
 */
const markStolen = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.status === 'stolen') {
      return res.status(400).json({ error: 'Device is already marked as stolen' });
    }

    device.status = 'stolen';
    await device.save();

    // Create an alert for the user
    await createAlert(
      req.user._id,
      deviceId,
      'stolen',
      `Your device ${device.deviceName} has been marked as stolen. Please contact support.`
    );

    logger.warn(`Device ${deviceId} marked as stolen by user ${req.user._id}`);

    res.json({
      success: true,
      deviceId,
      status: 'stolen',
      message: 'Device marked as stolen. Alerts will be sent.'
    });
  } catch (error) {
    logger.error(`markStolen error: ${error.message}`);
    res.status(500).json({ error: 'Failed to mark device as stolen' });
  }
};

module.exports = markStolen;