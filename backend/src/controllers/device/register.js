const Device = require('../../models/Device');
const crypto = require('crypto');
const registerDevice = async (req, res) => {
  const { deviceName, hardwareInfo } = req.body;
  const deviceId = crypto.randomBytes(16).toString('hex');
  const device = new Device({ userId: req.user._id, deviceName, deviceId, hardwareInfo, status: 'active' });
  await device.save();
  res.status(201).json({ deviceId, apiKey: crypto.randomBytes(32).toString('hex') });
};
module.exports = registerDevice;
