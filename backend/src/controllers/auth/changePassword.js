/**
 * Change Password
 * PUT /api/v1/auth/change-password
 * 
 * Allows authenticated user to change their password after verifying old password
 */

const { securityConfig } = require('../../config/security');
const logger = require('../../config/logger');

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both old and new passwords are required' });
    }

    // Verify old password
    const isMatch = await req.user.comparePassword(oldPassword);
    if (!isMatch) {
      logger.warn(`Failed password change attempt for user ${req.user.email}: incorrect old password`);
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password strength
    const { isValid, errors } = securityConfig.validatePasswordStrength(newPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'New password validation failed', details: errors });
    }

    // Update password
    req.user.password = newPassword;
    // Invalidate all refresh tokens for security
    req.user.refreshToken = null;
    await req.user.save();

    logger.info(`Password changed for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.'
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to change password' });
  }
};

module.exports = changePassword;