// backend/src/controllers/device/control.js
const redis = require('../../config/redis').getClient();
const logger = require('../../config/logger');

/**
 * Queue a command for a specific device.
 * The device polls Redis for pending commands.
 * POST /api/v1/devices/command
 * Body: { deviceId, command, params }
 */
const sendCommand = async (req, res) => {
  try {
    const { deviceId, command, params } = req.body;

    if (!deviceId || !command) {
      return res.status(400).json({ error: 'deviceId and command are required' });
    }

    // Create a unique command ID
    const commandId = `cmd:${deviceId}:${Date.now()}:${Math.random().toString(36).substr(2, 6)}`;

    const commandData = {
      commandId,
      command,
      params: params || {},
      issuedAt: new Date().toISOString(),
      issuedBy: req.user._id
    };

    // Store command details with TTL (5 minutes)
    await redis.set(commandId, JSON.stringify(commandData), 'EX', 300);
    // Push command ID to device's command list
    await redis.rpush(`device:${deviceId}:commands`, commandId);

    logger.info(`Command ${commandId} queued for device ${deviceId}`);

    res.json({
      success: true,
      commandId,
      status: 'queued'
    });
  } catch (error) {
    logger.error(`sendCommand error: ${error.message}`);
    res.status(500).json({ error: 'Failed to queue command' });
  }
};

module.exports = sendCommand;