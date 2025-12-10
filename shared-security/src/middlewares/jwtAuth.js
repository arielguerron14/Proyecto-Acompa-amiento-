const auditLogger = require('../utils/auditLogger');
let AuthService = null;
try { AuthService = require('../../shared-auth/src/services/authService'); } catch (e) { /* optional */ }
const jwt = require('jsonwebtoken');

/**
 * JWT validation middleware. If `shared-auth`'s `AuthService.verifyAccessToken` is available it will be used.
 * Otherwise falls back to `jsonwebtoken.verify` with `process.env.JWT_SECRET`.
 */
function jwtAuth(options = {}) {
  const { required = false } = options;

  return function (req, res, next) {
    try {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      let token = null;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else if (req.body && req.body.token) {
        token = req.body.token;
      }

      if (!token) {
        if (required) {
          auditLogger.warn('jwt_missing', { path: req.path, method: req.method, ip: req.ip });
          return res.status(401).json({ success: false, error: 'Token required' });
        }
        return next();
      }

      // Prefer shared auth service if available
      if (AuthService && typeof AuthService.verifyAccessToken === 'function') {
        try {
          const payload = AuthService.verifyAccessToken(token);
          req.user = payload;
          return next();
        } catch (err) {
          auditLogger.warn('jwt_invalid_shared_auth', { error: err && err.message });
          return res.status(401).json({ success: false, error: 'Invalid token' });
        }
      }

      // Fallback to jwt.verify
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        auditLogger.error('jwt_no_secret', { path: req.path });
        return res.status(500).json({ success: false, error: 'JWT verification not configured' });
      }

      jwt.verify(token, secret, (err, decoded) => {
        if (err) {
          auditLogger.warn('jwt_invalid', { error: err && err.message });
          return res.status(401).json({ success: false, error: 'Invalid token' });
        }
        req.user = decoded;
        next();
      });
    } catch (err) {
      auditLogger.error('jwt_middleware_error', { error: err && err.message });
      next(err);
    }
  };
}

module.exports = { jwtAuth };
