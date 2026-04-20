const Alert = require('../models/Alert');
const { sendAlertSMS } = require('./smsService');
const User = require('../models/User');
const createAlert = async (userId, deviceId, type, message) => {
  const alert = new Alert({ userId, deviceId, type, message }); await alert.save();
  const user = await User.findById(userId); if (user && user.phone) await sendAlertSMS(user.phone, message);
  return alert;
};
module.exports = { createAlert };
