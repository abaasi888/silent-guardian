const app = require('./app');
const logger = require('./config/logger');
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => { logger.info(`Server running on port ${PORT}`); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled Rejection:', err); server.close(() => process.exit(1)); });
