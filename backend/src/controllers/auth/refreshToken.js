const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) throw new Error();
    const newAccessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken: newAccessToken });
  } catch (err) { res.status(403).json({ error: 'Invalid refresh token' }); }
};
module.exports = refreshToken;
