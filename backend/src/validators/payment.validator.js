const { body } = require('express-validator');
const paymentValidator = [body('subscriptionId').isMongoId(), body('paymentMethodNonce').notEmpty()];
module.exports = { paymentValidator };
