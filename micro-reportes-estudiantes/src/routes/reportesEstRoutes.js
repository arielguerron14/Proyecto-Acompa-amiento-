const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesEstController');

router.post('/registrar', ctrl.registrarEvento);
router.get('/reporte/:id', ctrl.getReporteByEstudiante);

module.exports = router;
