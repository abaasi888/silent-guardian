/**
 * Delete a user and all associated data (Admin only)
 * DELETE /api/v1/admin/users/:userId
 * 
 * This is a soft delete by default, but supports hard delete with query param ?permanent=true
 */

const User = require('../../models/User');
const Device = require('../../models/Device');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const Location = require('../../models/Location');
const Alert = require('../../models/Alert');
const AuditLog = require('../../models/AuditLog');
const HardwareFingerprint = require('../../models/HardwareFingerprint');
const OfflineQueue = require('../../models/OfflineQueue');
const logger = require('../../config/logger');

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const permanent = req.query.permanent === 'true';
    
    // Validate user ID
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(403).json({ error: 'You cannot delete your own admin account' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (permanent) {
      // HARD DELETE - remove all user data from database
      const results = await Promise.all([
        User.deleteOne({ _id: userId }),
        Device.deleteMany({ userId }),
        Subscription.deleteMany({ userId }),
        Payment.deleteMany({ userId }),
        Location.deleteMany({ userId }),
        Alert.deleteMany({ userId }),
        AuditLog.deleteMany({ userId }),
        HardwareFingerprint.deleteMany({ userId }),
        OfflineQueue.deleteMany({ userId })
      ]);

      const deletedCounts = {
        users: results[0].deletedCount,
        devices: results[1].deletedCount,
        subscriptions: results[2].deletedCount,
        payments: results[3].deletedCount,
        locations: results[4].deletedCount,
        alerts: results[5].deletedCount,
        auditLogs: results[6].deletedCount,
        fingerprints: results[7].deletedCount,
        offlineQueues: results[8].deletedCount
      };

      logger.warn(`Admin ${req.user._id} PERMANENTLY DELETED user ${userId} (${user.email}) with all associated data`, deletedCounts);

      res.json({
        message: 'User and all associated data permanently deleted',
        deletedCounts
      });
    } else {
      // SOFT DELETE - mark as deleted but keep data for compliance/audit
      // Add a deletedAt field to user schema (assuming it exists)
      await User.findByIdAndUpdate(userId, { 
        deletedAt: new Date(),
        email: `${user.email}.deleted.${Date.now()}`,
        isEmailVerified: false
      });

      // Deactivate all devices
      await Device.updateMany({ userId }, { status: 'inactive' });

      // Cancel any active subscriptions
      await Subscription.updateMany(
        { userId, status: 'active' },
        { status: 'cancelled', autoRenew: false }
      );

      logger.warn(`Admin ${req.user._id} soft-deleted user ${userId} (${user.email})`);

      res.json({
        message: 'User soft-deleted successfully. Data retained for compliance.',
        userId,
        deletedAt: new Date()
      });
    }
  } catch (error) {
    logger.error(`Error in deleteUser: ${error.message}`, { stack: error.stack, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = deleteUser;