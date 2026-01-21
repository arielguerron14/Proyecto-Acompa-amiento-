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
    // Production -> prefer an explicit API_GATEWAY URL when provided (window.__API_GATEWAY_URL__)
    // Fallback to same-origin so calls go through the ALB domain consistently.
    API_BASE = window.__API_GATEWAY_URL__ || window.location.origin;
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
      if (API_BASE === '/api') {
        console.warn('[API Config] API base is \'/api\' — ensure the frontend server is proxying /api to the API Gateway.\n' +
                     'If you see 404s for endpoints like "me" or "horarios", set window.__API_GATEWAY_URL__ to the API Gateway URL ' +
                     'or configure nginx proxy to forward /api to the API Gateway.');
      }
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
