// backend/src/controllers/device/smsTrigger.js
const Device = require('../../models/Device');
const Location = require('../../models/Location');
const { sendAlertSMS } = require('../../services/smsService');
const User = require('../../models/User');
const logger = require('../../config/logger');

/**
 * Handle an incoming SMS message sent from a device.
 * Used to trigger location retrieval via SMS (e.g., when device has no data).
 * POST /api/v1/devices/sms-trigger
 * Body: { deviceId, fromNumber, message }
 */
const processIncomingSms = async (req, res) => {
  try {
    const { deviceId, fromNumber, message } = req.body;

    if (!deviceId || !fromNumber || !message) {
      return res.status(400).json({ error: 'deviceId, fromNumber, message are required' });
    }

    // Find device and its owner
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const user = await User.findById(device.userId);
    if (!user || !user.phone) {
      return res.status(400).json({ error: 'User has no registered phone number' });
    }

    const triggerWord = process.env.SMS_TRIGGER_KEYWORD || '#TRACKNOW';
    if (message.trim() === triggerWord) {
      const lastLocation = await Location.findOne({ deviceId }).sort('-timestamp');

      let reply = `Silent Guardian - ${device.deviceName}\n`;
      if (lastLocation) {
        reply += `Last known location: ${lastLocation.lat}, ${lastLocation.lng}\n`;
        reply += `Timestamp: ${lastLocation.timestamp.toISOString()}`;
      } else {
        reply += 'No location data available yet.';
      }

      await sendAlertSMS(fromNumber, reply);
      logger.info(`SMS reply sent to ${fromNumber} for device ${deviceId}`);

      return res.json({ success: true, action: 'location_reply', message: 'Reply sent' });
    }

    res.json({ success: false, action: 'unknown_command', message: 'Command not recognized' });
  } catch (error) {
    logger.error(`processIncomingSms error: ${error.message}`);
    res.status(500).json({ error: 'Failed to process SMS' });
  }
};

module.exports = { processIncomingSms };