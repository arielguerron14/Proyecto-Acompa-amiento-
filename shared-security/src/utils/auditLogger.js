const { createLogger, format, transports } = require('winston');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');

const auditLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(logDir, 'audit.log'), maxsize: 5 * 1024 * 1024 }),
    new transports.Console({ format: format.simple() })
  ]
});

module.exports = auditLogger;
