// Minimal Node script to validate register, login, and reservation flows via API Gateway/ALB
// Usage: node scripts/validate-flows.js --base http://<alb-dns>

const http = require('http');
const https = require('https');
const { URL } = require('url');

function request(method, base, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const isHttps = url.protocol === 'https:';
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(data ? { 'Content-Length': data.length } : {}),
        ...headers,
      },
    };
    const lib = isHttps ? https : http;
    const req = lib.request(url, opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('utf8');
        const result = {
          status: res.statusCode,
          headers: res.headers,
          bodyText: text,
          body: null,
        };
        try { result.body = text ? JSON.parse(text) : null; } catch { /* ignore parse errors */ }
        resolve(result);
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function arg(name, def) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

async function main() {
  const base = arg('base', process.env.ALB_URL || 'http://lab-alb-1373122305.us-east-1.elb.amazonaws.com');
  const email = `test.${Date.now()}@example.com`;
  const password = 'Test12345!';
  const name = 'Test User';

  console.log(`Base: ${base}`);

  // Health check
  const health = await request('GET', base, '/health');
  console.log('GET /health ->', health.status, health.body || health.bodyText);
  if (health.status >= 500) {
    console.error('ALB not healthy (503/5xx). Ensure gateway is serving on port 80.');
    process.exit(2);
  }

  // Register
  const reg = await request('POST', base, '/auth/register', { email, password, name });
  console.log('POST /auth/register ->', reg.status, reg.body || reg.bodyText);
  if (![201, 409].includes(reg.status)) {
    console.error('Register failed.');
    process.exit(3);
  }

  // Login
  const login = await request('POST', base, '/auth/login', { email, password });
  console.log('POST /auth/login ->', login.status);
  if (login.status !== 200 || !login.body || !login.body.token) {
    console.error('Login failed; no token.');
    process.exit(4);
  }
  const token = login.body.token;
  const estudianteId = login.body.user && (login.body.user.id || login.body.user._id || login.body.user.userId);
  console.log('Token acquired. EstudianteId:', estudianteId);

  // Create reservation (requires JWT)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const reservaBody = {
    estudianteId: estudianteId || 'EST-TEST-1',
    maestroId: 'MAE-TEST-1',
    fecha: today,
    hora: '10:00',
    asunto: 'Asesoría',
    descripcion: 'Reserva de prueba',
    materia: 'Matemáticas',
    semestre: '2026A',
    paralelo: 'P1',
    modalidad: 'Virtual',
    lugarAtencion: 'Teams/Meet'
  };

  const reserva = await request('POST', base, '/reservas/create', reservaBody, { Authorization: `Bearer ${token}` });
  console.log('POST /reservas/create ->', reserva.status, reserva.body || reserva.bodyText);
  if (reserva.status !== 201) {
    console.error('Reservation creation failed.');
    process.exit(5);
  }

  // List reservations for estudiante
  if (estudianteId) {
    const list = await request('GET', base, `/reservas/estudiante/${encodeURIComponent(estudianteId)}`, null, { Authorization: `Bearer ${token}` });
    console.log('GET /reservas/estudiante/:id ->', list.status);
    console.log('Sample:', Array.isArray(list.body) ? list.body.slice(0, 1) : list.body);
  }

  console.log('✅ Flows validated: register, login, reservar');
}

main().catch((err) => { console.error('Error:', err.message || err); process.exit(1); });
