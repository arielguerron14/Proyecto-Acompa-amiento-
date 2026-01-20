# Turborepo Monorepo Setup

This is a **Turborepo** monorepo with the following structure:

## 📁 Project Structure

```
.
├── apps/
│   ├── api-gateway/              # Main API Gateway (Express)
│   ├── micro-auth/               # Authentication microservice (CQRS)
│   ├── micro-estudiantes/        # Students microservice (CQRS)
│   ├── micro-maestros/           # Teachers microservice (CQRS)
│   ├── micro-reportes-estudiantes/ # Student reports (CQRS)
│   ├── micro-reportes-maestros/  # Teacher reports (CQRS)
│   ├── micro-analytics/          # Analytics service (CQRS)
│   ├── micro-notificaciones/     # Notifications service (CQRS)
│   └── micro-soap-bridge/        # SOAP legacy bridge (CQRS)
├── packages/
│   ├── shared-auth/              # Shared authentication utilities
│   ├── shared-config/            # Shared configuration
│   └── shared-monitoring/        # Shared monitoring & logging
├── monitoring/                   # Prometheus configuration
├── databases/                    # Database Docker Compose
├── turbo.json                    # Turbo Repo configuration
├── package.json                  # Root package with workspaces
└── docker-compose.yml            # Main Docker Compose
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Development
Run all services in development mode:
```bash
npm run dev
```

### Build
Build all packages and apps:
```bash
npm run build
```

### Docker
```bash
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop containers
npm run docker:ps        # View container status
npm run docker:logs      # View logs
npm run docker:rebuild   # Clean build and restart
```

## 📦 Turborepo Commands

### Build with Turbo
```bash
turbo run build          # Build all apps/packages
turbo run build --scope=micro-auth  # Build specific package
turbo run build --concurrency=4     # Control parallelization
```

### Develop with Watch
```bash
turbo run dev --watch    # Watch mode for all packages
turbo run dev --parallel # Parallel execution
```

### Run Tests
```bash
npm run test             # Run all tests
npm run test:watch      # Watch mode
```

### Lint
```bash
npm run lint            # Run linter
npm run lint:fix        # Fix linting issues
```

### Clean
```bash
npm run clean           # Remove all build artifacts
npm run clean:dist      # Remove dist folders
```

## 🏗️ Turborepo Task Graph

The following tasks are defined in `turbo.json`:

| Task | Type | Dependencies | Cached |
|------|------|--------------|--------|
| `build` | Sequential | `^build` (dependencies first) | ✅ |
| `dev` | Parallel | None | ❌ (persistent) |
| `lint` | Sequential | `^lint` | ✅ |
| `test` | Sequential | `^build` | ✅ |
| `start` | Parallel | None | ❌ (persistent) |
| `docker:build` | Sequential | `^build` | ✅ |

## 🔄 Monorepo Features

### Workspace Configuration
- **Root workspaces**: `apps/*` and `packages/*`
- **npm workspaces**: Automatic dependency linking
- **Dependency resolution**: `file:` protocol for local packages

### Shared Packages
- `@proyecto/shared-auth`: Authentication & RBAC utilities
- `@proyecto/shared-config`: Configuration management
- `@proyecto/shared-monitoring`: Logging & monitoring

### Infrastructure
- **Messaging**: Kafka + RabbitMQ + Zookeeper
- **Databases**: MongoDB, PostgreSQL, Redis
- **Monitoring**: Prometheus + Grafana

## 📊 Docker Services

### Messaging & Coordination
- `zookeeper`: Cluster coordination (port 2181)
- `kafka`: Event streaming (port 9092)
- `rabbitmq`: Message queue (port 5672, UI on 15672)

### Monitoring
- `prometheus`: Metrics (port 9090)
- `grafana`: Dashboards (port 3000, admin/admin)

### Databases
- `mongo`: MongoDB (port 27017)
- (PostgreSQL & Redis in `databases/docker-compose.yml`)

### Microservices
- `api-gateway`: REST API (port 8080)
- `micro-*`: Individual services (ports 3000-5008)

## 🔗 Dependencies Between Services

```
api-gateway
  ├── micro-auth
  ├── micro-estudiantes
  ├── micro-maestros
  ├── micro-reportes-estudiantes
  ├── micro-reportes-maestros
  ├── micro-analytics
  ├── micro-notificaciones
  └── micro-soap-bridge
```

All services depend on:
- `@proyecto/shared-auth` (authentication)
- `@proyecto/shared-config` (configuration)
- `@proyecto/shared-monitoring` (logging)

## 🛠️ CQRS Architecture

Each microservice implements CQRS pattern:
- **CommandBus**: Handles write operations
- **QueryBus**: Handles read operations
- **Handlers**: Command and Query handlers
- **Repositories**: Data persistence layer

## 📝 Useful Commands

### View Turbo Graph
```bash
turbo build --graph    # Generate dependency graph
```

### Run Specific Package
```bash
turbo run build --filter=micro-auth
turbo run dev --filter=@proyecto/shared-auth
```

### Clean and Rebuild
```bash
npm run clean:dist && npm run build
```

## 🐳 Docker Compose Profiles

Run specific service groups:
```bash
docker-compose up -d --profile messaging   # Kafka + RabbitMQ
docker-compose up -d --profile monitoring  # Prometheus + Grafana
docker-compose up -d --profile services    # All microservices
```

## 📚 Additional Resources

- [Turborepo Documentation](https://turbo.build/)
- [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Docker Compose](https://docs.docker.com/compose/)

---

**Last updated**: 2026-01-20
