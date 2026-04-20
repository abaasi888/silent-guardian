const User = require('../../models/User');
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ emailVerificationToken: token });
  if (!user) return res.status(400).json({ error: 'Invalid token' });
  user.isEmailVerified = true; user.emailVerificationToken = undefined; await user.save();
  res.json({ message: 'Email verified' });
};
module.exports = verifyEmail;
