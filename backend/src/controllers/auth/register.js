const User = require('../../models/User');
const { sendVerificationEmail } = require('../../services/emailService');
const crypto = require('crypto');
const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({ email, password, fullName, phone, emailVerificationToken: verificationToken });
    await user.save();
    await sendVerificationEmail(email, verificationToken);
    res.status(201).json({ message: 'User registered. Please verify email.', userId: user._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
module.exports = register;
