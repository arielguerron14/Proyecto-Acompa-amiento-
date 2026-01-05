/**
 * Global API Configuration
 * Automatically detects environment and sets API base URL
 */

window.API_CONFIG = (function() {
  // Use the frontend server's /api proxy by default
  // The frontend server (server.js) proxies all /api/* requests to the API Gateway
  let API_BASE = '/api';
  
  console.log('[API Config] Using frontend server proxy: ' + API_BASE);
  
  // Alternative: If you need direct API Gateway access (e.g., for local testing),
  // uncomment the code below and update with your API Gateway URL
  /*
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local development - direct to API Gateway on localhost
    API_BASE = 'http://localhost:8080';
  } else {
    // Production - direct to API Gateway
    API_BASE = 'http://100.49.159.65:8080';  // Replace with your API Gateway IP
  }
  */
  
  return {
    API_BASE: API_BASE,
    
    // Helper method to build full URLs
    buildUrl: function(endpoint) {
      return API_BASE + endpoint;
    },
    
    // Log the configuration (useful for debugging)
    logConfig: function() {
      console.log('[API Config] Environment:', window.location.hostname);
      console.log('[API Config] API Base URL:', API_BASE);
    }
  };
})();

// Log configuration on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.API_CONFIG.logConfig();
  });
} else {
  window.API_CONFIG.logConfig();
}
