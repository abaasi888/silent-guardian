const Alert = require('../../models/Alert');
const getAlerts = async (req, res) => {
  const alerts = await Alert.find({ userId: req.user._id }).sort('-createdAt').limit(50);
  res.json(alerts);
};
module.exports = getAlerts;
