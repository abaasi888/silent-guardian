const User = require('../../models/User');
const Device = require('../../models/Device');
const Subscription = require('../../models/Subscription');
const getAdminDashboard = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const totalUsers = await User.countDocuments();
  const totalDevices = await Device.countDocuments();
  const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
  res.json({ totalUsers, totalDevices, activeSubscriptions });
};
module.exports = getAdminDashboard;
