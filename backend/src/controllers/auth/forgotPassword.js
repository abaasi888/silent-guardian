const crypto = require('crypto');
const User = require('../../models/User');
const { sendPasswordResetEmail } = require('../../services/emailService');
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetToken = resetToken; user.resetExpires = Date.now() + 3600000; await user.save();
  await sendPasswordResetEmail(email, resetToken);
  res.json({ message: 'Password reset email sent' });
};
module.exports = forgotPassword;
