const Subscription = require('../../models/Subscription');
const getSubscriptions = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const subs = await Subscription.find().populate('userId', 'email');
  res.json(subs);
};
module.exports = getSubscriptions;
