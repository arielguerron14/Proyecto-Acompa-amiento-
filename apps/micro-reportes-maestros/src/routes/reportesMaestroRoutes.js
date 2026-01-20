const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesMaestroController');

// Routes with /api/reportes/maestros prefix (when mounted at /api/reportes)
router.post('/maestros/registrar', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.registrarAtencion(req, res, next, commandBus);
});

router.get('/maestros/reporte/:id', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReporteByMaestro(req, res, next, queryBus);
});

router.get('/maestros/reportes/:maestroId', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReportesByMaestro(req, res, next, queryBus);
});

// Legacy routes without prefix (for backward compatibility)
router.post('/registrar', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.registrarAtencion(req, res, next, commandBus);
});

router.get('/reporte/:id', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReporteByMaestro(req, res, next, queryBus);
});

router.get('/reportes/:maestroId', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReportesByMaestro(req, res, next, queryBus);
});

module.exports = router;
