const Payment = require('../../models/Payment');
const getBillingHistory = async (req, res) => { const payments = await Payment.find({ userId: req.user._id }).sort('-createdAt'); res.json(payments); };
module.exports = getBillingHistory;
