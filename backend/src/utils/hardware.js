const os = require('os');
const getSystemFingerprint = () => ({ hostname: os.hostname(), platform: os.platform(), cpus: os.cpus().length, totalMemory: os.totalmem() });
module.exports = { getSystemFingerprint };
