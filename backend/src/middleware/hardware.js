const HardwareFingerprint = require('../models/HardwareFingerprint');
const extractFingerprint = (req, res, next) => {
  req.hardwareFingerprint = { userAgent: req.headers['user-agent'], ip: req.ip };
  next();
};
const validateFingerprint = async (req, res, next) => {
  const deviceId = req.params.deviceId || req.body.deviceId;
  const stored = await HardwareFingerprint.findOne({ deviceId, userId: req.user._id });
  if (stored && stored.fingerprint !== req.hardwareFingerprint.userAgent) {
    await HardwareFingerprint.create({ deviceId, fingerprint: req.hardwareFingerprint.userAgent, userId: req.user._id, alert: true });
    const TamperLog = require('../models/TamperLog');
    await TamperLog.create({ deviceId, userId: req.user._id, type: 'fingerprint_mismatch' });
  }
  next();
};
module.exports = { extractFingerprint, validateFingerprint };
