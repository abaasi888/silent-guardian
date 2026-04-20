const { body } = require('express-validator');
const createSubscriptionValidator = [body('planId').isIn(['basic', 'premium', 'family']), body('paymentMethodId').notEmpty()];
module.exports = { createSubscriptionValidator };
