/**
 * User Login
 * POST /api/v1/auth/login
 * 
 * Authenticates user, returns JWT access and refresh tokens
 */

const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const logger = require('../../config/logger');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      logger.warn(`Login blocked: Email not verified - ${email}`);
      return res.status(403).json({ error: 'Please verify your email before logging in' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Store refresh token in database
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    logger.info(`User logged in: ${email} (ID: ${user._id})`);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        stealthEnabled: user.stealthEnabled,
        isEmailVerified: user.isEmailVerified,
        kycStatus: user.kycStatus
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to login' });
  }
};

module.exports = login;