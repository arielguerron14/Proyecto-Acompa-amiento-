/**
 * Dynamic Proxy Middleware
 * Redirige todas las solicitudes al microservicio correcto usando el Service Registry
 */

const axios = require('axios');
const SERVICE_REGISTRY = require('../config/service-registry');

/**
 * Proxy middleware que redirige a los microservicios
 * Punto único de entrada para todas las rutas
 */
const proxyMiddleware = async (req, res, next) => {
  try {
    // Handle CORS preflight requests - respond immediately with CORS headers
    if (req.method === 'OPTIONS') {
      console.log(`[CORS PREFLIGHT] ${req.method} ${req.path}`);
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.set('Access-Control-Allow-Credentials', 'true');
      return res.status(200).send('');
    }

    // These are API Gateway special endpoints, not microservice endpoints
    // Don't proxy them (the server already handles them)
    // But DO proxy /health when coming from microservice routes
    if ((req.path === '/config' || req.path === '/services') && !req.baseUrl.includes('/auth')) {
      return next();
    }

    // Obtener el servicio usando la ruta completa (baseUrl + path)
    const fullPath = `${req.baseUrl || ''}${req.path || ''}` || req.originalUrl || req.url;
    const service = SERVICE_REGISTRY.getServiceByRoute(fullPath);
    
    if (!service) {
      return res.status(404).json({
        error: 'Route not found',
        path: req.path,
        availableServices: SERVICE_REGISTRY.getAllServices()
      });
    }

    // Determinar el path destino basado en el servicio
    // Auth service monta sus rutas bajo /auth, BUT has root-level endpoints like /health, /metrics, /debug/*, /config
    let targetPath = req.path;
    if (service.baseUrl.includes(':3000')) {
      // Auth service
      const rootLevelRoutes = ['/health', '/metrics', '/config', '/debug'];
      const isRootRoute = rootLevelRoutes.some(route => req.path === route || req.path.startsWith(route + '/'));

      // Normalize root-level routes accidentally requested under /auth/*
      // Example: /auth/health → /health
      if (fullPath === '/auth/health') targetPath = '/health';
      else if (fullPath === '/auth/config') targetPath = '/config';
      else if (fullPath === '/auth/metrics') targetPath = '/metrics';
      else if (fullPath.startsWith('/auth/debug')) targetPath = fullPath.replace('/auth/', '/');

      if (!isRootRoute && !req.path.startsWith('/auth')) {
        // Auth routes need /auth prefix (e.g., /register → /auth/register)
        targetPath = `/auth${req.path}`;
      }
    }
    
    // For some services we must keep the full prefix (their routers expect it)
    // - micro-maestros (:3002) expects paths under /horarios or /maestros
    // - reportes services (:5003, :5004) expect /reportes prefix
    // Students service (:3001) expects paths without /estudiantes prefix
    const keepFullPrefix = service.baseUrl.includes(':3002') || service.baseUrl.includes(':5003') || service.baseUrl.includes(':5004');
    if (!service.baseUrl.includes(':3000') && keepFullPrefix) {
      targetPath = fullPath;
    }

    // Rewrites for Teacher Reports service (:5004)
    if (service.baseUrl.includes(':5004')) {
      // Back-compat rewrite: /reportes-maestros/:id -> /reportes/maestros/reportes/:id
      const legacy = fullPath.match(/^\/reportes-maestros\/([^/]+)$/);
      if (legacy && legacy[1]) {
        targetPath = `/reportes/maestros/reportes/${legacy[1]}`;
      }

      // Normalize canonical prefix to service's router schema
      // Service defines routes at:
      //  - /maestros/registrar
      //  - /maestros/reportes/:maestroId
      //  - /maestros/reporte/:id
      // And legacy:
      //  - /registrar, /reportes/:maestroId, /reporte/:id
      if (fullPath.startsWith('/reportes/maestros/')) {
        const rest = fullPath.replace('/reportes/maestros/', '');
        // Map known subpaths
        if (rest.startsWith('registrar')) {
          targetPath = `/maestros/${rest}`; // /maestros/registrar
        } else if (rest.startsWith('reportes/')) {
          targetPath = `/maestros/${rest}`; // /maestros/reportes/:maestroId
        } else if (rest.startsWith('reporte/')) {
          targetPath = `/maestros/${rest}`; // /maestros/reporte/:id
        } else {
          // Fallback to legacy top-level if unknown
          targetPath = `/${rest}`;
        }
      }
    }
    
    // Construir URL del microservicio
    const targetUrl = `${service.baseUrl}${targetPath}`;
    
    console.log(`[PROXY] ${req.method} ${fullPath} → ${targetUrl} (service: ${service.name})`);

    // Preparar opciones de la solicitud
    const axiosConfig = {
      method: req.method.toLowerCase(),
      url: targetUrl,
      headers: {
        ...req.headers,
        'host': new URL(service.baseUrl).host
      },
      validateStatus: () => true // Acepta cualquier status code
    };

    // Incluir body si existe (para POST, PUT, PATCH)
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      console.log(`[PROXY_BODY] Sending body: ${JSON.stringify(req.body)}`);
      axiosConfig.data = req.body;
    }

    // Incluir query parameters
    if (Object.keys(req.query).length > 0) {
      axiosConfig.params = req.query;
    }

    // Hacer la solicitud al microservicio
    const response = await axios(axiosConfig);

    // Log response for debugging
    console.log(`[PROXY_RESPONSE] Status: ${response.status}, Data length: ${JSON.stringify(response.data).length}, Type: ${typeof response.data}`);

    // Retornar la respuesta (sanitizar headers hop-by-hop)
    res.status(response.status);
    const forwardedHeaders = { ...response.headers };
    // Remove headers that can break re-sending by Express
    delete forwardedHeaders['content-length'];
    delete forwardedHeaders['transfer-encoding'];
    delete forwardedHeaders['connection'];

    // If backend returned a JSON object, let Express set JSON headers/length
    const isJsonObject = response && typeof response.data === 'object' && response.data !== null && !Buffer.isBuffer(response.data);
    if (isJsonObject) {
      delete forwardedHeaders['content-type'];
      res.set(forwardedHeaders);
      return res.json(response.data);
    }

    // Otherwise forward as-is
    res.set(forwardedHeaders);
    res.send(response.data);

  } catch (error) {
    console.error(`[PROXY_ERROR] ${req.method} ${req.path}:`, error.message);
    
    res.status(502).json({
      error: 'Bad Gateway',
      message: error.message,
      service: SERVICE_REGISTRY.getServiceByRoute(req.path)?.name || 'Unknown',
      path: req.path
    });
  }
};

/**
 * Endpoint de configuración - Devuelve todas las rutas disponibles
 */
const configEndpoint = (req, res) => {
  res.json({
    apiVersion: '1.0',
    description: 'API Gateway with Dynamic Service Registry',
    coreHost: SERVICE_REGISTRY.CORE_HOST,
    timestamp: new Date().toISOString(),
    services: SERVICE_REGISTRY.getAllServices(),
    routes: SERVICE_REGISTRY.routes
  });
};

/**
 * Endpoint de servicios - Devuelve lista de servicios disponibles
 */
const servicesEndpoint = (req, res) => {
  res.json({
    services: SERVICE_REGISTRY.getAllServices().map(s => ({
      id: s.id,
      name: s.name,
      baseUrl: s.baseUrl,
      routes: Object.values(s.routes)
    }))
  });
};

/**
 * Endpoint de health check
 */
const healthEndpoint = (req, res) => {
  res.json(SERVICE_REGISTRY.health());
};

module.exports = {
  proxyMiddleware,
  configEndpoint,
  servicesEndpoint,
  healthEndpoint
};
