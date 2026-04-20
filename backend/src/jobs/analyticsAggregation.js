const cron = require('node-cron');
const Location = require('../models/Location');
const aggregateAnalytics = async () => { const yesterday = new Date(Date.now() - 24 * 3600000); const stats = await Location.aggregate([{ $match: { timestamp: { $gte: yesterday } } }, { $group: { _id: '$deviceId', count: { $sum: 1 } } }]); console.log('Analytics aggregated', stats); };
cron.schedule('0 1 * * *', aggregateAnalytics);
module.exports = { aggregateAnalytics };
