const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservasController');

router.post('/reservar', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.createReserva(req, res, next, commandBus);
});

router.post('/reservas/create', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.createReserva(req, res, next, commandBus);
});

router.get('/reservas/estudiante/:id', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReservasByEstudiante(req, res, next, queryBus);
});

router.get('/reservas/check', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.checkAvailability(req, res, next, queryBus);
});

router.get('/reservas/maestro/:id', (req, res, next) => {
  const queryBus = req.app.locals.queryBus;
  ctrl.getReservasByMaestro(req, res, next, queryBus);
});

router.post('/reservas/cancel-by-horario', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.cancelReservasByHorario(req, res, next, commandBus);
});

router.put('/reservas/:id/cancel', (req, res, next) => {
  const commandBus = req.app.locals.commandBus;
  ctrl.cancelReserva(req, res, next, commandBus);
});

module.exports = router;
