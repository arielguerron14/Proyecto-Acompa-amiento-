/**
 * Global API Configuration - HARDCODED
 * Production deployment with 8 separate EC2 instances
 */

window.API_CONFIG = (function() {
  // HARDCODED IPs - 8 EC2 Instances Architecture
  const CONFIG = {
    // EC2-API-Gateway (Public IP for browser access)
    API_GATEWAY_PUBLIC: 'http://52.71.188.181:8080',
    API_GATEWAY_PRIVATE: 'http://172.31.76.105:8080',
    
    // EC2-Frontend (Public IP - should use /api proxy)
    FRONTEND_PUBLIC: 'http://107.21.124.81',
    FRONTEND_PORT: 80,
    
    // EC2-Core Services (Private IPs - internal only)
    CORE_PRIVATE: 'http://172.31.78.183',
    AUTH_PORT: 3000,
    ESTUDIANTES_PORT: 3001,
    MAESTROS_PORT: 3002,
    
    // EC2-Database (Private IP - internal only)
    DB_PRIVATE: '172.31.79.193',
    MONGO_PORT: 27017,
    POSTGRES_PORT: 5432,
    REDIS_PORT: 6379,
    
    // EC2-Reportes (Public IP)
    REPORTES_PUBLIC: 'http://54.175.62.79',
    REPORTES_ESTUDIANTES_PORT: 5003,
    REPORTES_MAESTROS_PORT: 5004,
    
    // EC2-Notificaciones (Public IP)
    NOTIFICACIONES_PUBLIC: 'http://100.31.143.213',
    NOTIFICACIONES_PORT: 5006,
    
    // EC2-Messaging (Public IP)
    MESSAGING_PUBLIC: 'http://3.235.24.36',
    KAFKA_PORT: 9092,
    RABBITMQ_PORT: 5672,
    
    // EC2-Monitoring (Public IP)
    MONITORING_PUBLIC: 'http://54.198.235.28',
    PROMETHEUS_PORT: 9090,
    GRAFANA_PORT: 3000
  };
  
  // Determine API_BASE based on environment
  let API_BASE = '/api'; // Default: use frontend server proxy
  
  // If accessing directly (not through frontend), use API Gateway
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE = CONFIG.API_GATEWAY_PRIVATE; // Local testing
  } else {
    // Production: use public IP of API Gateway
    API_BASE = CONFIG.API_GATEWAY_PUBLIC;
  }
  
  console.log('[API Config] API Base URL: ' + API_BASE);
  
  return {
    API_BASE: API_BASE,
    CONFIG: CONFIG,
    
    // Helper method to build full URLs
    buildUrl: function(endpoint) {
      return API_BASE + endpoint;
    },
    
    // Get specific service URL
    getServiceUrl: function(service, port) {
      return 'http://' + window.location.hostname + ':' + port;
    },
    
    // Log the configuration (useful for debugging)
    logConfig: function() {
      console.log('[API Config] Environment:', window.location.hostname);
      console.log('[API Config] API Base URL:', API_BASE);
      console.log('[API Config] Full Config:', CONFIG);
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
