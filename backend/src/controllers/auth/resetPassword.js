/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 * 
 * Resets password using valid reset token
 */

const User = require('../../models/User');
const { securityConfig } = require('../../config/security');
const logger = require('../../config/logger');

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate password strength
    const { isValid, errors } = securityConfig.validatePasswordStrength(newPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Password validation failed', details: errors });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn(`Invalid or expired password reset token used`);
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetExpires = undefined;
    // Invalidate all refresh tokens for security
    user.refreshToken = null;
    await user.save();

    logger.info(`Password reset successfully for user ${user.email}`);

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = resetPassword;