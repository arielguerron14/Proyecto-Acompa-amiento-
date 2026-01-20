# Guía de Migración a CQRS - Paso a Paso

## ✅ Estado Actual

✅ **Estructura de carpetas**: 100% creada en todos los microservicios
✅ **CQRS Bus**: Implementado en `src/infrastructure/config/cqrs-bus.js`
✅ **Ejemplos**: Creados en `micro-auth` como referencia

🔶 **Pendiente**: Refactorizar servicios existentes para usar patrón `handle()`

## 📋 Checklist de Migración

Cada microservicio debe seguir estos pasos:

### 1. Migrar los Services existentes

**Antes (Old Pattern):**
```javascript
// apps/micro-auth/src/services/authService.js
module.exports = {
  generateToken: (payload) => {
    return jwt.sign(payload, secret);
  }
};
```

**Después (CQRS Pattern):**
```javascript
// apps/micro-auth/src/application/command-handlers/GenerateTokenCommandHandler.js
class GenerateTokenCommandHandler {
  async handle(command) {
    return jwt.sign(command.payload, process.env.JWT_SECRET);
  }
}
```

### 2. Crear Commands para cada operación de escritura

**Ejemplo en micro-estudiantes:**
```javascript
// apps/micro-estudiantes/src/application/commands/CreateReservaCommand.js
export class CreateReservaCommand {
  constructor(estudianteId, maestroId, dia, inicio) {
    this.estudianteId = estudianteId;
    this.maestroId = maestroId;
    this.dia = dia;
    this.inicio = inicio;
  }
}

// apps/micro-estudiantes/src/application/commands/UpdateReservaCommand.js
export class UpdateReservaCommand {
  constructor(reservaId, updates) {
    this.reservaId = reservaId;
    this.updates = updates;
  }
}

// apps/micro-estudiantes/src/application/commands/DeleteReservaCommand.js
export class DeleteReservaCommand {
  constructor(reservaId) {
    this.reservaId = reservaId;
  }
}
```

### 3. Crear Command Handlers

```javascript
// apps/micro-estudiantes/src/application/command-handlers/CreateReservaCommandHandler.js
const Reserva = require('../../domain/entities/Reserva');
const ReservaRepository = require('../../infrastructure/persistence-write/ReservaRepository');

class CreateReservaCommandHandler {
  constructor(reservaRepository) {
    this.reservaRepository = reservaRepository;
  }

  async handle(command) {
    // 1. Validar reglas del dominio
    const reserva = Reserva.create(
      command.estudianteId,
      command.maestroId,
      command.dia,
      command.inicio
    );
    
    // 2. Persistir
    await this.reservaRepository.save(reserva);
    
    // 3. Publicar evento (opcional)
    // await eventBus.publish(new ReservaCreatedEvent(...));
    
    return { success: true, reservaId: reserva.id };
  }
}

module.exports = CreateReservaCommandHandler;
```

### 4. Crear Queries para cada operación de lectura

```javascript
// apps/micro-estudiantes/src/application/queries/GetReservasByEstudianteQuery.js
export class GetReservasByEstudianteQuery {
  constructor(estudianteId) {
    this.estudianteId = estudianteId;
  }
}

// apps/micro-estudiantes/src/application/queries/GetAvailableHorariosQuery.js
export class GetAvailableHorariosQuery {
  constructor(maestroId, fecha) {
    this.maestroId = maestroId;
    this.fecha = fecha;
  }
}
```

### 5. Crear Query Handlers

```javascript
// apps/micro-estudiantes/src/application/query-handlers/GetReservasByEstudianteQueryHandler.js
class GetReservasByEstudianteQueryHandler {
  constructor(readRepository) {
    this.readRepository = readRepository;
  }

  async handle(query) {
    // Buscar en BD de lectura (proyección optimizada)
    const reservas = await this.readRepository.findByEstudiante(query.estudianteId);
    
    return {
      success: true,
      reservas: reservas.map(r => ({
        id: r.id,
        maestro: r.maestro,
        dia: r.dia,
        inicio: r.inicio,
        estado: r.estado
      }))
    };
  }
}

module.exports = GetReservasByEstudianteQueryHandler;
```

### 6. Crear Entities del Dominio

```javascript
// apps/micro-estudiantes/src/domain/entities/Reserva.js
const crypto = require('crypto');

class Reserva {
  constructor(id, estudianteId, maestroId, dia, inicio, estado = 'Activa', createdAt = new Date()) {
    this.id = id;
    this.estudianteId = estudianteId;
    this.maestroId = maestroId;
    this.dia = dia;
    this.inicio = inicio;
    this.estado = estado;
    this.createdAt = createdAt;
  }

  static create(estudianteId, maestroId, dia, inicio) {
    return new Reserva(
      crypto.randomUUID(),
      estudianteId,
      maestroId,
      dia,
      inicio
    );
  }

  validate() {
    if (!this.estudianteId || !this.maestroId) throw new Error('IDs requeridos');
    if (!this.dia || !this.inicio) throw new Error('Horario requerido');
    return true;
  }

  cancel() {
    this.estado = 'Cancelada';
  }

  toPersistence() {
    return {
      _id: this.id,
      estudianteId: this.estudianteId,
      maestroId: this.maestroId,
      dia: this.dia,
      inicio: this.inicio,
      estado: this.estado,
      createdAt: this.createdAt
    };
  }

  static fromPersistence(data) {
    return new Reserva(
      data._id || data.id,
      data.estudianteId,
      data.maestroId,
      data.dia,
      data.inicio,
      data.estado,
      data.createdAt
    );
  }
}

module.exports = Reserva;
```

