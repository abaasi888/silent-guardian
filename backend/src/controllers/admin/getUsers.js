/**
 * Get all users (Admin only)
 * GET /api/v1/admin/users
 * 
 * Returns paginated list of all users with their subscription and device counts
 */

const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const Device = require('../../models/Device');
const logger = require('../../config/logger');

const getUsers = async (req, res) => {
  try {
    // Verify admin role (already checked by middleware, but double-check)
    if (req.user.role !== 'admin') {
      logger.warn(`Non-admin user ${req.user._id} attempted to access admin users list`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    // Filtering parameters
    const { role, kycStatus, isEmailVerified, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified === 'true';
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute queries in parallel for efficiency
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken -resetToken -emailVerificationToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    // For each user, fetch subscription and device counts
    const userIds = users.map(u => u._id);
    const [subscriptions, deviceCounts] = await Promise.all([
      Subscription.find({ userId: { $in: userIds } }).select('userId status planId').lean(),
      Device.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ])
    ]);

    // Create maps for quick lookup
    const subMap = new Map();
    subscriptions.forEach(sub => {
      if (!subMap.has(sub.userId.toString())) subMap.set(sub.userId.toString(), []);
      subMap.get(sub.userId.toString()).push(sub);
    });
    
    const deviceCountMap = new Map();
    deviceCounts.forEach(dc => deviceCountMap.set(dc._id.toString(), dc.count));

    // Enrich user objects
    const enrichedUsers = users.map(user => ({
      ...user,
      subscriptions: subMap.get(user._id.toString()) || [],
      deviceCount: deviceCountMap.get(user._id.toString()) || 0
    }));

    logger.info(`Admin ${req.user._id} fetched users page ${page} (${totalUsers} total)`);

    res.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    logger.error(`Error in getUsers: ${error.message}`, { stack: error.stack, adminId: req.user._id });
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

module.exports = getUsers;