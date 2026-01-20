const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesEstController');

router.post('/estudiantes/registrar', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.registrarEvento(req, res, next, commandBus);
});

router.get('/estudiantes/reporte/:id', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReporteByEstudiante(req, res, next, queryBus);
});

module.exports = router;
