const HardwareFingerprint = require('../../models/HardwareFingerprint');
const reportFingerprint = async (req, res) => {
  const { deviceId, fingerprint } = req.body;
  await HardwareFingerprint.create({ deviceId, userId: req.user._id, fingerprint });
  res.json({ message: 'Fingerprint recorded' });
};
module.exports = reportFingerprint;
