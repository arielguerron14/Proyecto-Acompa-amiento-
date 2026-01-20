# 🏗️ CQRS Architecture Visual Guide

## 🎯 Flujo General de CQRS

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (HTTP Request)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Express.js    │
                    │   Routing       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌─────────┐         ┌─────────┐         ┌──────────┐
    │ POST    │         │ GET     │         │ DELETE   │
    │ /users  │         │ /users  │         │ /users   │
    └────┬────┘         └────┬────┘         └────┬─────┘
         │                   │                    │
    ┌────▼────────┐      ┌───▼─────┐         ┌────▼────────┐
    │ Command     │      │ Query   │         │ Command     │
    │ Controller  │      │Contro..│         │ Controller  │
    └────┬────────┘      └───┬─────┘         └────┬────────┘
         │                   │                    │
    ┌────▼─────────────┐  ┌──▼────────────┐  ┌────▼─────────────┐
    │ CreateUserCommand│  │GetUserByIdQry│  │ DeleteUserCommand│
    └────┬─────────────┘  └──┬────────────┘  └────┬─────────────┘
         │                   │                    │
    ┌────▼─────────────────────────────────────────▼────┐
    │           CQRS Bus                                 │
    │  - CommandBus.execute(command)                    │
    │  - QueryBus.execute(query)                        │
    └────┬──────────────────────────────────────────┬───┘
         │                                          │
    ┌────▼──────────────────┐         ┌────────────▼─────────┐
    │ CommandHandler        │         │ QueryHandler         │
    │ - Aplicar dominio     │         │ - Buscar datos       │
    │ - Validar            │         │ - Retornar formato   │
    │ - Persistir          │         │ - Sin side effects   │
    └────┬──────────────────┘         └────────────┬─────────┘
         │                                          │
    ┌────▼──────────────────┐         ┌────────────▼─────────┐
    │ Domain Entity         │         │ ReadRepository       │
    │ - User.validate()     │         │ - findById()        │
    │ - User.create()       │         │ - findByEmail()     │
    └────┬──────────────────┘         └────────────┬─────────┘
         │                                          │
    ┌────▼──────────────────┐         ┌────────────▼─────────┐
    │ WriteRepository       │         │ Cached Models        │
    │ (MongoDB)             │         │ (Redis/Memory)       │
    │ - save()              │         │ Projections          │
    │ - delete()            │         │                      │
    └────┬──────────────────┘         └────────────┬─────────┘
         │                                          │
         │                    ┌─────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────────────────────────┐
    │   MongoDB Database          │
    │  ┌─────────────┐  ┌────────┐│
    │  │ Users       │  │ Caches ││
    │  │ (Write DB)  │  │(ReadDB)││
    │  └─────────────┘  └────────┘│
    └─────────────────────────────┘
         │                    │
         └────────┬───────────┘
                  │
         ┌────────▼──────────┐
         │ Event Bus         │
         │ (Opcional)        │
         │ - UserCreatedEvt  │
         │ - CacheSync       │
         └───────────────────┘
         
                  │
    ┌─────────────▼──────────────┐
    │ HTTP Response (200/201)     │
    │ JSON Result                 │
    └────────────────────────────┘
```

---

## 📦 Estructura por Capa

### API Layer (Controllers)
```
src/api/controllers/
├── UserController.js
├── ReservaController.js
├── HorarioController.js
└── README.md
```
- ✓ Recibe requests HTTP
- ✓ Valida input básico
- ✓ Ejecuta commands/queries
- ✓ Retorna respuestas

### Application Layer (Commands & Queries)
```
src/application/
├── commands/
│   ├── CreateUserCommand.js
│   ├── UpdateUserCommand.js
│   ├── DeleteUserCommand.js
│   └── README.md
│
├── command-handlers/
│   ├── CreateUserCommandHandler.js
│   ├── UpdateUserCommandHandler.js
│   ├── DeleteUserCommandHandler.js
│   └── index.ts
│
├── queries/
│   ├── GetUserByIdQuery.js
│   ├── GetAllUsersQuery.js
│   └── README.md
│
└── query-handlers/
    ├── GetUserByIdQueryHandler.js
    ├── GetAllUsersQueryHandler.js
    └── index.ts
