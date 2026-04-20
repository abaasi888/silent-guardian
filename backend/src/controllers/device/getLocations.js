const Location = require('../../models/Location');
const getLocations = async (req, res) => {
  const locations = await Location.find({ deviceId: req.params.deviceId, userId: req.user._id }).sort('-timestamp').limit(100);
  res.json(locations);
};
module.exports = getLocations;
