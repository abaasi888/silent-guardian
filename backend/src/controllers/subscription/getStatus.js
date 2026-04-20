const Subscription = require('../../models/Subscription');
const getStatus = async (req, res) => { const sub = await Subscription.findOne({ userId: req.user._id, status: 'active' }); res.json(sub || { status: 'none' }); };
module.exports = getStatus;
