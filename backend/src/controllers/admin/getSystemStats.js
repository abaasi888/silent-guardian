const os = require('os');
const getSystemStats = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const stats = { uptime: process.uptime(), memoryUsage: process.memoryUsage(), cpuCount: os.cpus().length, loadAverage: os.loadavg() };
  res.json(stats);
};
module.exports = getSystemStats;
