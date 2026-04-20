const Device = require('../../models/Device');
const redis = require('../../config/redis').getClient();
const getStatus = async (req, res) => {
  const device = await Device.findOne({ deviceId: req.params.deviceId, userId: req.user._id });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const lastLoc = await redis.get(`device:${device.deviceId}:last`);
  res.json({ ...device.toObject(), lastLocationCache: lastLoc ? JSON.parse(lastLoc) : device.lastLocation });
};
module.exports = getStatus;
