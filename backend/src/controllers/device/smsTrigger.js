const Device = require('../../models/Device');
const Location = require('../../models/Location');
const { sendAlertSMS } = require('../../services/smsService');
const User = require('../../models/User');

const processIncomingSms = async (req, res) => {
  const { deviceId, fromNumber, message } = req.body;
  const device = await Device.findOne({ deviceId });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const user = await User.findById(device.userId);
  if (!user || !user.phone) return res.status(400).json({ error: 'User phone not set' });

  const triggerWord = process.env.SMS_TRIGGER_KEYWORD || '#TRACKNOW';
  if (message.trim() === triggerWord) {
    const lastLocation = await Location.findOne({ deviceId }).sort('-timestamp');
    let reply = `Device: ${device.deviceName}\n`;
    if (lastLocation) {
      reply += `Last location: ${lastLocation.lat}, ${lastLocation.lng} at ${lastLocation.timestamp}`;
    } else {
      reply += 'No location recorded yet.';
    }
    await sendAlertSMS(fromNumber, reply);
    return res.json({ success: true, action: 'location_reply' });
  }
  res.json({ success: false, message: 'Unknown command' });
};

module.exports = { processIncomingSms };
