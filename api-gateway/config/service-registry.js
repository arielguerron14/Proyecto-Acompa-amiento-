/**
 * Service Registry Configuration
 * Punto centralizado para todas las rutas de microservicios
 * 
 * Cuando las IPs cambian, solo actualizar aquí
 * El API Gateway consume este archivo
 */

const SERVICE_REGISTRY = {
  // IP de tu EC2-CORE (actualizar aquí cuando cambie)
  CORE_HOST: process.env.CORE_HOST || 'http://172.31.79.241',
  
  // Microservicios disponibles
  services: {
    auth: {
      name: 'Authentication Service',
      baseUrl: `${process.env.CORE_HOST || 'http://172.31.79.241'}:3000`,
      routes: {
        login: '/auth/login',
        register: '/auth/register',
        verify: '/auth/verify',
        health: '/health'
      }
    },
    
    estudiantes: {
      name: 'Students Service',
      baseUrl: `${process.env.CORE_HOST || 'http://172.31.79.241'}:3001`,
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
      baseUrl: `${process.env.CORE_HOST || 'http://172.31.79.241'}:3002`,
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
      baseUrl: `${process.env.CORE_HOST || 'http://172.31.79.241'}:5003`,
      routes: {
        getReport: '/reportes/estudiante/:id',
        getAll: '/reportes',
        generate: '/reportes/generar',
        health: '/health'
      }
    },
    
    reportesMaestros: {
      name: 'Teacher Reports Service',
      baseUrl: `${process.env.CORE_HOST || 'http://172.31.79.241'}:5004`,
      routes: {
        getReport: '/reportes/maestro/:id',
        getAll: '/reportes',
        generate: '/reportes/generar',
        health: '/health'
      }
    }
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
  getService: (serviceName) => {
    return SERVICE_REGISTRY.services[serviceName];
  },
  
  // Get service for route
  getServiceByRoute: (route) => {
    for (const [pattern, serviceName] of Object.entries(SERVICE_REGISTRY.routes)) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(route)) {
        return SERVICE_REGISTRY.getService(serviceName);
      }
    }
    return null;
  },
  
  // Get all services
  getAllServices: () => {
    return Object.entries(SERVICE_REGISTRY.services).map(([key, service]) => ({
      id: key,
      ...service,
      baseUrl: service.baseUrl
    }));
  },
  
  // Health check endpoint
  health: () => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      coreHost: SERVICE_REGISTRY.CORE_HOST,
      services: SERVICE_REGISTRY.getAllServices().map(s => ({
        name: s.name,
        baseUrl: s.baseUrl,
        id: s.id
      }))
    };
  }
};

module.exports = SERVICE_REGISTRY;