```

### Domain Layer (Business Logic)
```
src/domain/
├── entities/
│   ├── User.js
│   ├── Reserva.js
│   └── Horario.js
│
├── aggregates/
│   ├── StudentAggregate.js
│   ├── TeacherAggregate.js
│   └── ReservationAggregate.js
│
├── value-objects/
│   ├── Email.js
│   ├── TimeSlot.js
│   └── DateTime.js
│
└── repositories/
    ├── UserRepository.js
    ├── ReservaRepository.js
    └── HorarioRepository.js
```

### Infrastructure Layer (Persistence & Config)
```
src/infrastructure/
├── persistence-write/
│   ├── UserRepository.js (Mongo Implementation)
│   ├── ReservaRepository.js
│   └── HorarioRepository.js
│
├── persistence-read/
│   ├── UserReadRepository.js (Proyecciones)
│   ├── ReservaReadRepository.js
│   └── HorarioReadRepository.js
│
├── messaging/
│   ├── EventBus.js
│   ├── EventHandlers/
│   │   ├── OnUserCreated.js
│   │   └── OnReservaCreated.js
│   └── Publishers/
│       └── DomainEventPublisher.js
│
└── config/
    ├── cqrs-bus.js
    ├── cqrs.config.ts
    ├── dependency-injection.js
    └── database-connection.js
```

### Shared Layer
```
src/shared/
└── types/
    ├── ICommand.ts
    ├── IQuery.ts
    ├── ICommandHandler.ts
    ├── IQueryHandler.ts
    ├── IRepository.ts
    └── IEvent.ts
```

---

## 🔄 Ciclo de Vida de un Comando (Escritura)

```
1. REQUEST RECIBIDA
   POST /auth/register
   { email: "user@example.com", password: "123", name: "John" }
   
2. CONTROLLER
   ↓
   const command = new CreateUserCommand(req.body)
   await commandBus.execute(command)
   
3. COMMAND BUS
   ↓
   Busca handler registrado para CreateUserCommand
   
4. COMMAND HANDLER
   ↓
   async handle(command) {
     // Verificar reglas del dominio
     const existing = await repo.findByEmail(command.email)
     if (existing) throw new Error('Email existe')
     
     // Crear entidad
     const user = User.create(command.email, ...)
     user.validate()
     
     // Persistir
     await writeRepository.save(user)
     
     // Publicar evento (opcional)
     await eventBus.publish(new UserCreatedEvent(...))
     
     return { success: true, userId: user.id }
   }
   
5. ENTITY (Domain Logic)
   ↓
   User.validate() verifica reglas del negocio
   - Email válido
   - Contraseña cumple requirements
   - No duplicados
   
6. WRITE REPOSITORY
   ↓
   Accesa MongoDB
   db.users.insertOne({ _id, email, password, ... })
   
7. EVENT BUS (Opcional)
   ↓
   Publica UserCreatedEvent
   - Suscriptores reciben evento
   - Actualizan proyecciones de lectura
   - Notifican otros servicios
   
8. RESPONSE
   ↓
   { success: true, userId: "abc-123" }
   HTTP 201 Created
```

---

## 🔍 Ciclo de Vida de una Query (Lectura)

```
1. REQUEST RECIBIDA
   GET /users/abc-123
   
2. CONTROLLER
   ↓
   const query = new GetUserByIdQuery("abc-123")
   const result = await queryBus.execute(query)
   
3. QUERY BUS
   ↓
   Busca handler registrado para GetUserByIdQuery
   
4. QUERY HANDLER
   ↓
   async handle(query) {
     // Sin side effects
     // Solo lectura
     const user = await readRepository.findById(query.userId)
     
     return {
       userId: user.id,
       email: user.email,
       name: user.name,
       role: user.role
     }
   }
   
5. READ REPOSITORY (Proyección)
   ↓
   Busca en MongoDB (optimizada)
   db.users.findOne(
     { _id: userId },
     { projection: { email: 1, name: 1, role: 1 } }
   )
   
   O en Cache (Redis/Memory):
   cache.get(`user:${userId}`)
   
6. RESPONSE
   ↓
   {
     userId: "abc-123",
     email: "user@example.com",
     name: "John",
     role: "estudiante"
   }
   HTTP 200 OK
