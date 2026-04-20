const mongoose = require('mongoose');
const alertSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, deviceId: String, type: String, message: String, read: { type: Boolean, default: false }, createdAt: { type: Date, default: Date.now, expires: 2592000 }
});
module.exports = mongoose.model('Alert', alertSchema);
