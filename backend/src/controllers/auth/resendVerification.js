/**
 * Resend Verification Email
 * POST /api/v1/auth/resend-verification
 * 
 * Sends a new verification link to user's email
 */

const crypto = require('crypto');
const User = require('../../models/User');
const { sendVerificationEmail } = require('../../services/emailService');
const logger = require('../../config/logger');

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal user existence
      return res.json({
        success: true,
        message: 'If your email is registered and not verified, a new verification link has been sent.'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verificationToken;
    await user.save();

    // Resend email
    await sendVerificationEmail(email, verificationToken);

    logger.info(`Resent verification email to ${email}`);

    res.json({
      success: true,
      message: 'Verification email resent. Please check your inbox.'
    });
  } catch (error) {
    logger.error(`Resend verification error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

module.exports = resendVerification;