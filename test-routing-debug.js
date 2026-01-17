const SERVICE_REGISTRY = require('./api-gateway/config/service-registry');

console.log('Testing route matching...\n');

// Simulate what happens when POST /auth/register arrives
const testPaths = [
  '/auth/register',
  '/register',
  '/login',
  '/auth/login',
  '/verify',
  '/auth/verify',
  '/',
  '/anything'
];

testPaths.forEach(path => {
  console.log(`Path: ${path}`);
  const service = SERVICE_REGISTRY.getServiceByRoute(path);
  if (service) {
    console.log(`  ✅ Matches service: ${service.name}`);
    console.log(`  Base URL: ${service.baseUrl}`);
    console.log(`  Target URL would be: ${service.baseUrl}${path}`);
  } else {
    console.log(`  ❌ NO MATCH`);
  }
  console.log('');
});
