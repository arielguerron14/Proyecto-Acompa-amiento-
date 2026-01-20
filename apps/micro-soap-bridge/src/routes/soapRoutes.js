const express = require('express');
const soapController = require('../handlers/soapHandler');
// Use the distributed shared-auth package so code works both locally and in containers
const { authenticateToken } = require('@proyecto/shared-auth');

const router = express.Router();

/**
 * POST /soap/call
 * Realiza una llamada a un servicio SOAP legacy
 */
router.post('/call', authenticateToken, (req, res) => {
  const { commandBus } = req.app.locals;
  soapController.callSOAPService(req, res, commandBus);
});

/**
 * GET /soap/services
 * Retorna la lista de servicios SOAP disponibles
 */
router.get('/services', authenticateToken, (req, res) => {
  const { queryBus } = req.app.locals;
  soapController.listServices(req, res, queryBus);
});

/**
 * POST /soap/transform
 * Transforma datos de REST a SOAP
 */
router.post('/transform', authenticateToken, (req, res) => {
  const { commandBus } = req.app.locals;
  soapController.transformData(req, res, commandBus);
});

/**
 * GET /soap/wsdl/:serviceName
 * Obtiene el WSDL de un servicio
 */
router.get('/wsdl/:serviceName', (req, res) => {
  const { queryBus } = req.app.locals;
  soapController.getWSDL(req, res, queryBus);
});

module.exports = router;
