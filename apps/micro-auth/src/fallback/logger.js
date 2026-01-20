// Fallback logger
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args),
};

const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
};

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message,
    status: err.status || 500
  });
};

const notFound = (req, res) => {
  res.status(404).json({ error: 'Not found' });
};

module.exports = {
  logger,
  requestLogger,
  errorHandler,
  notFound
};
