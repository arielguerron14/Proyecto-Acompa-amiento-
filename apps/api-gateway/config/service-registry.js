/**
 * Service Registry Configuration
 * Punto centralizado para todas las rutas de microservicios
 * 
 * Cuando las IPs cambian, solo actualizar aquí
 * El API Gateway consume este archivo
 */

// Get CORE_HOST dynamically from environment
// In Docker: leave empty or use container names
// In production: use IP or DNS name
const getCoreHost = () => {
  const host = process.env.CORE_HOST || '';
  // Remove protocol if present (it will be added when constructing URLs)
  if (host.startsWith('http://')) {
    return host.replace('http://', '');
  }
  if (host.startsWith('https://')) {
    return host.replace('https://', '');
  }
  return host;
};

// Allow reportes services to live on a different host (EC2-Reportes)
const getReportesHost = () => {
  const host = process.env.REPORTES_HOST || process.env.REPORTES_IP || process.env.EC2_REPORTES_IP || '';
  if (host.startsWith('http://')) return host.replace('http://', '');
  if (host.startsWith('https://')) return host.replace('https://', '');
  return host || getCoreHost();
};

// Determine if we're in Docker or not
const isDocker = () => {
  return process.env.NODE_ENV === 'production' || 
         (process.env.DOCKER_DEPLOYMENT === 'true') ||
         !getCoreHost();
};

const SERVICE_REGISTRY = {
  // CORE_HOST - dynamic based on deployment context
  get CORE_HOST() {
    return getCoreHost();
  },
  
  // Microservicios disponibles
  get services() {
    const coreHost = getCoreHost();
    const reportesHost = getReportesHost();
    
    // Usar CORE_HOST si está disponible (producción en AWS)
    // Fallback a nombres de contenedor (desarrollo local)
    const baseUrls = coreHost && coreHost !== 'localhost' ? {
      auth: `http://${coreHost}:3000`,
      estudiantes: `http://${coreHost}:3001`,
      maestros: `http://${coreHost}:3002`,
      reportesEstudiantes: `http://${reportesHost}:5003`,
      reportesMaestros: `http://${reportesHost}:5004`
    } : {
      // Development with docker-compose OR production with REPORTES_HOST set
      auth: 'http://micro-auth:3000',
      estudiantes: 'http://micro-estudiantes:3001',
      maestros: 'http://micro-maestros:3002',
      // Use reportesHost if explicitly set (EC2 deployment), else docker-compose service name
      reportesEstudiantes: reportesHost && reportesHost !== 'micro-maestros' ? `http://${reportesHost}:5003` : 'http://micro-reportes-estudiantes:5003',
      reportesMaestros: reportesHost && reportesHost !== 'micro-maestros' ? `http://${reportesHost}:5004` : 'http://micro-reportes-maestros:5004'
    };

    return {
      auth: {
        name: 'Authentication Service',
        baseUrl: baseUrls.auth,
        routes: {
          login: '/auth/login',
          register: '/auth/register',
          verify: '/auth/verify',
          health: '/health'
        }
      },
      
      estudiantes: {
        name: 'Students Service',
        baseUrl: baseUrls.estudiantes,
        routes: {
          getAll: '/estudiantes',
          getById: '/estudiantes/:id',
          create: '/estudiantes',
          update: '/estudiantes/:id',
          delete: '/estudiantes/:id',
          horarios: '/estudiantes/:id/horarios',
          reservas: '/estudiantes/reservas/estudiante/:id',
          health: '/health'
        }
      },
      
      maestros: {
        name: 'Teachers Service',
        baseUrl: baseUrls.maestros,
        routes: {
          getAll: '/maestros',
          getById: '/maestros/:id',
          create: '/maestros',
          update: '/maestros/:id',
          delete: '/maestros/:id',
          horarios: '/maestros/:id/horarios',
          horariosList: '/horarios',
          health: '/health'
        }
      },
      
      reportesEstudiantes: {
        name: 'Student Reports Service',
        baseUrl: baseUrls.reportesEstudiantes,
        routes: {
          getReport: '/reportes/estudiante/:id',
          getAll: '/reportes',
          generate: '/reportes/generar',
          health: '/health'
        }
      },
      
      reportesMaestros: {
        name: 'Teacher Reports Service',
        baseUrl: baseUrls.reportesMaestros,
        routes: {
          getReport: '/reportes/maestro/:id',
          getAll: '/reportes',
          generate: '/reportes/generar',
          health: '/health'
        }
      }
    };
  },
  
  // Gateway routes mapping - Qué servicio maneja cada ruta
  // ⚠️ IMPORTANT: Order matters! More specific routes must come BEFORE general wildcards
  // Using array to guarantee evaluation order (most specific first)
  routesArray: [
    // Teacher reports (must come before generic /reportes mapping)
    ['/reportes/maestros', 'reportesMaestros'],
    ['/reportes/maestros/*', 'reportesMaestros'],
    // Back-compat short alias for maestros reports
    ['/reportes-maestros', 'reportesMaestros'],
    ['/reportes-maestros/*', 'reportesMaestros'],

    // Students routes (MUST come before /* wildcard)
    ['/estudiantes', 'estudiantes'],
    ['/estudiantes/*', 'estudiantes'],
    ['/reservas', 'estudiantes'],
    ['/reservas/*', 'estudiantes'],
    
    // Teachers routes
    ['/maestros', 'maestros'],
    ['/maestros/*', 'maestros'],
    ['/horarios', 'maestros'],
    ['/horarios/*', 'maestros'],
    
    // Reports routes
    ['/reportes', 'reportesEstudiantes'],
    ['/reportes/*', 'reportesEstudiantes'],
    
    // Auth routes (including fallback for /auth/*)
    ['/auth/*', 'auth'],
    ['/login', 'auth'],
    ['/register', 'auth'],
    ['/verify', 'auth'],
    ['/health', 'auth'],
    
    // Last resort fallback
    ['/', 'auth'],
    ['/*', 'auth']
  ],
  
  // Deprecated - kept for backwards compatibility
  get routes() {
    const obj = {};
    this.routesArray.forEach(([pattern, service]) => {
      obj[pattern] = service;
    });
    return obj;
  },
  
  // Get service by name
  getService(serviceName) {
    return this.services[serviceName];
  },
  
  // Get service for route
  getServiceByRoute(route) {
    // Use the ordered array to evaluate routes from most specific to least specific
    for (const [pattern, serviceName] of this.routesArray) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(route)) {
        return this.getService(serviceName);
      }
    }
    return null;
  },
  
  // Get all services
  getAllServices() {
    return Object.entries(this.services).map(([key, service]) => ({
      id: key,
      ...service,
      baseUrl: service.baseUrl
    }));
  },
  
  // Health check endpoint
  health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      coreHost: this.CORE_HOST,
      services: this.getAllServices().map(s => ({
        name: s.name,
        baseUrl: s.baseUrl,
        id: s.id
      }))
    };
  }
};

module.exports = SERVICE_REGISTRY;
