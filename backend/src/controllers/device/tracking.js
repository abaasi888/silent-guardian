// backend/src/controllers/device/tracking.js
const Location = require('../../models/Location');
const Device = require('../../models/Device');
const redis = require('../../config/redis').getClient();
const { processLocation } = require('../../services/trackingService');
const { createAlert } = require('../../services/notificationService');
const logger = require('../../config/logger');

/**
 * Submit a new location point from a device.
 * Validates device ownership, updates last location, caches in Redis,
 * and triggers geofence/alert checks.
 * POST /api/v1/devices/location
 */
const submitLocation = async (req, res) => {
  try {
    const { deviceId, lat, lng, accuracy, speed, heading, isOffline } = req.body;

    // Validate required fields
    if (!deviceId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'deviceId, lat, lng are required' });
    }
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'lat must be a number between -90 and 90' });
    }
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'lng must be a number between -180 and 180' });
    }

    // Verify device belongs to the authenticated user
    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(403).json({ error: 'Device not found or not owned by you' });
    }

    // Create location document
    const location = new Location({
      deviceId,
      userId: req.user._id,
      lat,
      lng,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
      timestamp: new Date(),
      isOffline: isOffline === true
    });
    await location.save();

    // Update device's last known location and lastSeen timestamp
    const now = new Date();
    device.lastLocation = { lat, lng, accuracy, timestamp: now };
    device.lastSeen = now;
    await device.save();

    // Cache last location in Redis for quick access (expires in 1 hour)
    await redis.set(
      `device:${deviceId}:last`,
      JSON.stringify(device.lastLocation),
      'EX',
      3600
    );

    // Optional: detect movement and generate alert (if significant movement)
    if (device.lastLocation && device.lastLocation.lat && device.lastLocation.lng) {
      const prevLat = device.lastLocation.lat;
      const prevLng = device.lastLocation.lng;
      const { moved, distance } = processLocation(lat, lng, prevLat, prevLng);
      if (moved && distance > 100) { // >100 meters
        await createAlert(
          req.user._id,
          deviceId,
          'movement',
          `Device ${device.deviceName} moved ${Math.round(distance)} meters`
        );
      }
    }

    logger.debug(`Location saved for device ${deviceId}: ${lat},${lng}`);
    res.status(201).json({ success: true, message: 'Location saved' });
  } catch (error) {
    logger.error(`submitLocation error: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get tracking history for a specific device with optional date filters.
 * GET /api/v1/devices/history?deviceId=xxx&from=2025-01-01&to=2025-01-31&limit=100
 */
const getTrackingHistory = async (req, res) => {
  try {
    const { deviceId, from, to, limit = 100 } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId query parameter is required' });
    }

    // Verify ownership
    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(403).json({ error: 'Device not found or not owned' });
    }

    // Build query
    const query = { deviceId, userId: req.user._id };
    if (from) query.timestamp = { $gte: new Date(from) };
    if (to) query.timestamp = { ...query.timestamp, $lte: new Date(to) };

    const locations = await Location.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: locations.length,
      locations
    });
  } catch (error) {
    logger.error(`getTrackingHistory error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
};

module.exports = { submitLocation, getTrackingHistory };