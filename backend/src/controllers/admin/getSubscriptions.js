/**
 * Get all subscriptions across all users (Admin only)
 * GET /api/v1/admin/subscriptions
 */

const Subscription = require('../../models/Subscription');
const User = require('../../models/User');
const logger = require('../../config/logger');

const getSubscriptions = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;
    
    // Filtering
    const { status, planId, userId, autoRenew } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (planId) filter.planId = planId;
    if (userId) filter.userId = userId;
    if (autoRenew !== undefined) filter.autoRenew = autoRenew === 'true';

    // Date range filters
    if (req.query.startDateFrom) filter.startDate = { $gte: new Date(req.query.startDateFrom) };
    if (req.query.startDateTo) filter.startDate = { ...filter.startDate, $lte: new Date(req.query.startDateTo) };
    if (req.query.endDateFrom) filter.endDate = { $gte: new Date(req.query.endDateFrom) };
    if (req.query.endDateTo) filter.endDate = { ...filter.endDate, $lte: new Date(req.query.endDateTo) };

    // Execute queries
    const [subscriptions, totalSubscriptions] = await Promise.all([
      Subscription.find(filter)
        .populate('userId', 'email fullName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter)
    ]);

    // Calculate summary statistics
    const summary = await Subscription.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        totalSubscriptions: { $sum: 1 },
        activeSubscriptions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        expiredSubscriptions: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
        cancelledSubscriptions: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        autoRenewEnabled: { $sum: { $cond: ['$autoRenew', 1, 0] } }
      }}
    ]);

    // Group by plan for breakdown
    const planBreakdown = await Subscription.aggregate([
      { $match: filter },
      { $group: {
        _id: '$planId',
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    logger.info(`Admin ${req.user._id} fetched subscriptions page ${page} (${totalSubscriptions} total)`);

    res.json({
      subscriptions,
      pagination: {
        page,
        limit,
        total: totalSubscriptions,
        pages: Math.ceil(totalSubscriptions / limit)
      },
      summary: summary[0] || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        expiredSubscriptions: 0,
        cancelledSubscriptions: 0,
        autoRenewEnabled: 0
      },
      planBreakdown
    });
  } catch (error) {
    logger.error(`Error in getSubscriptions: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve subscriptions' });
  }
};

module.exports = getSubscriptions;