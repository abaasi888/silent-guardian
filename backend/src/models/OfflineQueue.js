const mongoose = require('mongoose');
const offlineQueueSchema = new mongoose.Schema({
  deviceId: String,
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  payload: mongoose.Schema.Types.Mixed,
  retries: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now, index: true }
});
const maxDays = parseInt(process.env.OFFLINE_QUEUE_MAX_DAYS) || 60;
offlineQueueSchema.index({ createdAt: 1 }, { expireAfterSeconds: maxDays * 86400 });
module.exports = mongoose.model('OfflineQueue', offlineQueueSchema);
