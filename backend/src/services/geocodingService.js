const reverseGeocode = async (lat, lng) => ({ address: `${lat}, ${lng}`, city: 'Mock City', country: 'Mockland' });
module.exports = { reverseGeocode };
