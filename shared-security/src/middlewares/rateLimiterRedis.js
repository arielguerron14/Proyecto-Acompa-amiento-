const { client } = require('../../../database/redis/cache');
const auditLogger = require('../utils/auditLogger');

/**
 * Redis-backed rate limiter middleware.
 * Options:
 *  - windowSeconds
 *  - maxRequests
 *  - byUser (boolean) if true, counts by user when `req.user.userId` exists
 */
function rateLimiter(options = {}) {
  const { windowSeconds = 60, maxRequests = 100, byUser = true } = options;

  return async function (req, res, next) {
    try {
      // Resolve identifier: user if available, otherwise IP
      const userId = req.user && req.user.userId;
      const remoteIp = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '').split(',')[0].trim();
      const id = (byUser && userId) ? `user:${userId}` : `ip:${remoteIp || 'anon'}`;
      const key = `rl:${id}`;

      // Ensure redis client connected
      if (!client || !client.isOpen) {
        // Try to connect lazily
        try { await client.connect(); } catch (e) { /* ignore */ }
      }

      const current = await client.incr(key);
      if (current === 1) {
        await client.expire(key, windowSeconds);
      }

      if (current > maxRequests) {
        auditLogger.warn('rate_limit_exceeded', { id, ip: remoteIp, path: req.path, method: req.method });
        res.status(429).json({ success: false, error: 'Rate limit exceeded' });
        return;
      }

      next();
    } catch (err) {
      // On Redis error, fail open - allow requests
      auditLogger.error('rate_limiter_error', { error: err && err.message });
      next();
    }
  };
}

module.exports = rateLimiter;