### 7. Implementar Repositorio Write

```javascript
// apps/micro-estudiantes/src/infrastructure/persistence-write/ReservaRepository.js
const Reserva = require('../../domain/entities/Reserva');
const ReservaModel = require('../../../models/Reserva');

class ReservaRepository {
  async save(reserva) {
    const persistenceData = reserva.toPersistence();
    const result = await ReservaModel.findByIdAndUpdate(
      persistenceData._id,
      persistenceData,
      { upsert: true, new: true }
    );
    return Reserva.fromPersistence(result);
  }

  async findById(id) {
    const doc = await ReservaModel.findById(id);
    return doc ? Reserva.fromPersistence(doc) : null;
  }

  async delete(id) {
    await ReservaModel.findByIdAndDelete(id);
  }
}

module.exports = ReservaRepository;
```

### 8. Implementar Repositorio Read (Proyección)

```javascript
// apps/micro-estudiantes/src/infrastructure/persistence-read/ReservaReadRepository.js
const ReservaModel = require('../../../models/Reserva');

class ReservaReadRepository {
  async findByEstudiante(estudianteId) {
    // Retorna datos optimizados para lectura
    return await ReservaModel.find(
      { estudianteId },
      'id maestro dia inicio estado' // Solo campos necesarios
    ).lean();
  }

  async findAvailableHorarios(maestroId, fecha) {
    const reserved = await ReservaModel.find(
      { maestroId, dia: fecha, estado: 'Activa' },
      'inicio fin'
    ).lean();
    
    return reserved;
  }
}

module.exports = ReservaReadRepository;
```

### 9. Actualizar Controllers

**Antes:**
```javascript
// src/api/controllers/reservasController.js
const reservasService = require('../services/reservasService');

exports.createReserva = async (req, res) => {
  const result = await reservasService.create(req.body);
  res.json(result);
};
```

**Después:**
```javascript
// src/api/controllers/reservasController.js
const { CreateReservaCommand } = require('../../application/commands/CreateReservaCommand');
const { GetReservasByEstudianteQuery } = require('../../application/queries/GetReservasByEstudianteQuery');

class ReservasController {
  constructor(commandBus, queryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  async createReserva(req, res) {
    try {
      const command = new CreateReservaCommand(
        req.body.estudianteId,
        req.body.maestroId,
        req.body.dia,
        req.body.inicio
      );
      
      const result = await this.commandBus.execute(command);
      res.status(201).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ error: error.message });
    }
  }

  async getReservasEstudiante(req, res) {
    try {
      const query = new GetReservasByEstudianteQuery(req.params.estudianteId);
      const result = await this.queryBus.execute(query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ReservasController;
```

### 10. Registrar Handlers en el App

```javascript
// src/app.js o archivo de bootstrap
const { CommandBus, QueryBus } = require('./infrastructure/config/cqrs-bus');
const CreateReservaCommandHandler = require('./application/command-handlers/CreateReservaCommandHandler');
const GetReservasByEstudianteQueryHandler = require('./application/query-handlers/GetReservasByEstudianteQueryHandler');

// Inicializar buses
const commandBus = new CommandBus();
const queryBus = new QueryBus();

// Instanciar dependencias
const reservaRepository = new ReservaRepository();
const reservaReadRepository = new ReservaReadRepository();

// Registrar handlers
commandBus.register(
  CreateReservaCommand,
  new CreateReservaCommandHandler(reservaRepository)
);

queryBus.register(
  GetReservasByEstudianteQuery,
  new GetReservasByEstudianteQueryHandler(reservaReadRepository)
);

// Inyectar en controllers
const reservasController = new ReservasController(commandBus, queryBus);

// Usar en rutas
app.post('/reservas', (req, res) => reservasController.createReserva(req, res));
```

## 🎯 Orden Recomendado de Migración

1. **Micro-auth** (Referencia) - Ya tiene ejemplos
2. **Micro-estudiantes** - Core business logic (Reservas)
3. **Micro-maestros** - Horarios (read-heavy)
4. **Micro-reportes-estudiantes** - Proyecciones (read-only)
5. **Micro-reportes-maestros** - Proyecciones (read-only)
6. **Micro-notificaciones** - Event-driven
7. **Micro-analytics** - Aggregations
8. **Micro-core** - Orchestrator

## 🚀 Comandos Útiles

```bash
# Validar estructura CQRS
npm run cqrs:validate

# Regenerar estructura si falta algo
npm run cqrs:regenerate

# Ejecutar tests
npm run test

# Ver logs de Docker
npm run logs
```

## 📚 Referencias en el Proyecto

- [CQRS_GUIDE.md](../CQRS_GUIDE.md) - Guía conceptual completa
- [micro-auth/src/application/](../../apps/micro-auth/src/application/) - Ejemplos reales
- [maintain-cqrs.yml](../.github/workflows/maintain-cqrs.yml) - Automatización

## 💡 Tips

✅ Haz commits pequeños (un command/query a la vez)
✅ Los tests van primero (TDD)
✅ Los eventos del dominio son opcionales pero recomendados
✅ Keep entities lean - solo lógica de dominio
✅ Repositories solo en persistence layer

## ❓ Preguntas Frecuentes

**P: ¿Debo migrar todo de una vez?**
R: No, hazlo gradualmente. Un endpoint a la vez.

**P: ¿Qué pasa con la BD existente?**
R: Los Entities usan `fromPersistence()` para adaptar datos.

**P: ¿Cómo manejo las transacciones?**
R: En el CommandHandler, dentro de `handle()`.

**P: ¿Y si tengo queries complejas?**
R: Crea un `ReadRepository` con métodos optimizados.
