const User = require('../../models/User');
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({ resetToken: token, resetExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  user.password = newPassword; user.resetToken = undefined; user.resetExpires = undefined; await user.save();
  res.json({ message: 'Password updated' });
};
module.exports = resetPassword;
