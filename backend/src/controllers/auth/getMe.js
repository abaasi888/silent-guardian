/**
 * Get Current User Profile
 * GET /api/v1/auth/me
 * 
 * Returns authenticated user's data (excluding sensitive fields)
 */

const logger = require('../../config/logger');

const getMe = async (req, res) => {
  try {
    // User is already attached to request by auth middleware
    const user = req.user.toObject ? req.user.toObject() : req.user;
    
    // Remove sensitive fields
    delete user.password;
    delete user.refreshToken;
    delete user.resetToken;
    delete user.emailVerificationToken;

    logger.debug(`Profile accessed for user ${user.email}`);

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error(`GetMe error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
};

module.exports = getMe;