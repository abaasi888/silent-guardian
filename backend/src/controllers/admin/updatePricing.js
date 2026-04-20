const updatePricing = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { basic, premium, family } = req.body;
  res.json({ message: 'Pricing updated (mock)', newPrices: { basic, premium, family } });
};
module.exports = updatePricing;
