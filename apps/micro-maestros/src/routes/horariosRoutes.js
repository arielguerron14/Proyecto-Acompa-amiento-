const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/horariosController');

router.post('/horarios', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.createHorario(req, res, next, commandBus);
});

router.put('/horarios/:id', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.updateHorario(req, res, next, commandBus);
});

router.get('/horarios/maestro/:id', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getHorariosByMaestro(req, res, next, queryBus);
});

router.get('/horarios/reportes/:maestroId', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getHorariosReportes(req, res, next, queryBus);
});

router.get('/horarios', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getAllHorarios(req, res, next, queryBus);
});

router.delete('/horarios/:id', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.deleteHorario(req, res, next, commandBus);
});

module.exports = router;
