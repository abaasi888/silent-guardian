const mongoose = require('mongoose');
const tamperLogSchema = new mongoose.Schema({
  deviceId: String, userId: mongoose.Schema.Types.ObjectId, type: String, details: mongoose.Schema.Types.Mixed, timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('TamperLog', tamperLogSchema);
