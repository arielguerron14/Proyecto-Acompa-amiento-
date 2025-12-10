const http = require('http');

const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:8080';

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
  // merge any extra headers (e.g., Authorization)
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

async function run() {
  try {
    console.log('Gateway URL:', GATEWAY);

    console.log('\n1) GENERATE TOKEN (locally)');
    // Generate a token using shared-auth so tests don't rely on removed login endpoint
    const AuthService = require('../../shared-auth/src/services/authService');
    const { accessToken } = AuthService.generateTokenPair('EST001', 'estudiante', 'estudiante@example.com');
    console.log('Generated access token (truncated):', accessToken.slice(0, 30) + '...');

    console.log('\n2) VERIFY token via gateway');
    const verifyBefore = await request('/auth/verify-token', 'POST', { token: accessToken });
    console.log('Verify status:', verifyBefore.status);
    console.log('Verify body:', JSON.stringify(verifyBefore.body, null, 2));

    console.log('\n3) GET /auth/me via gateway (Authorization header)');
    const me = await request('/auth/me', 'GET', null, { Authorization: `Bearer ${accessToken}` });
    console.log('Me status:', me.status);
    console.log('Me body:', JSON.stringify(me.body, null, 2));

    console.log('\nFinished flow');
    process.exit(0);
  } catch (err) {
    console.error('Error during test flow:');
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(2);
  }
}

run();
