/**
 * Get all payment transactions (Admin only)
 * GET /api/v1/admin/payments
 */

const Payment = require('../../models/Payment');
const User = require('../../models/User');
const logger = require('../../config/logger');

const getPayments = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    
    // Filtering
    const { status, method, userId, fromDate, toDate, minAmount, maxAmount } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (userId) filter.userId = userId;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }
    if (fromDate) filter.createdAt = { $gte: new Date(fromDate) };
    if (toDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(toDate) };

    // Execute queries
    const [payments, totalPayments, summary] = await Promise.all([
      Payment.find(filter)
        .populate('userId', 'email fullName phone')
        .populate('subscriptionId', 'planId status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          totalAmount: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] } },
          totalTransactions: { $sum: 1 },
          successfulTransactions: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
          failedTransactions: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pendingTransactions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          avgAmount: { $avg: '$amount' }
        }}
      ])
    ]);

    // Daily breakdown for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyBreakdown = await Payment.aggregate([
      { $match: { ...filter, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    logger.info(`Admin ${req.user._id} fetched payments page ${page} (${totalPayments} total)`);

    res.json({
      payments,
      pagination: {
        page,
        limit,
        total: totalPayments,
        pages: Math.ceil(totalPayments / limit)
      },
      summary: summary[0] || {
        totalAmount: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        pendingTransactions: 0,
        avgAmount: 0
      },
      dailyBreakdown
    });
  } catch (error) {
    logger.error(`Error in getPayments: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
};

module.exports = getPayments;