const Device = require('../../models/Device');
const User = require('../../models/User');
const transferDevice = async (req, res) => {
  const { deviceId, newUserEmail } = req.body;
  const device = await Device.findOne({ deviceId, userId: req.user._id });
  if (!device) return res.status(404).json({ error: 'Device not owned' });
  const newUser = await User.findOne({ email: newUserEmail });
  if (!newUser) return res.status(404).json({ error: 'New user not found' });
  device.userId = newUser._id; await device.save(); res.json({ message: 'Device transferred' });
};
module.exports = transferDevice;
