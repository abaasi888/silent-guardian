const User = require('../../models/User');
const getUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = await User.find().select('-password -refreshToken');
  res.json(users);
};
module.exports = getUsers;
