const User = require('../../models/User');
const updateUser = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { role, kycStatus, stealthEnabled } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (role) user.role = role; if (kycStatus) user.kycStatus = kycStatus; if (stealthEnabled !== undefined) user.stealthEnabled = stealthEnabled;
  await user.save(); res.json(user);
};
module.exports = updateUser;
