const AuthService = require('../../shared-auth/src/services/authService');
const request = require('supertest');
const app = require('../src/app');

(async () => {
  try {
    // Generate a test token locally using shared-auth
    const { accessToken } = AuthService.generateTokenPair('EST001', 'estudiante', 'estudiante@example.com');

    // Verify via local endpoint
    const res = await request(app)
      .post('/auth/verify-token')
      .send({ token: accessToken })
      .set('Accept', 'application/json');

    console.log('status:', res.status);
    console.log('body:', JSON.stringify(res.body, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('test error', err);
    process.exit(1);
  }
})();