```

---

## 🏛️ Arquitectura Hexagonal (Ports & Adapters)

```
┌───────────────────────────────────────────────────┐
│                   EXTERNAL WORLD                   │
│  (HTTP Clients, Databases, Event Brokers, etc)   │
└──────┬───────────────────────────────────┬────────┘
       │                                   │
┌──────▼─────────────────────────────────┬┴──────┐
│         ADAPTER LAYER                   │        │
│  ┌──────────────┐  ┌────────────────┐  │        │
│  │ HTTP Adapter │  │ MongoDB Adapter│  │        │
│  │ (Express.js) │  │ (Mongoose)     │  │        │
│  └──────▲───────┘  └────▲───────────┘  │        │
└─────────┼────────────────┼──────────────┘        │
          │                │                       │
┌─────────┼────────────────┼────────────────────┐  │
│ PORT LAYER (Interfaces)                       │  │
│ ┌────────▼──────────────▼──────────────────┐ │  │
│ │ ICommandHandler                          │ │  │
│ │ IQueryHandler                            │ │  │
│ │ IRepository                              │ │  │
│ │ IEventBus                                │ │  │
│ └──────────────────────────────────────────┘ │  │
└────────────────────────────────────────────────┘  │
                                                    │
┌───────────────────────────────────────────────────┤
│         APPLICATION CORE (Pure Logic)             │
│  ┌──────────────────────────────────────────┐   │
│  │ CommandHandlers / QueryHandlers          │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ Domain Entities & Business Rules         │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ Commands & Queries (DTO Layer)           │   │
│  └──────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘
```

---

## 📊 Comparación: Antes vs Después

### ANTES (Arquitectura Monolítica)
```
Request
   ↓
Controller
   ↓
Service (Mixed logic)
   ├─ Validación
   ├─ Negocio
   ├─ Persistencia
   └─ Todo mezclado!
   ↓
Response
```

**Problemas:**
- ❌ Difícil de testear
- ❌ Cambios afectan todo
- ❌ No escalable
- ❌ Responsabilidades mezcladas

### AHORA (Arquitectura CQRS + DDD)
```
Request
   ↓
Controller (thin)
   ↓
Command/Query
   ↓
Handler (orquestación)
   ↓
Entity (validación de dominio)
   ↓
Repository (persistencia)
   ↓
BD
   ↓
Response
```

**Ventajas:**
- ✅ Fácil de testear
- ✅ Cambios aislados
- ✅ Escalable independientemente
- ✅ Responsabilidades claras
- ✅ Autodocumentado

---

## 🔄 Escalabilidad: Lectura vs Escritura

```
PROBLEMA COMÚN:
Muchas más lecturas que escrituras
(típicamente 90% reads, 10% writes)

SOLUCIÓN CQRS:
┌─────────────────────────────────────┐
│         Write Side (Writes)          │
│  - Command Handlers                  │
│  - Validación de dominio             │
│  - 1 BD (MongoDB)                    │
│  - 10 servidores                     │
│  - 10% del tráfico                   │
│  - Transacciones ACID                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         Read Side (Queries)          │
│  - Query Handlers                    │
│  - Proyecciones optimizadas          │
│  - Múltiples BD (Redis, ES, etc)     │
│  - 100 servidores                    │
│  - 90% del tráfico                   │
│  - Eventual consistency              │
│  - Cacheado fuertemente              │
└─────────────────────────────────────┘
```

---

## 🎯 Recomendaciones de Implementación

```
RECOMENDADO:
Week 1: micro-auth (referencia disponible)
Week 2: micro-estudiantes (lógica core)
Week 3: micro-maestros (horarios)
Week 4: others + testing + refinement

TESTING:
- Unit tests para Entities
- Integration tests para Handlers
- E2E tests para Controllers

MONITOREO:
- Latencia de Commands vs Queries
- Tamaño de cache/proyecciones
- Eventos procesados por minuto
```

---

## 🚀 Habilidades Desbloqueadas

✅ Separación de lectura y escritura
✅ Mejor rendimiento en reads (cache)
✅ Escalabilidad independiente
✅ Testing simplificado
✅ Event Sourcing ready
✅ Microservicios ready
✅ DDD compatible

---

*Última actualización: 20 Enero 2026*
