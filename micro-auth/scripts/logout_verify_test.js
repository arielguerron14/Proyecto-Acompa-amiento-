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

    console.log('\n1) LOGIN via gateway');
    const loginResp = await request('/auth/login', 'POST', { email: 'estudiante@example.com', password: 'pass123' });
    console.log('Login status:', loginResp.status);
    console.log('Login body:', JSON.stringify(loginResp.body, null, 2));

    if (!loginResp.body || !loginResp.body.accessToken) throw new Error('Login did not return accessToken');
    const access = loginResp.body.accessToken;

    console.log('\n2) VERIFY before logout');
    const verifyBefore = await request('/auth/verify-token', 'POST', { token: access });
    console.log('Verify-before status:', verifyBefore.status);
    console.log('Verify-before body:', JSON.stringify(verifyBefore.body, null, 2));

    console.log('\n3) LOGOUT');
    // The gateway requires Authorization header for protected routes (logout)
    const logout = await request('/auth/logout', 'POST', { accessToken: access }, { Authorization: `Bearer ${access}` });
    console.log('Logout status:', logout.status);
    console.log('Logout body:', JSON.stringify(logout.body, null, 2));

    console.log('\n4) VERIFY after logout (should be invalid)');
    try {
      const verifyAfter = await request('/auth/verify-token', 'POST', { token: access });
      console.log('Verify-after status:', verifyAfter.status);
      console.log('Verify-after body:', JSON.stringify(verifyAfter.body, null, 2));
    } catch (err) {
      console.error('Verify-after failed as expected:', err.message);
    }

    console.log('\nFinished flow');
    process.exit(0);
  } catch (err) {
    console.error('Error during test flow:');
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(2);
  }
}

run();
