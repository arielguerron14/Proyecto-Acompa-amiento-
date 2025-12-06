const request = require('supertest');
const app = require('../src/app');

(async () => {
  try {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'estudiante@example.com', password: 'pass123' })
      .set('Accept', 'application/json');

    console.log('status:', res.status);
    console.log('body:', JSON.stringify(res.body, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('test error', err);
    process.exit(1);
  }
})();
