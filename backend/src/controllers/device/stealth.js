const Device = require('../../models/Device');
const toggleStealth = async (req, res) => {
  const { deviceId, enabled } = req.body;
  const device = await Device.findOne({ deviceId, userId: req.user._id });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  device.stealthMode = enabled; await device.save(); res.json({ stealthMode: device.stealthMode });
};
const getStealthStatus = async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId, userId: req.user._id });
  res.json({ stealthMode: device?.stealthMode || false });
};
module.exports = { toggleStealth, getStealthStatus };
