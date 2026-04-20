const Location = require('../../models/Location');
const getReports = async (req, res) => {
  const { deviceId, format = 'json' } = req.query;
  const locations = await Location.find({ deviceId, userId: req.user._id }).sort('timestamp');
  if (format === 'csv') { let csv = 'lat,lng,timestamp\n'; locations.forEach(l => csv += `${l.lat},${l.lng},${l.timestamp}\n`); res.setHeader('Content-Type', 'text/csv'); return res.send(csv); }
  res.json(locations);
};
module.exports = getReports;
