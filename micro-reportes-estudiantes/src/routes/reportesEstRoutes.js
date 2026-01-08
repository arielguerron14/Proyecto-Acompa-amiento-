const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesEstController');

// Solo rutas con prefijo /estudiantes
router.post('/estudiantes/registrar', ctrl.registrarEvento);
router.get('/estudiantes/reporte/:id', ctrl.getReporteByEstudiante);

module.exports = router;
