const redis = require('../../config/redis').getClient();
const sendCommand = async (req, res) => {
  const { deviceId, command, params } = req.body;
  const commandId = `cmd:${deviceId}:${Date.now()}`;
  await redis.set(commandId, JSON.stringify({ command, params, issuedAt: new Date() }), 'EX', 300);
  await redis.rpush(`device:${deviceId}:commands`, commandId);
  res.json({ commandId, status: 'queued' });
};
module.exports = sendCommand;
