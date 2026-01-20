# Arquitectura CQRS - Guía de Implementación

## 📋 Descripción General

Esta arquitectura implementa **Command Query Responsibility Segregation (CQRS)** en los microservicios. CQRS separa las operaciones de lectura (Queries) de las operaciones de escritura (Commands), permitiendo:

- ✅ Escalabilidad independiente de lectura y escritura
- ✅ Mejor separación de responsabilidades
- ✅ Fácil testabilidad
- ✅ Integración con Domain-Driven Design
- ✅ Posibilidad de usar modelos de datos diferentes para lectura/escritura

## 🏗️ Estructura de Carpetas

```
src/
├── api/
│   └── controllers/           # Puntos de entrada HTTP (REST API)
│
├── application/
│   ├── commands/              # Definiciones de comandos
│   ├── command-handlers/      # Lógica que ejecuta los comandos
│   ├── queries/               # Definiciones de queries
│   └── query-handlers/        # Lógica que ejecuta las queries
│
├── domain/
│   ├── entities/              # Objetos del dominio con identidad
│   ├── aggregates/            # Raíces de agregados (grupos de entidades)
│   ├── value-objects/         # Objetos sin identidad pero con lógica
│   └── repositories/          # Interfaces para persistencia
│
├── infrastructure/
│   ├── persistence-write/     # Acceso a BD para escritura
│   ├── persistence-read/      # Acceso a BD para lectura (proyecciones)
│   ├── messaging/             # Event bus, publicadores de eventos
│   └── config/                # Configuración (CQRS bus, DI, etc)
│
└── shared/
    └── types/                 # Tipos compartidos, interfaces comunes
```

## 🎯 Flujo de Ejecución

### Comando (Operación de Escritura)

```
Request HTTP (POST)
    ↓
[Controller]
    ↓
Command (e.g., CreateUserCommand)
    ↓
CommandBus.execute(command)
    ↓
CommandHandler
    ↓
Domain Entity (Validación de reglas del dominio)
    ↓
Repository.save() → MongoDB Write DB
    ↓
Event (opcional - para sincronizar proyecciones)
    ↓
Response
```

### Query (Operación de Lectura)

```
Request HTTP (GET)
    ↓
[Controller]
    ↓
Query (e.g., GetUserByIdQuery)
    ↓
QueryBus.execute(query)
    ↓
QueryHandler
    ↓
ReadRepository (Proyección optimizada)
    ↓
Response
```

## 📝 Ejemplo Completo: Crear Usuario

### 1️⃣ Definir el Comando

**`src/application/commands/CreateUserCommand.js`**
```javascript
export class CreateUserCommand {
  constructor(email, password, name, role = 'estudiante') {
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
  }
}
```

### 2️⃣ Crear la Entidad de Dominio

**`src/domain/entities/User.js`**
```javascript
export class User {
  constructor(id, email, password, name, role) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.name = name;
    this.role = role;
  }

  validate() {
    // Reglas del dominio
    if (!this.email || !this.password) throw new Error('Datos inválidos');
  }

  static create(email, password, name, role) {
    return new User(generateId(), email, password, name, role);
  }
}
```

### 3️⃣ Implementar el Command Handler

**`src/application/command-handlers/CreateUserCommandHandler.js`**
```javascript
export class CreateUserCommandHandler {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async handle(command) {
    // Validar que no existe
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) throw new Error('Email ya registrado');

    // Crear entidad
    const user = User.create(command.email, command.password, command.name, command.role);
    
    // Validar reglas del dominio
    user.validate();

    // Persistir
    await this.userRepository.save(user);

    return { success: true, userId: user.id };
  }
}
```

### 4️⃣ Implementar el Repositorio

**`src/infrastructure/persistence-write/UserRepository.js`**
```javascript
export class UserRepositoryMongo {
  async save(user) {
    const doc = await UserModel.findByIdAndUpdate(
      user.id,
      user.toJSON(),
      { upsert: true, new: true }
    );
    return User.fromPersistence(doc);
  }

  async findByEmail(email) {
    const doc = await UserModel.findOne({ email });
    return doc ? User.fromPersistence(doc) : null;
  }
}
```

### 5️⃣ Usar en el Controller

**`src/api/controllers/AuthController.js`**
```javascript
export class AuthController {
  constructor(commandBus, queryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  async register(req, res) {
    try {
      const command = new CreateUserCommand(
        req.body.email,
        req.body.password,
        req.body.name
      );

      const result = await this.commandBus.execute(command);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

## 🔧 Pasos para Refactorizar tu Microservicio

### Fase 1: Preparación
```bash
# La estructura de carpetas ya fue creada por generate-cqrs.js
# Verifica que existan todas las carpetas
ls -R src/
```

### Fase 2: Migración Gradual

1. **Identificar operaciones de lectura/escritura**
   - Lectura → Query
   - Escritura → Command

2. **Crear Commands**
   ```javascript
   // Cada operación de escritura se convierte en Command
   CreateReservaCommand, UpdateReservaCommand, DeleteReservaCommand
   ```

3. **Crear Queries**
   ```javascript
   // Cada operación de lectura se convierte en Query
   GetReservaByIdQuery, GetReservasByEstudianteQuery
   ```

4. **Crear Entities y Value Objects**
   - Trasladar lógica de validación de servicios a entities
   - Crear repositories interfaces

5. **Implementar Handlers**
   - CommandHandler orquesta Commands
   - QueryHandler orquesta Queries

6. **Actualizar Controllers**
   - Usar CommandBus/QueryBus en lugar de servicios directos

### Fase 3: Testing

```javascript
// Test del Command Handler
describe('CreateUserCommandHandler', () => {
  it('should create a user', async () => {
    const command = new CreateUserCommand('user@example.com', 'password', 'John');
    const result = await handler.handle(command);
    
    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });
});
```

## 📚 Proyecciones y Lectura Separada

Para lecturas de alto rendimiento, crea proyecciones (cached read models):

**`src/infrastructure/persistence-read/UserProjection.js`**
```javascript
export class UserReadRepository {
  async findById(id) {
    // Busca en cache/BD de lectura (puede estar desnormalizada)
    return await UserReadCache.get(id);
  }
}
```

## 🎪 Event Sourcing (Opcional)

Guarda eventos del dominio para auditoría y replicación:

```javascript
// En el command handler
const event = new UserCreatedEvent(user.id, user.email, user.name);
await eventBus.publish(event);

// En otros microservicios, suscribirse a eventos
eventBus.subscribe(UserCreatedEvent, (event) => {
  // Actualizar proyecciones
});
```

## ⚡ Ventajas Inmediatas

✅ **Testabilidad**: Tests más simples sin mocking de controladores
✅ **Escalabilidad**: Leer y escribir en BDs diferentes
✅ **Auditoría**: Eventos de dominio para tracking
✅ **Mantenibilidad**: Lógica concentrada en handlers, no esparcida
✅ **Documentación**: Comandos/Queries documentan qué hace el sistema

## 🔗 Referencias

- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

## 📞 Soporte

Para preguntas sobre CQRS en este proyecto:
1. Revisa los ejemplos en `micro-auth`
2. Copia la estructura a otro microservicio
3. Migra gradualmente tu lógica de negocio
