/**
 * Update user information (Admin only)
 * PUT /api/v1/admin/users/:userId
 * 
 * Allows admin to modify user roles, KYC status, stealth mode, etc.
 */

const User = require('../../models/User');
const logger = require('../../config/logger');

// Allowed fields that admin can update
const ALLOWED_UPDATES = [
  'role',
  'kycStatus',
  'stealthEnabled',
  'isEmailVerified',
  'fullName',
  'phone'
];

// Validation rules for each field
const validateUpdate = (field, value) => {
  switch (field) {
    case 'role':
      if (!['user', 'admin'].includes(value)) {
        return 'Role must be either "user" or "admin"';
      }
      break;
    case 'kycStatus':
      if (!['pending', 'approved', 'rejected'].includes(value)) {
        return 'KYC status must be pending, approved, or rejected';
      }
      break;
    case 'stealthEnabled':
    case 'isEmailVerified':
      if (typeof value !== 'boolean') {
        return `${field} must be a boolean`;
      }
      break;
    case 'fullName':
      if (typeof value !== 'string' || value.trim().length < 2) {
        return 'Full name must be at least 2 characters';
      }
      break;
    case 'phone':
      if (!/^\+?[1-9]\d{1,14}$/.test(value)) {
        return 'Phone number must be in E.164 format';
      }
      break;
  }
  return null;
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate user ID
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Filter only allowed fields
    const updates = {};
    const invalidFields = [];
    
    for (const field of ALLOWED_UPDATES) {
      if (req.body[field] !== undefined) {
        const error = validateUpdate(field, req.body[field]);
        if (error) {
          invalidFields.push({ field, error });
        } else {
          updates[field] = field === 'fullName' ? req.body[field].trim() : req.body[field];
        }
      }
    }

    if (invalidFields.length > 0) {
      return res.status(400).json({ error: 'Validation failed', invalidFields });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Prevent admin from demoting themselves from admin role
    if (updates.role === 'user' && userId === req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot demote your own admin account' });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -resetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the update
    logger.info(`Admin ${req.user._id} updated user ${userId}: ${JSON.stringify(updates)}`);

    res.json({
      message: 'User updated successfully',
      user,
      updatedFields: Object.keys(updates)
    });
  } catch (error) {
    logger.error(`Error in updateUser: ${error.message}`, { stack: error.stack, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to update user' });
  }
};

module.exports = updateUser;