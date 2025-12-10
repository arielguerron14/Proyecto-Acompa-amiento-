const auditLogger = require('../utils/auditLogger');

/**
 * Simple logical firewall middleware.
 * - Blocks routes under `/internal` unless `X-Internal-Token` header matches `INTERNAL_TOKEN` env var.
 * - Protects `/admin` paths: requires `req.user.roles` to include `admin`.
 */
function firewall(options = {}) {
  const internalToken = process.env.INTERNAL_TOKEN;

  return function (req, res, next) {
    try {
      const path = req.path || req.originalUrl || '';

      // Block internal routes
      if (path.startsWith('/internal')) {
        const provided = req.headers['x-internal-token'];
        if (!internalToken || !provided || provided !== internalToken) {
          auditLogger.warn('firewall_block_internal', { path, ip: req.ip });
          return res.status(403).json({ success: false, error: 'Forbidden' });
        }
      }

      // Protect admin endpoints
      if (path.startsWith('/admin')) {
        const roles = (req.user && req.user.roles) || [];
        if (!roles.includes('admin')) {
          auditLogger.warn('firewall_block_admin', { path, ip: req.ip, user: req.user && req.user.userId });
          return res.status(403).json({ success: false, error: 'Admin access required' });
        }
      }

      next();
    } catch (err) {
      auditLogger.error('firewall_error', { error: err && err.message });
      next(err);
    }
  };
}

module.exports = firewall;
