// backend/src/controllers/device/syncOffline.js
const OfflineQueue = require('../../models/OfflineQueue');
const logger = require('../../config/logger');

/**
 * Receive a batch of offline location entries from a device
 * and store them in the offline queue for later processing.
 * POST /api/v1/devices/sync-offline
 * Body: { deviceId, offlineData: [ {lat, lng, timestamp, ...}, ... ] }
 */
const syncOffline = async (req, res) => {
  try {
    const { deviceId, offlineData } = req.body;

    if (!deviceId || !Array.isArray(offlineData) || offlineData.length === 0) {
      return res.status(400).json({ error: 'deviceId and non-empty offlineData array are required' });
    }

    // Verify device ownership
    const Device = require('../../models/Device');
    const device = await Device.findOne({ deviceId, userId: req.user._id });
    if (!device) {
      return res.status(403).json({ error: 'Device not owned by you' });
    }

    let inserted = 0;
    for (const entry of offlineData) {
      // Basic validation
      if (entry.lat && entry.lng) {
        await OfflineQueue.create({
          deviceId,
          userId: req.user._id,
          action: 'location',
          payload: entry,
          status: 'pending',
          createdAt: entry.timestamp ? new Date(entry.timestamp) : new Date()
        });
        inserted++;
      }
    }

    logger.info(`Synced ${inserted} offline entries for device ${deviceId}`);

    res.json({
      success: true,
      received: offlineData.length,
      queued: inserted
    });
  } catch (error) {
    logger.error(`syncOffline error: ${error.message}`);
    res.status(500).json({ error: 'Failed to sync offline data' });
  }
};

module.exports = syncOffline;