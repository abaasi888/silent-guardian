const mongoose = require('mongoose');
const deviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceName: { type: String, required: true }, deviceId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'inactive', 'stolen', 'pending'], default: 'pending' },
  lastSeen: Date, lastLocation: { lat: Number, lng: Number, accuracy: Number, timestamp: Date },
  hardwareInfo: { manufacturer: String, model: String, os: String }, stealthMode: { type: Boolean, default: false }, createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Device', deviceSchema);
