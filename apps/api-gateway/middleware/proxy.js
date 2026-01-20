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

    // Obtener el servicio para esta ruta
    const service = SERVICE_REGISTRY.getServiceByRoute(req.path);
    
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
      
      if (!isRootRoute && !req.path.startsWith('/auth')) {
        // Auth routes need /auth prefix (e.g., /register → /auth/register)
        targetPath = `/auth${req.path}`;
      }
    }
    
    // Construir URL del microservicio
    const targetUrl = `${service.baseUrl}${targetPath}`;
    
    console.log(`[PROXY] ${req.method} ${req.path} → ${targetUrl} (service: ${service.name})`);

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

    // Retornar la respuesta
    res.status(response.status);
    res.set(response.headers);
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
