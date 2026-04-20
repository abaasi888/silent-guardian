const Subscription = require('../../models/Subscription');
const cancelSubscription = async (req, res) => {
  const sub = await Subscription.findOne({ userId: req.user._id, status: 'active' });
  if (!sub) return res.status(404).json({ error: 'No active subscription' });
  sub.status = 'cancelled'; sub.autoRenew = false; await sub.save(); res.json({ message: 'Subscription cancelled' });
};
module.exports = cancelSubscription;
