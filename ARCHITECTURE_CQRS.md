# 📐 CQRS Architecture - Documentación Completa

> **Última actualización**: 20 Enero 2026  
> **Estado**: ✅ 8/8 Microservicios implementados  
> **Versión**: 1.0.0

---

## 📋 Tabla de Contenidos

1. [Introducción a CQRS](#introducción-a-cqrs)
2. [Conceptos Fundamentales](#conceptos-fundamentales)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Flujos de Ejecución](#flujos-de-ejecución)
5. [Ejemplo Completo: Crear Usuario](#ejemplo-completo-crear-usuario)
6. [Guía de Migración](#guía-de-migración)
7. [Status de Implementación](#status-de-implementación)

---

## Introducción a CQRS

**CQRS** (Command Query Responsibility Segregation) es un patrón arquitectónico que separa:

- **Commands** (Comandos): Operaciones que **modifican** datos (CREATE, UPDATE, DELETE)
- **Queries** (Queries): Operaciones que **leen** datos (SELECT, GET)

### ✨ Beneficios

- ✅ **Escalabilidad independiente**: Leer y escribir pueden escalar por separado
- ✅ **Separación de responsabilidades**: Código más organizado y mantenible
- ✅ **Mejor testabilidad**: Cada handler es una unidad pequeña y aislada
- ✅ **Domain-Driven Design**: Alineado con principios DDD
- ✅ **Event Sourcing listo**: Base para auditoría y replay de eventos

---

## Conceptos Fundamentales

### 🎯 Los 4 Pilares de CQRS

```
┌────────────────────────────────────────────────────────────┐
│                    REQUEST (HTTP)                          │
└───────────────────────┬──────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    ┌───────┐      ┌───────┐      ┌─────────┐
    │Command│      │Query │      │Event    │
    └───┬───┘      └───┬───┘      └────┬────┘
        │              │               │
    ┌───▼───┐      ┌───▼───┐      ┌────▼─────┐
    │Handler│      │Handler│      │Listener  │
    └───┬───┘      └───┬───┘      └────┬─────┘
        │              │               │
    ┌───▼──────┐   ┌───▼──────┐    ┌───▼──────┐
    │Domain    │   │Read      │    │Side      │
    │Entity    │   │Model     │    │Effects   │
    └───┬──────┘   └──────────┘    └──────────┘
        │
    ┌───▼──────────┐
    │Write to DB   │
    │(MongoDB)     │
    └──────────────┘
```

### 📦 Componentes Principales

| Componente | Responsabilidad | Ejemplo |
|-----------|-----------------|---------|
| **Controller** | Punto de entrada HTTP, validación básica | `POST /users` → `CreateUserCommand` |
| **Command** | Datos que representan una intención | `CreateUserCommand(email, password)` |
| **CommandHandler** | Ejecuta la lógica de dominio | Valida, crea entidad, guarda |
| **Query** | Datos que representan una consulta | `GetUserByIdQuery(userId)` |
| **QueryHandler** | Obtiene datos para lectura | Lee del modelo de lectura/caché |
| **Domain Entity** | Lógica de negocio, validaciones | `User.validate()`, `User.hashPassword()` |
| **Repository** | Acceso a persistencia | `UserRepository.save()`, `findById()` |
| **Event** | Cambio en el dominio (opcional) | `UserCreatedEvent`, `UserDeletedEvent` |

---

## Estructura de Carpetas

```
proyecto/
├── apps/
│   ├── micro-auth/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   └── controllers/              # 🌐 Puntos de entrada HTTP
│   │   │   │       ├── UserController.js
│   │   │   │       └── README.md
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── commands/                 # 🔨 Definiciones de comandos
│   │   │   │   │   ├── CreateUserCommand.js
│   │   │   │   │   ├── UpdateUserCommand.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── command-handlers/         # ⚙️ Ejecución de comandos
│   │   │   │   │   ├── CreateUserCommandHandler.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── queries/                  # 🔍 Definiciones de queries
│   │   │   │   │   ├── GetUserByIdQuery.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   └── query-handlers/           # 📊 Ejecución de queries
│   │   │   │       ├── GetUserByIdQueryHandler.js
│   │   │   │       └── README.md
│   │   │   │
│   │   │   ├── domain/
│   │   │   │   ├── entities/                 # 🎯 Entidades del dominio
│   │   │   │   │   ├── User.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── aggregates/               # 📦 Raíces de agregados
│   │   │   │   │   ├── UserAggregate.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── value-objects/            # 💎 Objetos de valor
│   │   │   │   │   ├── Email.js
│   │   │   │   │   ├── Password.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   └── repositories/             # 💾 Interfaces
│   │   │   │       ├── IUserRepository.js
│   │   │   │       └── README.md
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence-write/        # ✍️ BD de escritura
│   │   │   │   │   ├── MongoUserRepository.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── persistence-read/         # 📖 Proyecciones/caché
│   │   │   │   │   ├── UserReadModel.js
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── messaging/                # 📨 Event bus
│   │   │   │   │   ├── events/
│   │   │   │   │   ├── event-handlers/
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   └── config/
│   │   │   │       ├── cqrs-bus.js           # 🚌 Bus de CQRS
│   │   │   │       └── dependency-injection.js
│   │   │   │
│   │   │   └── shared/
│   │   │       └── types/                    # 🏷️ Tipos compartidos
│   │   │           ├── index.ts
│   │   │           └── README.md
│   │   │
│   │   ├── app.js                            # Punto de entrada
│   │   └── package.json
│   │
│   └── [otros microservicios...]
│
└── scripts/
    ├── generate-cqrs.js                      # Generar estructura
    ├── validate-cqrs.js                      # Validar arquitectura
    └── README.md
```

---

## Flujos de Ejecución

### 🔨 Flujo de Command (Escritura)

```
1. REQUEST → POST /users
            {
              "email": "user@example.com",
              "password": "securepass",
              "name": "John Doe"
            }

2. CONTROLLER
   ├─ Recibe request
   ├─ Valida formato básico
   ├─ Crea CreateUserCommand
   └─ Envía al CommandBus

3. COMMAND BUS
   └─ Busca CreateUserCommandHandler

4. COMMAND HANDLER
   ├─ Recibe command
   ├─ Busca si email existe → UserRepository.findByEmail()
   ├─ Si existe → Lanza excepción
   ├─ Si no → Crea User entity

5. DOMAIN ENTITY (User)
   ├─ User.create(command)
   ├─ Valida email: User.validateEmail()
   ├─ Valida password: User.validatePassword()
   ├─ Valida name: User.validateName()
   ├─ Si falla validación → Lanza excepción
   ├─ Si éxito → Usuario creado

6. WRITE PERSISTENCE
   ├─ UserRepository.save(user)
   ├─ Guarda en MongoDB (colección: users)
   ├─ Retorna usuario guardado

7. EVENT (OPCIONAL)
   ├─ Emite UserCreatedEvent
   ├─ Event listeners actualizan caché
   ├─ Event listeners sincronizan proyecciones
   └─ Event listeners envían notificaciones

8. RESPONSE
   └─ 201 Created
      {
        "id": "uuid-123",
        "email": "user@example.com",
        "name": "John Doe",
        "createdAt": "2026-01-20T10:30:00Z"
      }
```

### 🔍 Flujo de Query (Lectura)

```
1. REQUEST → GET /users/:id
            Parámetro: id=uuid-123

2. CONTROLLER
   ├─ Recibe request
   ├─ Valida parámetro id
   ├─ Crea GetUserByIdQuery(id)
   └─ Envía al QueryBus

3. QUERY BUS
   └─ Busca GetUserByIdQueryHandler

4. QUERY HANDLER (sin side effects)
   ├─ Recibe query
   ├─ Intenta leer del caché (Redis)
   ├─ Si existe en caché → Retorna
   ├─ Si no → Busca en BD de lectura
   └─ Retorna resultado

5. READ PERSISTENCE (RÁPIDO)
   ├─ UserReadModel.findById(id)
   ├─ Lee de caché o proyección
   └─ Retorna datos optimizados

6. RESPONSE
   └─ 200 OK
      {
        "id": "uuid-123",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "estudiante",
        "createdAt": "2026-01-20T10:30:00Z"
      }
```

---

## Ejemplo Completo: Crear Usuario

### Paso 1: Definir el Comando

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

### Paso 2: Crear la Entidad de Dominio

**`src/domain/entities/User.js`**
```javascript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class User {
  constructor(id, email, passwordHash, name, role, createdAt) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.name = name;
    this.role = role;
    this.createdAt = createdAt;
  }

  // Métodos de validación (Lógica de dominio)
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  static validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password debe tener mínimo 8 caracteres');
    }
  }

  static validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error('Nombre requerido');
    }
  }

  // Factory method - Crea una nueva instancia
  static async create(email, password, name, role = 'estudiante') {
    // Validar
    this.validateEmail(email);
    this.validatePassword(password);
    this.validateName(name);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear instancia
    return new User(
      crypto.randomUUID(),
      email,
      passwordHash,
      name,
      role,
      new Date()
    );
  }

  // Comparar password (login)
  async comparePassword(password) {
    return await bcrypt.compare(password, this.passwordHash);
  }

  // Convertir a DTO para respuesta
  toDTO() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}
```

### Paso 3: Crear el CommandHandler

**`src/application/command-handlers/CreateUserCommandHandler.js`**
```javascript
import { User } from '../domain/entities/User.js';

export class CreateUserCommandHandler {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async handle(command) {
    try {
      // Verificar si usuario existe
      const existingUser = await this.userRepository.findByEmail(command.email);
      if (existingUser) {
        throw new Error('Email ya está registrado');
      }

      // Crear entidad de dominio (validaciones aquí)
      const user = await User.create(
        command.email,
        command.password,
        command.name,
        command.role
      );

      // Persistir
      const savedUser = await this.userRepository.save(user);

      // Retornar resultado
      return {
        success: true,
        data: savedUser.toDTO(),
        message: 'Usuario creado exitosamente'
      };
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }
}
```

### Paso 4: Crear el Repository

**`src/infrastructure/persistence-write/MongoUserRepository.js`**
```javascript
import User from '../../../models/User.js'; // Mongoose model

export class MongoUserRepository {
  async save(user) {
    const userDoc = new User({
      _id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });

    await userDoc.save();
    return user;
  }

  async findByEmail(email) {
    const userDoc = await User.findOne({ email });
    if (!userDoc) return null;

    return new User(
      userDoc._id,
      userDoc.email,
      userDoc.passwordHash,
      userDoc.name,
      userDoc.role,
      userDoc.createdAt
    );
  }

  async findById(id) {
    const userDoc = await User.findById(id);
    if (!userDoc) return null;

    return new User(
      userDoc._id,
      userDoc.email,
      userDoc.passwordHash,
      userDoc.name,
      userDoc.role,
      userDoc.createdAt
    );
  }
}
```

### Paso 5: Crear el Controller

**`src/api/controllers/UserController.js`**
```javascript
import { CreateUserCommand } from '../application/commands/CreateUserCommand.js';

export class UserController {
  constructor(commandBus, queryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  async createUser(req, res) {
    try {
      const { email, password, name, role } = req.body;

      // Crear command
      const command = new CreateUserCommand(email, password, name, role);

      // Ejecutar
      const result = await this.commandBus.execute(command);

      // Responder
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
```

---

## Guía de Migración

### Para cada microservicio:

1. **Generar estructura automáticamente**
   ```bash
   npm run cqrs:generate
   ```

2. **Copiar ejemplos del micro-auth**
   - Commands: `CreateUserCommand`, `UpdateUserCommand`
   - Handlers: `CreateUserCommandHandler`, `UpdateUserCommandHandler`
   - Entities: `User.js` con métodos de dominio

3. **Adaptar al dominio específico**
   - Cambiar nombres: `User` → `Estudiante`, `Maestro`, etc.
   - Cambiar validaciones según reglas del negocio
   - Cambiar campos específicos del microservicio

4. **Integrar CQRS Bus**
   ```javascript
   import { createCQRSBus } from '../infrastructure/config/cqrs-bus.js';
   const { commandBus, queryBus } = createCQRSBus();
   ```

5. **Reemplazar llamadas directas**
   - Antes: `const result = userService.createUser(data);`
   - Después: `const result = await commandBus.execute(new CreateUserCommand(data));`

---

## Status de Implementación

| Microservicio | CQRS | Commands | Queries | Handlers | Status |
|--------------|------|----------|---------|----------|--------|
| micro-auth | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-estudiantes | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-maestros | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-reportes-estudiantes | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-reportes-maestros | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-notificaciones | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-analytics | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |
| micro-soap-bridge | ✅ | ✅ | ✅ | ✅ | 🟢 COMPLETO |

**Cobertura Total**: 8/8 (100%) ✅

---

## 🚀 Comandos Útiles

```bash
# Generar estructura CQRS en todos los microservicios
npm run cqrs:generate

# Validar que la estructura sea correcta
npm run cqrs:validate

# Regenerar si algo se corrompe
npm run cqrs:regenerate

# Ver status actual
npm run cqrs:status
```

---

**Última revisión**: 20 Enero 2026  
**Próximas acciones**: Monitoreo automático en GitHub Actions
