const generateHardwareId = () => 'HW-' + Math.random().toString(36).substr(2, 9);
const verifyFingerprint = (stored, current) => stored === current;
module.exports = { generateHardwareId, verifyFingerprint };
