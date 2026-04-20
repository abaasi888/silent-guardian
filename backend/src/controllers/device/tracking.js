const Location = require('../../models/Location');
const Device = require('../../models/Device');
const redis = require('../../config/redis').getClient();
const { processLocation } = require('../../services/trackingService');
const { createAlert } = require('../../services/notificationService');
const submitLocation = async (req, res) => {
  const { deviceId, lat, lng, accuracy, speed, heading, isOffline } = req.body;
  const device = await Device.findOne({ deviceId, userId: req.user._id });
  if (!device) return res.status(403).json({ error: 'Device not owned' });
  const location = new Location({ deviceId, userId: req.user._id, lat, lng, accuracy, speed, heading, isOffline: isOffline || false });
  await location.save();
  device.lastLocation = { lat, lng, accuracy, timestamp: new Date() }; device.lastSeen = new Date(); await device.save();
  await redis.set(`device:${deviceId}:last`, JSON.stringify(device.lastLocation), 'EX', 3600);
  res.status(201).json({ message: 'Location saved' });
};
const getTrackingHistory = async (req, res) => {
  const { deviceId, from, to, limit = 100 } = req.query;
  const query = { deviceId, userId: req.user._id };
  if (from) query.timestamp = { $gte: new Date(from) };
  if (to) query.timestamp = { ...query.timestamp, $lte: new Date(to) };
  const locations = await Location.find(query).sort('-timestamp').limit(parseInt(limit));
  res.json(locations);
};
module.exports = { submitLocation, getTrackingHistory };
