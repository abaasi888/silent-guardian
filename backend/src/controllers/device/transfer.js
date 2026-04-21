// backend/src/controllers/device/transfer.js
const Device = require('../../models/Device');
const User = require('../../models/User');
const logger = require('../../config/logger');

/**
 * Transfer a device to another registered user by email.
 * POST /api/v1/devices/transfer
 * Body: { deviceId, newUserEmail }
 */
const transferDevice = async (req, res) => {
  try {
    const { deviceId, newUserEmail } = req.body;

    if (!deviceId || !newUserEmail) {
      return res.status(400).json({ error: 'deviceId and newUserEmail are required' });
    }

    // Find the device and verify current ownership
    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ error: 'Device not found or not owned by you' });
    }

    // Find the new owner
    const newUser = await User.findOne({ email: newUserEmail.toLowerCase() });
    if (!newUser) {
      return res.status(404).json({ error: 'New owner not found' });
    }

    // Transfer ownership
    device.userId = newUser._id;
    await device.save();

    logger.info(`Device ${deviceId} transferred from ${req.user._id} to ${newUser._id}`);

    res.json({
      success: true,
      message: `Device successfully transferred to ${newUser.email}`,
      deviceId: device.deviceId,
      newOwner: newUser.email
    });
  } catch (error) {
    logger.error(`transferDevice error: ${error.message}`);
    res.status(500).json({ error: 'Failed to transfer device' });
  }
};

module.exports = transferDevice;