const { reportSimChange } = require('../../services/simChangeService');
const simChangeReport = async (req, res) => {
  const { deviceId, newSimNumber, oldSimNumber } = req.body;
  const result = await reportSimChange(deviceId, newSimNumber, oldSimNumber);
  res.json(result);
};
module.exports = simChangeReport;
