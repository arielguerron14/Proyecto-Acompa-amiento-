/**
 * Global API Configuration
 * Automatically detects environment and sets API base URL
 */

window.API_CONFIG = (function() {
  // Determine API base URL dynamically based on environment
  let API_BASE;
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local development
    API_BASE = 'http://localhost:8080';
  } else {
    // Production - use the same host but with port 8080
    API_BASE = `http://${window.location.hostname}:8080`;
  }
  
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
