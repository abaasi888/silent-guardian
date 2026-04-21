// backend/src/controllers/device/getCommands.js
const redis = require('../../config/redis').getClient();
const logger = require('../../config/logger');

/**
 * Get all pending commands for a device (used by hardware to poll).
 * GET /api/v1/devices/:deviceId/commands
 */
const getCommands = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Get list of command IDs from Redis list
    const commandIds = await redis.lrange(`device:${deviceId}:commands`, 0, -1);
    if (!commandIds || commandIds.length === 0) {
      return res.json({ success: true, commands: [] });
    }

    // Fetch full command data for each ID
    const commands = [];
    for (const cmdId of commandIds) {
      const data = await redis.get(cmdId);
      if (data) {
        commands.push(JSON.parse(data));
      } else {
        // Clean up stale references
        await redis.lrem(`device:${deviceId}:commands`, 0, cmdId);
      }
    }

    res.json({
      success: true,
      deviceId,
      pendingCount: commands.length,
      commands
    });
  } catch (error) {
    logger.error(`getCommands error: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve commands' });
  }
};

module.exports = getCommands;