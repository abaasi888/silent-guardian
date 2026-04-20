const { body } = require('express-validator');
const locationValidator = [body('deviceId').notEmpty(), body('lat').isFloat({ min: -90, max: 90 }), body('lng').isFloat({ min: -180, max: 180 })];
module.exports = { locationValidator };
