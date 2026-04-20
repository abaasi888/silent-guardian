const Payment = require('../../models/Payment');
const getPayments = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const payments = await Payment.find().populate('userId', 'email');
  res.json(payments);
};
module.exports = getPayments;
