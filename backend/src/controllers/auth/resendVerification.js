const User = require('../../models/User');
const { sendVerificationEmail } = require('../../services/emailService');
const crypto = require('crypto');
const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isEmailVerified) return res.status(400).json({ error: 'Already verified' });
  const token = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = token; await user.save();
  await sendVerificationEmail(email, token);
  res.json({ message: 'Verification email resent' });
};
module.exports = resendVerification;
