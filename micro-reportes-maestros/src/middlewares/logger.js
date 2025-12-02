const morgan = require('morgan');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const requestLogger = morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
});

module.exports = { requestLogger, logger };
