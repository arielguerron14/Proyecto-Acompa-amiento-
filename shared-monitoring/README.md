# Shared Monitoring

Provides Prometheus instrumentation helpers using `prom-client` and an Express middleware to collect HTTP metrics.

Usage:

- Install dependency in services: `npm install prom-client`
- Require and use the middleware: `const { metricsMiddleware, metricsRoute, startDefaultMetrics } = require('.../shared-monitoring/src/metrics');`

Start default process metrics with `startDefaultMetrics()` and add `app.use(metricsMiddleware())` and `app.get('/metrics', metricsRoute)`.
