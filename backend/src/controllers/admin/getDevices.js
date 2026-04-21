/**
 * Get all devices across all users (Admin only)
 * GET /api/v1/admin/devices
 */

const Device = require('../../models/Device');
const User = require('../../models/User');
const logger = require('../../config/logger');

const getDevices = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;
    
    // Filtering
    const { status, userId, search, stealthMode } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (stealthMode !== undefined) filter.stealthMode = stealthMode === 'true';
    if (search) {
      filter.$or = [
        { deviceName: { $regex: search, $options: 'i' } },
        { deviceId: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute queries
    const [devices, totalDevices] = await Promise.all([
      Device.find(filter)
        .populate('userId', 'email fullName phone role')
        .sort({ lastSeen: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Device.countDocuments(filter)
    ]);

    // Add additional calculated fields
    const enrichedDevices = devices.map(device => ({
      ...device,
      isOnline: device.lastSeen && (new Date() - new Date(device.lastSeen)) < 5 * 60 * 1000, // Last 5 minutes
      lastSeenAgo: device.lastSeen ? Math.floor((new Date() - new Date(device.lastSeen)) / 60000) : null
    }));

    logger.info(`Admin ${req.user._id} fetched devices page ${page} (${totalDevices} total)`);

    res.json({
      devices: enrichedDevices,
      pagination: {
        page,
        limit,
        total: totalDevices,
        pages: Math.ceil(totalDevices / limit)
      },
      filters: { status, userId, search, stealthMode }
    });
  } catch (error) {
    logger.error(`Error in getDevices: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to retrieve devices' });
  }
};

module.exports = getDevices;