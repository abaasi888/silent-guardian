const User = require('../../models/User');
const getUserDetails = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};
module.exports = getUserDetails;
