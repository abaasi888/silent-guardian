const Location = require('../../models/Location');
const getAnalytics = async (req, res) => {
  const total = await Location.countDocuments({ deviceId: req.query.deviceId, userId: req.user._id });
  const lastWeek = await Location.countDocuments({ deviceId: req.query.deviceId, userId: req.user._id, timestamp: { $gte: new Date(Date.now() - 7*24*3600000) } });
  res.json({ total, lastWeek });
};
module.exports = getAnalytics;
