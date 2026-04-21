/**
 * Admin dashboard summary statistics
 * GET /api/v1/admin/dashboard
 */

const User = require('../../models/User');
const Device = require('../../models/Device');
const Subscription = require('../../models/Subscription');
const Payment = require('../../models/Payment');
const Location = require('../../models/Location');
const Alert = require('../../models/Alert');
const logger = require('../../config/logger');

const getAdminDashboard = async (req, res) => {
  try {
    // Get date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Execute all aggregation queries in parallel
    const [
      totalUsers,
      totalDevices,
      activeSubscriptions,
      totalRevenue,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      usersGrowth,
      activeDevices,
      inactiveDevices,
      stolenDevices,
      locationsLast24h,
      unreadAlerts,
      recentPayments,
      subscriptionByPlan,
      devicesByStatus
    ] = await Promise.all([
      User.countDocuments(),
      Device.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: thisWeekStart } }),
      User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      User.aggregate([
        { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $count: 'lastMonth' }
      ]),
      Device.countDocuments({ status: 'active' }),
      Device.countDocuments({ status: 'inactive' }),
      Device.countDocuments({ status: 'stolen' }),
      Location.countDocuments({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Alert.countDocuments({ read: false }),
      Payment.find({ status: 'success' }).sort({ createdAt: -1 }).limit(10).populate('userId', 'email'),
      Subscription.aggregate([
        { $group: { _id: '$planId', count: { $sum: 1 } } }
      ]),
      Device.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Calculate user growth percentage
    const lastMonthUserCount = usersGrowth[0]?.lastMonth || 0;
    const currentMonthUserCount = newUsersThisMonth;
    const userGrowthPercent = lastMonthUserCount === 0 
      ? 100 
      : ((currentMonthUserCount - lastMonthUserCount) / lastMonthUserCount) * 100;

    // Format revenue
    const monthlyRevenue = totalRevenue[0]?.total || 0;
    const monthlyRevenueFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(monthlyRevenue);

    // Prepare plan breakdown
    const planMap = { basic: 0, premium: 0, family: 0 };
    subscriptionByPlan.forEach(item => {
      if (planMap[item._id] !== undefined) planMap[item._id] = item.count;
    });

    // Prepare status breakdown
    const statusMap = { active: 0, inactive: 0, stolen: 0, pending: 0 };
    devicesByStatus.forEach(item => {
      if (statusMap[item._id] !== undefined) statusMap[item._id] = item.count;
    });

    const dashboardData = {
      summary: {
        totalUsers,
        totalDevices,
        activeSubscriptions,
        monthlyRevenue: monthlyRevenueFormatted,
        monthlyRevenueRaw: monthlyRevenue,
        activeDevices,
        inactiveDevices,
        stolenDevices,
        locationsLast24h,
        unreadAlerts
      },
      growth: {
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        userGrowthPercent: Math.round(userGrowthPercent * 10) / 10
      },
      breakdown: {
        subscriptionsByPlan: planMap,
        devicesByStatus: statusMap
      },
      recentPayments: recentPayments.map(p => ({
        id: p._id,
        user: p.userId?.email || 'Unknown',
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt
      })),
      timestamp: now
    };

    logger.info(`Admin ${req.user._id} fetched dashboard summary`);

    res.json(dashboardData);
  } catch (error) {
    logger.error(`Error in getAdminDashboard: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
};

module.exports = getAdminDashboard;