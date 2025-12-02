function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
