const geolib = require('geolib');
const processLocation = (lat, lng, lastLat, lastLng) => {
  if (!lastLat) return { moved: false, distance: 0 };
  const distance = geolib.getDistance({ latitude: lat, longitude: lng }, { latitude: lastLat, longitude: lastLng });
  return { moved: distance > 10, distance };
};
module.exports = { processLocation };
