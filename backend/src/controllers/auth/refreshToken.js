/**
 * Refresh Access Token
 * POST /api/v1/auth/refresh-token
 * 
 * Generates a new access token using a valid refresh token
 */

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const logger = require('../../config/logger');

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      logger.warn(`Invalid refresh token: ${err.message}`);
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Find user and validate stored refresh token
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      logger.warn(`Refresh token mismatch for user ${decoded.userId}`);
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.debug(`Access token refreshed for user ${user.email}`);

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

module.exports = refreshToken;