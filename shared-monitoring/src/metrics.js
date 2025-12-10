const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// HTTP request duration histogram
const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// HTTP requests total counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code']
});

register.registerMetric(httpRequestDurationMs);
register.registerMetric(httpRequestsTotal);

function startDefaultMetrics() {
  // default metrics are already started by collectDefaultMetrics call
  return register;
}

function metricsMiddleware() {
  return (req, res, next) => {
    const end = httpRequestDurationMs.startTimer();
    res.on('finish', () => {
      const route = req.route && req.route.path ? req.route.path : req.path;
      const labels = { method: req.method, route, code: res.statusCode };
      httpRequestsTotal.inc(labels);
      end(labels);
    });
    next();
  };
}

async function metricsRoute(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
}

module.exports = { register, startDefaultMetrics, metricsMiddleware, metricsRoute };
