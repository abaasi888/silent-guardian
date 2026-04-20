const twilio = require('twilio')(process.env.SMS_API_KEY, process.env.SMS_API_SECRET);
const sendAlertSMS = async (to, message) => { try { await twilio.messages.create({ body: message, from: '+1234567890', to }); } catch (err) { console.error('SMS failed', err); } };
module.exports = { sendAlertSMS };
