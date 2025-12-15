const express = require('express');
const soapController = require('../handlers/soapHandler');
// When running inside the container the shared package is copied to /usr/shared-auth
// Use absolute path here so Docker builds can resolve it reliably.
const { authenticateToken } = require('/usr/shared-auth/src/middlewares/authMiddleware');

const router = express.Router();

/**
 * POST /soap/call
 * Realiza una llamada a un servicio SOAP legacy
 */
router.post('/call', authenticateToken, soapController.callSOAPService);

/**
 * GET /soap/services
 * Retorna la lista de servicios SOAP disponibles
 */
router.get('/services', authenticateToken, soapController.listServices);

/**
 * POST /soap/transform
 * Transforma datos de REST a SOAP
 */
router.post('/transform', authenticateToken, soapController.transformData);

/**
 * GET /soap/wsdl/:serviceName
 * Obtiene el WSDL de un servicio
 */
router.get('/wsdl/:serviceName', soapController.getWSDL);

module.exports = router;
