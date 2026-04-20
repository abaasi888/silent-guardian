const mongoose = require('mongoose');
const fingerprintSchema = new mongoose.Schema({
  deviceId: { type: String, required: true }, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fingerprint: { type: String, required: true }, alert: { type: Boolean, default: false }, createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('HardwareFingerprint', fingerprintSchema);
