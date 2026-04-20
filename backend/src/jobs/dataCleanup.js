const cron = require('node-cron');
const Location = require('../models/Location');
const Alert = require('../models/Alert');
const cleanOldData = async () => { const oneMonthAgo = new Date(Date.now() - 30 * 24 * 3600000); await Location.deleteMany({ timestamp: { $lt: oneMonthAgo } }); await Alert.deleteMany({ createdAt: { $lt: oneMonthAgo } }); };
cron.schedule('0 2 * * *', cleanOldData);
module.exports = { cleanOldData };
