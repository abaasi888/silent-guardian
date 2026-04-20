const Location = require('../models/Location');
const getDailyActivity = async (userId, deviceId) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000);
  const locations = await Location.aggregate([{ $match: { userId, deviceId, timestamp: { $gte: sevenDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  return locations;
};
module.exports = { getDailyActivity };
