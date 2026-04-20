const cron = require('node-cron');
const Device = require('../models/Device');
const { createAlert } = require('../services/notificationService');
const checkInactiveDevices = async () => { const fiveMinutesAgo = new Date(Date.now() - 5 * 60000); const inactive = await Device.find({ lastSeen: { $lt: fiveMinutesAgo }, status: 'active' }); for (const device of inactive) { await createAlert(device.userId, device.deviceId, 'inactivity', 'Device has not reported location for 5 minutes'); } };
cron.schedule('*/5 * * * *', checkInactiveDevices);
module.exports = { checkInactiveDevices };
