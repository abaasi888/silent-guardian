const Device = require('../../models/Device');
const markStolen = async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId, userId: req.user._id });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  device.status = 'stolen'; await device.save(); res.json({ status: 'stolen' });
};
module.exports = markStolen;
