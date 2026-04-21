/**
 * Forgot Password - Send Reset Email
 * POST /api/v1/auth/forgot-password
 * 
 * Generates password reset token and sends email
 */

const crypto = require('crypto');
const User = require('../../models/User');
const { sendPasswordResetEmail } = require('../../services/emailService');
const logger = require('../../config/logger');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // For security, don't reveal if user exists
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return res.json({ 
        success: true, 
        message: 'If an account exists with that email, a reset link has been sent.' 
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset email sent to ${email}`);

    res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    });
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

module.exports = forgotPassword;