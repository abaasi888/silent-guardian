const mongoose = require('mongoose');
const locationSchema = new mongoose.Schema({
  deviceId: { type: String, ref: 'Device', required: true }, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lat: { type: Number, required: true }, lng: { type: Number, required: true }, accuracy: Number, speed: Number, heading: Number,
  timestamp: { type: Date, default: Date.now, index: true }, isOffline: { type: Boolean, default: false }
});
locationSchema.index({ deviceId: 1, timestamp: -1 });
module.exports = mongoose.model('Location', locationSchema);
