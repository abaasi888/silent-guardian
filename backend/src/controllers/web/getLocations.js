const Location = require('../../models/Location');
const getWebLocations = async (req, res) => {
  const locations = await Location.find({ deviceId: req.query.deviceId, userId: req.user._id }).sort('-timestamp').limit(500);
  res.json(locations);
};
module.exports = getWebLocations;
