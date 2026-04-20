const { SUBSCRIPTION_PLANS } = require('../../config/constants');
const getPlans = (req, res) => { res.json(SUBSCRIPTION_PLANS); };
module.exports = getPlans;
