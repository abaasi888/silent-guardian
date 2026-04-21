// backend/src/controllers/device/hardware.js
const HardwareFingerprint = require('../../models/HardwareFingerprint');
const logger = require('../../config/logger');

/**
 * Store or update the hardware fingerprint for a device.
 * Used to detect tampering (e.g., SIM swap, app reinstallation).
 * POST /api/v1/devices/fingerprint
 * Body: { deviceId, fingerprint }
 */
const reportFingerprint = async (req, res) => {
  try {
    const { deviceId, fingerprint } = req.body;

    if (!deviceId || !fingerprint) {
      return res.status(400).json({ error: 'deviceId and fingerprint are required' });
    }

    // Check if a fingerprint already exists for this device and user
    let existing = await HardwareFingerprint.findOne({ deviceId, userId: req.user._id });

    if (existing) {
      // If fingerprint changed, log potential tampering
      if (existing.fingerprint !== fingerprint) {
        logger.warn(`Fingerprint mismatch for device ${deviceId}. Old: ${existing.fingerprint}, New: ${fingerprint}`);
        // Optionally create a tamper alert
        const TamperLog = require('../../models/TamperLog');
        await TamperLog.create({
          deviceId,
          userId: req.user._id,
          type: 'fingerprint_mismatch',
          details: { oldFingerprint: existing.fingerprint, newFingerprint: fingerprint }
        });
        existing.fingerprint = fingerprint;
        existing.alert = true;
        await existing.save();
      } else {
        // No change, just update timestamp
        existing.createdAt = new Date();
        await existing.save();
      }
    } else {
      // First time reporting fingerprint
      await HardwareFingerprint.create({
        deviceId,
        userId: req.user._id,
        fingerprint,
        alert: false
      });
    }

    res.json({ success: true, message: 'Fingerprint recorded' });
  } catch (error) {
    logger.error(`reportFingerprint error: ${error.message}`);
    res.status(500).json({ error: 'Failed to record fingerprint' });
  }
};

module.exports = reportFingerprint;