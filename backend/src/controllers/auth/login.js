const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isEmailVerified) return res.status(403).json({ error: 'Email not verified' });
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
    user.refreshToken = refreshToken; user.lastLogin = new Date(); await user.save();
    res.json({ accessToken, refreshToken, user: { id: user._id, email, fullName: user.fullName, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
module.exports = login;
