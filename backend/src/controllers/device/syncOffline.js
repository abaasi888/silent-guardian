const OfflineQueue = require('../../models/OfflineQueue');
const syncOffline = async (req, res) => {
  const { deviceId, offlineData } = req.body;
  for (const entry of offlineData) { await OfflineQueue.create({ deviceId, userId: req.user._id, action: 'location', payload: entry, status: 'pending' }); }
  res.json({ queued: offlineData.length });
};
module.exports = syncOffline;
