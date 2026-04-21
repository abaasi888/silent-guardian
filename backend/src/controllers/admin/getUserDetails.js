/**
 * Get detailed information about a specific user (Admin only)
 * GET /api/v1/admin/users/:userId
 */

const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const Device = require('../../models/Device');
const Payment = require('../../models/Payment');
const AuditLog = require('../../models/AuditLog');
const logger = require('../../config/logger');

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate MongoDB ObjectId format
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Fetch user with sensitive data excluded
    const user = await User.findById(userId)
      .select('-password -refreshToken -resetToken -emailVerificationToken')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch related data in parallel
    const [subscriptions, devices, payments, auditLogs] = await Promise.all([
      Subscription.find({ userId }).sort({ createdAt: -1 }).lean(),
      Device.find({ userId }).sort({ createdAt: -1 }).lean(),
      Payment.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      AuditLog.find({ userId }).sort({ timestamp: -1 }).limit(100).lean()
    ]);

    // Calculate additional stats
    const totalPayments = payments.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0);
    const activeDevices = devices.filter(d => d.status === 'active').length;
    const activeSubscription = subscriptions.find(s => s.status === 'active');

    const userDetails = {
      ...user,
      subscriptions,
      devices: {
        list: devices,
        count: devices.length,
        activeCount: activeDevices
      },
      payments: {
        list: payments,
        totalSpent: totalPayments,
        currency: 'USD'
      },
      auditLogs,
      activeSubscription,
      stats: {
        registeredAt: user.createdAt,
        lastLogin: user.lastLogin,
        emailVerified: user.isEmailVerified,
        kycStatus: user.kycStatus
      }
    };

    logger.info(`Admin ${req.user._id} fetched details for user ${userId}`);
    res.json(userDetails);
  } catch (error) {
    logger.error(`Error in getUserDetails: ${error.message}`, { stack: error.stack, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
};

module.exports = getUserDetails;