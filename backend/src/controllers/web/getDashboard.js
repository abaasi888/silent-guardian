const Device = require('../../models/Device');
const Alert = require('../../models/Alert');
const getDashboard = async (req, res) => {
  const devices = await Device.find({ userId: req.user._id });
  const alerts = await Alert.find({ userId: req.user._id, read: false }).limit(10);
  res.json({ devices, unreadAlerts: alerts.length });
};
module.exports = getDashboard;
