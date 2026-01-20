function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  // eslint-disable-next-line no-console
  console.error('❌ Error Handler:', err.message);
  console.error('Stack trace:', err.stack);
  console.error('Request:', req.method, req.url);
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
