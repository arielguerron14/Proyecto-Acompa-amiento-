const SERVICE_REGISTRY = require('./api-gateway/config/service-registry');

console.log('Testing route matching for /health...\n');
console.log('Routes object:');
console.log(JSON.stringify(SERVICE_REGISTRY.routes, null, 2));

const route = '/health';
console.log(`\nMatching route: "${route}"`);

const service = SERVICE_REGISTRY.getServiceByRoute(route);
if (service) {
  console.log(`✅ Matches: ${service.name}`);
  console.log(`   Base URL: ${service.baseUrl}`);
} else {
  console.log(`❌ NO MATCH`);
}
