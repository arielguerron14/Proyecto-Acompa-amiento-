const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesEstController');

// Routes with /api/reportes/estudiantes prefix (when mounted at /api/reportes)
router.post('/estudiantes/registrar', ctrl.registrarEvento);
router.get('/estudiantes/reporte/:id', ctrl.getReporteByEstudiante);

// Legacy routes without prefix (for backward compatibility)
router.post('/registrar', ctrl.registrarEvento);
router.get('/reporte/:id', ctrl.getReporteByEstudiante);

module.exports = router;
