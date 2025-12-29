// Global API Configuration
window.API_CONFIG = (function() {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  let API_BASE;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Local development
    API_BASE = 'http://localhost:8080';
  } else {
    // Production: Use same host on port 80 (HTTP)
    API_BASE = `${protocol}//${hostname}`;
  }
  
  console.log(`🔧 API Configuration loaded`);
  console.log(`   Hostname: ${hostname}`);
  console.log(`   API_BASE: ${API_BASE}`);
  
  return {
    API_BASE: API_BASE,
    buildUrl: function(endpoint) {
      return this.API_BASE + endpoint;
    }
  };
})();
