const mongoose = require('mongoose');
const offlineQueueSchema = new mongoose.Schema({
  deviceId: String, userId: mongoose.Schema.Types.ObjectId, action: String, payload: mongoose.Schema.Types.Mixed,
  retries: { type: Number, default: 0 }, status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' }, createdAt: { type: Date, default: Date.now, expires: 604800 }
});
module.exports = mongoose.model('OfflineQueue', offlineQueueSchema);
