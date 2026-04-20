const Device = require('../../models/Device');
const getDevices = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const devices = await Device.find().populate('userId', 'email fullName');
  res.json(devices);
};
module.exports = getDevices;
