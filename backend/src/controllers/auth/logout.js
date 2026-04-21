/**
 * User Logout
 * POST /api/v1/auth/logout
 * 
 * Invalidates refresh token and logs user out
 */

const logger = require('../../config/logger');

const logout = async (req, res) => {
  try {
    // Clear refresh token from database
    req.user.refreshToken = null;
    await req.user.save();

    logger.info(`User logged out: ${req.user.email} (ID: ${req.user._id})`);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to logout' });
  }
};

module.exports = logout;