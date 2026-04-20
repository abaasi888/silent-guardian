const { body } = require('express-validator');
const registerValidator = [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 }), body('fullName').notEmpty().trim(), body('phone').matches(/^\+?[1-9]\d{1,14}$/)];
const loginValidator = [body('email').isEmail(), body('password').notEmpty()];
module.exports = { registerValidator, loginValidator };
