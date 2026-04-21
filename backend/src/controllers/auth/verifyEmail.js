/**
 * Verify Email Address
 * GET /api/v1/auth/verify-email?token=...
 * 
 * Activates user account after email verification
 */

const User = require('../../models/User');
const logger = require('../../config/logger');

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      logger.warn(`Invalid email verification token used`);
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    logger.info(`Email verified for user ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    logger.error(`Email verification error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to verify email' });
  }
};

module.exports = verifyEmail;