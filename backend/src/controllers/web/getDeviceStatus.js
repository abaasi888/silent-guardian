const Device = require('../../models/Device');
const getDeviceStatus = async (req, res) => {
  const devices = await Device.find({ userId: req.user._id });
  res.json(devices);
};
module.exports = getDeviceStatus;
