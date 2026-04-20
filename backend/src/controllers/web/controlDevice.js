const redis = require('../../config/redis').getClient();
const controlDevice = async (req, res) => {
  const { deviceId, command } = req.body;
  await redis.publish(`device:${deviceId}:control`, JSON.stringify({ command, from: 'web', user: req.user._id }));
  res.json({ commandSent: true });
};
module.exports = controlDevice;
