/**
 * Global API Configuration
 * Automatically detects environment and sets API base URL
 */

window.API_CONFIG = (function() {
  // Determine API base URL dynamically based on environment
  let API_BASE;
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local development -> call local API directly
    API_BASE = 'http://localhost:8080';
  } else {
    // Production -> use frontend server proxy at /api to avoid cross-origin and public IP issues
    // The frontend server (server.js) proxies '/api/*' to the actual API gateway (configured via API_GATEWAY_URL env)
    API_BASE = '/api';
  }
  
  return {
    API_BASE: API_BASE,
    
    // Helper method to build full URLs
    buildUrl: function(endpoint) {
      // Ensure endpoint begins with '/'
      if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
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
