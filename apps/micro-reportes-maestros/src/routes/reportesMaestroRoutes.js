const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesMaestroController');

// Routes with /api/reportes/maestros prefix (when mounted at /api/reportes)
router.post('/maestros/registrar', ctrl.registrarAtencion);
router.get('/maestros/reporte/:id', ctrl.getReporteByMaestro);
router.get('/maestros/reportes/:maestroId', ctrl.getReportesByMaestro);

// Legacy routes without prefix (for backward compatibility)
router.post('/registrar', ctrl.registrarAtencion);
router.get('/reporte/:id', ctrl.getReporteByMaestro);
router.get('/reportes/:maestroId', ctrl.getReportesByMaestro);

module.exports = router;
