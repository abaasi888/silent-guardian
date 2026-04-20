const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const { processStripePayment } = require('../services/paymentService');
const renewSubscriptions = async () => {
  const expiring = await Subscription.find({ status: 'active', endDate: { $lte: new Date(Date.now() + 24 * 3600000) }, autoRenew: true });
  for (const sub of expiring) { const amount = require('../config/constants').SUBSCRIPTION_PLANS[sub.planId.toUpperCase()].price; const payment = await processStripePayment(amount, sub.paymentMethodId, sub.userId); if (payment.success) { sub.startDate = new Date(); sub.endDate = new Date(Date.now() + 30 * 24 * 3600000); await sub.save(); } else { sub.status = 'expired'; await sub.save(); } }
};
cron.schedule('0 0 * * *', renewSubscriptions);
module.exports = { renewSubscriptions };
