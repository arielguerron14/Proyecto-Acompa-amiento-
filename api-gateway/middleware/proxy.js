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
    // Rutas especiales que no se proxean
    if (req.path === '/health' || req.path === '/config' || req.path === '/services') {
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

    // Construir URL del microservicio
    const targetUrl = `${service.baseUrl}${req.path}`;
    
    console.log(`[PROXY] ${req.method} ${req.path} → ${targetUrl}`);

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
      axiosConfig.data = req.body;
    }

    // Incluir query parameters
    if (Object.keys(req.query).length > 0) {
      axiosConfig.params = req.query;
    }

    // Hacer la solicitud al microservicio
    const response = await axios(axiosConfig);

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
