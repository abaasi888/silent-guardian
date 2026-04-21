/**
 * User Registration
 * POST /api/v1/auth/register
 * 
 * Creates a new user account, hashes password, sends verification email
 */

const User = require('../../models/User');
const { sendVerificationEmail } = require('../../services/emailService');
const { securityConfig } = require('../../config/security');
const logger = require('../../config/logger');
const crypto = require('crypto');

const register = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn(`Registration attempt with existing email: ${email}`);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Validate password strength
    const { isValid, errors } = securityConfig.validatePasswordStrength(password);
    if (!isValid) {
      return res.status(400).json({ error: 'Password validation failed', details: errors });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      fullName: fullName.trim(),
      phone,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
      kycStatus: 'pending',
      role: 'user'
    });

    await user.save();

    // Send verification email (don't await to avoid blocking response)
    sendVerificationEmail(email, verificationToken).catch(err => {
      logger.error(`Failed to send verification email to ${email}: ${err.message}`);
    });

    logger.info(`New user registered: ${email} (ID: ${user._id})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      userId: user._id,
      email: user.email
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to register user' });
  }
};

module.exports = register;