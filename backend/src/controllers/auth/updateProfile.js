/**
 * Update User Profile
 * PUT /api/v1/auth/profile
 * 
 * Updates non-sensitive user information (fullName, phone)
 */

const logger = require('../../config/logger');

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    
    const updates = {};
    const errors = [];

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length < 2) {
        errors.push('Full name must be at least 2 characters');
      } else {
        updates.fullName = fullName.trim();
      }
    }

    if (phone !== undefined) {
      if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
        errors.push('Phone number must be in E.164 format (e.g., +1234567890)');
      } else {
        updates.phone = phone;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Apply updates
    Object.assign(req.user, updates);
    await req.user.save();

    logger.info(`Profile updated for user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName,
        phone: req.user.phone,
        role: req.user.role
      }
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = updateProfile;