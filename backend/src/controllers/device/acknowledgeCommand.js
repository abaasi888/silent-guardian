// backend/src/controllers/device/acknowledgeCommand.js
const redis = require('../../config/redis').getClient();
const logger = require('../../config/logger');

/**
 * Device acknowledges that a command has been processed.
 * Deletes the command from Redis.
 * POST /api/v1/devices/:deviceId/ack
 * Body: { commandId }
 */
const acknowledgeCommand = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { commandId } = req.body;

    if (!commandId) {
      return res.status(400).json({ error: 'commandId is required' });
    }

    // Remove command data
    await redis.del(commandId);
    // Remove command ID from the device's list
    await redis.lrem(`device:${deviceId}:commands`, 0, commandId);

    logger.debug(`Command ${commandId} acknowledged by device ${deviceId}`);

    res.json({
      success: true,
      message: 'Command acknowledged and removed'
    });
  } catch (error) {
    logger.error(`acknowledgeCommand error: ${error.message}`);
    res.status(500).json({ error: 'Failed to acknowledge command' });
  }
};

module.exports = acknowledgeCommand;