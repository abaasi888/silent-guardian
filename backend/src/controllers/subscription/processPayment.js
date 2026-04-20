const Payment = require('../../models/Payment');
const Subscription = require('../../models/Subscription');
const { processStripePayment } = require('../../services/paymentService');
const processPayment = async (req, res) => {
  const { subscriptionId, paymentMethodNonce } = req.body;
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
  const amount = require('../../config/constants').SUBSCRIPTION_PLANS[subscription.planId.toUpperCase()].price;
  const paymentResult = await processStripePayment(amount, paymentMethodNonce, req.user.email);
  const payment = new Payment({ userId: req.user._id, subscriptionId, amount, currency: 'USD', method: 'stripe', status: paymentResult.success ? 'success' : 'failed', transactionId: paymentResult.transactionId });
  await payment.save();
  if (paymentResult.success) { subscription.status = 'active'; subscription.startDate = new Date(); subscription.endDate = new Date(Date.now() + 30*24*60*60*1000); await subscription.save(); res.json({ success: true, payment }); }
  else res.status(400).json({ success: false, error: 'Payment failed' });
};
module.exports = processPayment;
