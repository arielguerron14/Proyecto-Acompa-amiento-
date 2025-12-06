const gatewayAuth = require('../../api-gateway/src/services/authService');
const sharedAuth = require('../../shared-auth/src/services/authService');

const token = process.argv[2];
if (!token) {
  console.error('Usage: node debug_verify_with_services.js <token>');
  process.exit(1);
}

console.log('Verifying token with shared-auth AuthService...');
try {
  const s = sharedAuth.verifyAccessToken(token);
  console.log('shared-auth verified:', s);
} catch (e) {
  console.error('shared-auth error:', e.message);
}

console.log('\nVerifying token with gateway AuthService...');
try {
  const g = gatewayAuth.verifyAccessToken(token);
  console.log('gateway verified:', g);
} catch (e) {
  console.error('gateway error:', e.message);
}
