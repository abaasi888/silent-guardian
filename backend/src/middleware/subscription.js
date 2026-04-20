const User = require('../models/User');
const requireActiveSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('subscription');
    if (!user.subscription || user.subscription.status !== 'active') return res.status(403).json({ error: 'Active subscription required' });
    next();
  } catch (error) { res.status(500).json({ error: error.message }); }
};
const requireFeature = (feature) => async (req, res, next) => {
  const user = await User.findById(req.user._id).populate('subscription');
  const plan = user.subscription?.planId;
  const features = require('../config/constants').SUBSCRIPTION_PLANS[plan?.toUpperCase()]?.features || [];
  if (!features.includes(feature)) return res.status(403).json({ error: `Feature "${feature}" requires higher plan` });
  next();
};
module.exports = { requireActiveSubscription, requireFeature };
