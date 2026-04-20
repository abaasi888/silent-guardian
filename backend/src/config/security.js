const bcrypt = require('bcryptjs');
const securityConfig = { saltRounds: 12, corsOptions: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true } };
module.exports = { securityConfig, bcrypt };
