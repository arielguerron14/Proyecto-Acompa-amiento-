# Shared Security Middlewares

This module provides reusable security middlewares for the project:

- `rateLimiterRedis` — Redis-based rate limiter (per-IP and per-user)
- `corsMiddleware` — secure CORS configuration helper
- `jwtAuth` — JWT validation middleware (uses shared-auth `authService` if available; falls back to `jsonwebtoken`)
- `auditLogger` — audit logger (Winston) for suspicious access
- `firewall` — logical firewall to block internal routes and protect admin endpoints

Cloudflare: when using Cloudflare or other proxies, ensure your proxy sets `X-Forwarded-For` or `CF-Connecting-IP`. See section `Cloudflare and real IP` below.

Usage example (in `api-gateway/src/server.js`):

```javascript
const express = require('express');
const { corsMiddleware } = require('../../shared-security/src/middlewares/cors');
const { jwtAuth } = require('../../shared-security/src/middlewares/jwtAuth');
const rateLimiter = require('../../shared-security/src/middlewares/rateLimiterRedis');
const firewall = require('../../shared-security/src/middlewares/firewall');

const app = express();
app.use(corsMiddleware());
app.use(express.json());
app.use(jwtAuth());
app.use(rateLimiter({ windowSeconds: 60, maxRequests: 100 }));
app.use(firewall());
```

Cloudflare and real IP
- If behind Cloudflare, read client IP from `req.headers['cf-connecting-ip']` or `req.headers['x-forwarded-for']` (first IP).
- In Express, set `app.set('trust proxy', true)` so `req.ip` maps to the forwarded IP.
