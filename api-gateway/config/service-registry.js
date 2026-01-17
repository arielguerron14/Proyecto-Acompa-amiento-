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
  return process.env.CORE_HOST || '';
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
    
    // Usar CORE_HOST si está disponible (producción en AWS)
    // Fallback a nombres de contenedor (desarrollo local)
    const baseUrls = coreHost ? {
      auth: `http://${coreHost}:3000`,
      estudiantes: `http://${coreHost}:3001`,
      maestros: `http://${coreHost}:3002`,
      reportesEstudiantes: `http://${coreHost}:5003`,
      reportesMaestros: `http://${coreHost}:5004`
    } : {
      // Fallback para desarrollo local con docker-compose
      auth: 'http://micro-auth:3000',
      estudiantes: 'http://micro-estudiantes:3001',
      maestros: 'http://micro-maestros:3002',
      reportesEstudiantes: 'http://micro-reportes-estudiantes:5003',
      reportesMaestros: 'http://micro-reportes-maestros:5004'
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
  routes: {
    // Auth routes
    '/auth/*': 'auth',
    '/login': 'auth',
    '/register': 'auth',
    '/verify': 'auth',
    
    // Students routes
    '/estudiantes': 'estudiantes',
    '/estudiantes/*': 'estudiantes',
    '/horarios': 'maestros',
    '/horarios/*': 'maestros',
    
    // Teachers routes
    '/maestros': 'maestros',
    '/maestros/*': 'maestros',
    
    // Reports routes
    '/reportes': 'reportesEstudiantes',
    '/reportes/*': 'reportesEstudiantes'
  },
  
  // Get service by name
  getService(serviceName) {
    return this.services[serviceName];
  },
  
  // Get service for route
  getServiceByRoute(route) {
    for (const [pattern, serviceName] of Object.entries(this.routes)) {
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
