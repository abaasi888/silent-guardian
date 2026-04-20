const OfflineQueue = require('../models/OfflineQueue');
const processOfflineQueue = async () => {
  const pending = await OfflineQueue.find({ status: 'pending' }).limit(100);
  for (const item of pending) { try { item.status = 'processed'; await item.save(); } catch (err) { item.retries++; if (item.retries >= 3) item.status = 'failed'; await item.save(); } }
};
module.exports = { processOfflineQueue };
