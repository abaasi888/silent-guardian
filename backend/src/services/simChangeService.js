const Device = require('../models/Device');
const User = require('../models/User');
const { sendAlertSMS } = require('./smsService');
const logger = require('../config/logger');

const reportSimChange = async (deviceId, newSimNumber, oldSimNumber) => {
  const device = await Device.findOne({ deviceId });
  if (!device) return null;
  const user = await User.findById(device.userId);
  if (!user || !user.phone) return null;
  const message = `ALERT: SIM changed on device ${device.deviceName} (${deviceId}). Old: ${oldSimNumber}, New: ${newSimNumber}`;
  await sendAlertSMS(user.phone, message);
  logger.info(`SIM change reported for device ${deviceId}`);
  return { success: true };
};

module.exports = { reportSimChange };
