const http = require('http');
const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:8080';
const gatewayAuth = require('../../api-gateway/src/services/authService');
const sharedAuth = require('../../shared-auth/src/services/authService');

function request(path, method = 'POST', body = null, extraHeaders = {}) {
  const url = new URL(path, GATEWAY);
  const data = body ? JSON.stringify(body) : null;
  const opts = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname + url.search,
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
  Object.keys(extraHeaders || {}).forEach(k => opts.headers[k] = extraHeaders[k]);

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (err) {
          reject(new Error('Invalid JSON response: ' + err.message + '\n' + body));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  try {
    // Generate token locally using shared-auth
    const { accessToken } = sharedAuth.generateTokenPair('EST001', 'estudiante', 'estudiante@example.com');
    console.log('Generated token (truncated):', accessToken.slice(0, 30) + '...');

    console.log('\nVerify with shared-auth:');
    try {
      const s = sharedAuth.verifyAccessToken(accessToken);
      console.log('shared-auth ok ->', s);
    } catch (e) {
      console.error('shared-auth error ->', e.message);
    }

    console.log('\nVerify with gateway auth service:');
    try {
      const g = gatewayAuth.verifyAccessToken(accessToken);
      console.log('gateway ok ->', g);
    } catch (e) {
      console.error('gateway error ->', e.message);
    }
  } catch (err) {
    console.error('Error in flow', err && err.stack ? err.stack : err.message);
    process.exit(2);
  }
})();
