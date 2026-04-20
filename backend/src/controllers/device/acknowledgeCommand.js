const redis = require('../../config/redis').getClient();
const acknowledgeCommand = async (req, res) => {
  const { commandId } = req.body;
  await redis.del(commandId);
  await redis.lrem(`device:${req.params.deviceId}:commands`, 0, commandId);
  res.json({ message: 'Command acknowledged' });
};
module.exports = acknowledgeCommand;
