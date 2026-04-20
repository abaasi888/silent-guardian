const Subscription = require('../../models/Subscription');
const { SUBSCRIPTION_PLANS } = require('../../config/constants');
const createSubscription = async (req, res) => {
  const { planId, paymentMethodId } = req.body;
  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
  if (!plan) return res.status(400).json({ error: 'Invalid plan' });
  const subscription = new Subscription({ userId: req.user._id, planId, status: 'pending', paymentMethodId });
  await subscription.save();
  res.json({ subscriptionId: subscription._id, clientSecret: 'simulated_secret' });
};
module.exports = createSubscription;
