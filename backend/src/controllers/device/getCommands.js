const redis = require('../../config/redis').getClient();
const getCommands = async (req, res) => {
  const commands = await redis.lrange(`device:${req.params.deviceId}:commands`, 0, -1);
  const commandDetails = await Promise.all(commands.map(async id => { const data = await redis.get(id); return data ? JSON.parse(data) : null; }));
  res.json(commandDetails.filter(Boolean));
};
module.exports = getCommands;
