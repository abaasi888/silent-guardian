// backend/src/controllers/device/simChange.js
const { reportSimChange } = require('../../services/simChangeService');
const logger = require('../../config/logger');

/**
 * Endpoint called by the hardware when a SIM card change is detected.
 * POST /api/v1/devices/sim-change
 * Body: { deviceId, newSimNumber, oldSimNumber }
 */
const simChangeReport = async (req, res) => {
  try {
    const { deviceId, newSimNumber, oldSimNumber } = req.body;

    if (!deviceId || !newSimNumber) {
      return res.status(400).json({ error: 'deviceId and newSimNumber are required' });
    }

    const result = await reportSimChange(deviceId, newSimNumber, oldSimNumber || 'unknown');
    if (!result) {
      return res.status(404).json({ error: 'Device not found or user missing phone number' });
    }

    logger.warn(`SIM change reported for device ${deviceId}: ${oldSimNumber} -> ${newSimNumber}`);
    res.json({ success: true, message: 'SIM change alert processed' });
  } catch (error) {
    logger.error(`simChangeReport error: ${error.message}`);
    res.status(500).json({ error: 'Failed to process SIM change report' });
  }
};

module.exports = simChangeReport;