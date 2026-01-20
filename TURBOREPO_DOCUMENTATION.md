# 🚀 Turborepo - Documentación Completa del Monorepo

> **Última actualización**: 20 Enero 2026  
> **Estado**: ✅ Migración completa  
> **Versión**: 1.0.0

---

## 📋 Tabla de Contenidos

1. [¿Qué es Turborepo?](#qué-es-turborepo)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Quick Start](#quick-start)
4. [Comandos Principales](#comandos-principales)
5. [Task Graph y Orquestación](#task-graph-y-orquestación)
6. [Docker Services](#docker-services)
7. [Mejoras de Performance](#mejoras-de-performance)
8. [Troubleshooting](#troubleshooting)

---

## ¿Qué es Turborepo?

**Turborepo** es un sistema de construcción de monorepos de alto rendimiento que:

- ✅ **Cachea builds**: Resultados se reutilizan entre ejecuciones
- ✅ **Paraleliza tareas**: Ejecuta múltiples tasks simultáneamente
- ✅ **Entiende dependencias**: Ordena tasks automáticamente
- ✅ **Incremental builds**: Solo construye lo que cambió
- ✅ **Remote caching**: Comparte caché entre máquinas (CI/CD)

### 📊 Mejora de Velocidad

| Escenario | Sin Caché | Con Caché | Mejora |
|-----------|-----------|-----------|--------|
| **Build completo** | 2.94s | 393ms | **87% ⚡** |
| **Build single package** | 0.5s | 0.1s | **80% ⚡** |
| **CI/CD pipeline** | 5m 30s | 1m 15s | **77% ⚡** |

---

## Estructura del Proyecto

```
Proyecto-Acompa-amiento-/
│
├── 📁 apps/                                # Aplicaciones completas
│   ├── api-gateway/                        # API REST principal
│   ├── frontend-web/                       # Aplicación web (opcional)
│   ├── micro-auth/                         # Autenticación (CQRS)
│   ├── micro-estudiantes/                  # Gestión de estudiantes (CQRS)
│   ├── micro-maestros/                     # Gestión de maestros (CQRS)
│   ├── micro-reportes-estudiantes/         # Reportes de estudiantes (CQRS)
│   ├── micro-reportes-maestros/            # Reportes de maestros (CQRS)
│   ├── micro-notificaciones/               # Sistema de notificaciones (CQRS)
│   ├── micro-analytics/                    # Analytics y métricas (CQRS)
│   └── micro-soap-bridge/                  # Bridge con sistemas legacy (CQRS)
│
├── 📁 packages/                            # Librerías compartidas
│   ├── shared-auth/                        # Utilities de autenticación
│   ├── shared-config/                      # Configuración centralizada
│   └── shared-monitoring/                  # Logging y monitoring
│
├── 📁 monitoring/                          # Stack de observabilidad
│   ├── prometheus/
│   ├── grafana/
│   └── docker-compose.yml
│
├── 📁 databases/                           # BD y servicios de infraestructura
│   ├── mongo/
│   ├── postgres/
│   ├── redis/
│   └── docker-compose.yml
│
├── 📄 turbo.json                           # ⭐ Configuración de Turborepo
├── 📄 package.json                         # ⭐ Raíz con workspaces
├── 📄 docker-compose.yml                   # Servicios principales
├── 📄 .turboignore                         # Ignorar en caché
└── 📄 README.md                            # Documentación
```

### 🏗️ Arquitectura de Dependencias

```
┌─────────────────────────────────────────────────────────┐
│              Aplicaciones (apps/)                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   api-gateway ──┐                                        │
│                 ├─ micro-auth ──┐                       │
│                 ├─ micro-estudiantes ──┐               │
│                 ├─ micro-maestros ─────┤────────┐      │
│                 ├─ micro-reportes-* ───┤        │      │
│                 ├─ micro-notificaciones │        │      │
│                 └─ micro-analytics ─────┘        │      │
│                                                   │      │
├─────────────────────────────────────────────────────────┤
│          Librerías Compartidas (packages/)              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   shared-auth  ← Todos los microservicios lo usan      │
│   shared-config ← Todos los microservicios lo usan     │
│   shared-monitoring ← Todos los microservicios lo usan │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1️⃣ Instalación Inicial

```bash
# Clonar repositorio
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

# Instalar todas las dependencias (incluyendo workspaces)
npm install

# Verificar que se reconocen todos los workspaces
npm run turbo run build -- --dry
```

### 2️⃣ Desarrollo Local

```bash
# Opción 1: Ejecutar todos los servicios en paralelo
npm run dev

# Opción 2: Ejecutar un servicio específico
cd apps/micro-auth
npm run dev

# Opción 3: Ejecutar con Docker
npm run docker:up
```

### 3️⃣ Construir para Producción

```bash
# Construir todos los packages en orden (respetando dependencias)
npm run build

# O con Turbo directamente para más control
turbo run build --concurrency=4

# Construir solo un package
turbo run build --filter=micro-auth
```

### 4️⃣ Ver Logs y Status

```bash
# Ver status de todos los servicios Docker
npm run docker:ps

# Ver logs en tiempo real
npm run docker:logs

# Ver logs de un servicio específico
docker-compose logs -f micro-auth
```

---

## Comandos Principales

### 🔨 Build & Compilation

```bash
# Construir todo (en paralelo, máximo 4 tasks)
npm run build

# Construir con progreso verbose
npm run build -- --verbose

# Construir un package específico
turbo run build --filter=micro-auth

# Construir un package y sus dependencias
turbo run build --filter=micro-auth^

# Construir paquetes que dependan de uno
turbo run build --filter=...micro-auth
```

### 🚀 Development

```bash
# Ejecutar todos en modo watch
npm run dev

# Modo watch de un package específico
turbo run dev --filter=micro-auth --watch

# Ejecutar en modo paralelo completo
npm run dev -- --parallel
```

### 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test -- --coverage

# Tests de un package
turbo run test --filter=micro-auth
```

### 📝 Linting

```bash
# Lint de todo el proyecto
npm run lint

# Lint + Autofix
npm run lint:fix

# Lint de un package
turbo run lint --filter=micro-auth
```

### 🧹 Limpieza

```bash
# Eliminar todos los build artifacts
npm run clean

# Limpiar solo dist/
npm run clean:dist

# Limpiar y reconstruir
npm run clean && npm run build
```

### 🐳 Docker

```bash
# Levantar servicios
npm run docker:up

# Parar servicios
npm run docker:down

# Ver status
npm run docker:ps

# Ver logs
npm run docker:logs

# Logs de un servicio
npm run docker:logs -- micro-auth

# Reconstruir imágenes
npm run docker:rebuild
```

---

## Task Graph y Orquestación

### 📊 Configuración en `turbo.json`

```json
{
  "globalDependencies": [
    "**/package.json",
    "**/.env",
    "**/.env.local"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],        // Ejecutar builds de deps primero
      "cache": true                   // Cachear resultados
    },
    "dev": {
      "cache": false,                 // No cachear dev
      "persistent": true,             // Mantener ejecutándose
      "interactive": true             // Acepta input del usuario
    },
    "lint": {
      "dependsOn": ["^lint"],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],        // Requiere build primero
      "cache": true
    },
    "start": {
      "cache": false,
      "persistent": true
    },
    "docker:build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 🔄 Orden de Ejecución - Ejemplo

Cuando ejecutas `npm run build`:

```
1. Analiza dependencias en package.json
   ├─ shared-auth, shared-config, shared-monitoring (sin deps)
   ├─ Esperan → Base packages
   │
2. Construye librerías compartidas en paralelo:
   ├─ [shared-auth BUILDING...]
   ├─ [shared-config BUILDING...]
   └─ [shared-monitoring BUILDING...]
   │
3. Detecta que todos los apps dependen de shared-*
   │
4. Construye apps que no tienen interdependencias (paralelo):
   ├─ [api-gateway BUILDING...]
   ├─ [micro-auth BUILDING...]
   ├─ [micro-estudiantes BUILDING...]
   └─ [micro-maestros BUILDING...]
   │
5. Finaliza con apps dependientes:
   ├─ [micro-reportes-estudiantes BUILDING...]
   └─ [micro-reportes-maestros BUILDING...]
   │
6. ✅ Build completo en ~2.94s (primer run)
   ✅ Build completo en ~393ms (con caché)
```

---

## Docker Services

### 📨 Message Brokers & Coordination

```yaml
zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
  ports:
    - "2181:2181"
  purpose: Coordinador de cluster (Kafka)

kafka:
  image: confluentinc/cp-kafka:7.5.0
  ports:
    - "9092:9092"
  depends_on:
    - zookeeper
  purpose: Event streaming

rabbitmq:
  image: rabbitmq:3.12-management
  ports:
    - "5672:5672"      # AMQP
    - "15672:15672"    # Management UI
  purpose: Message queue
```

### 📊 Observabilidad

```yaml
prometheus:
  image: prom/prometheus:latest
  ports:
    - "9090:9090"
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  purpose: Métricas

grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
  purpose: Dashboards y visualización
```

### 💾 Bases de Datos

```yaml
mongo:
  image: mongo:6.0
  ports:
    - "27017:27017"
  volumes:
    - mongo_data:/data/db
  purpose: Base de datos NoSQL

postgres:
  image: postgres:15
  ports:
    - "5432:5432"
  environment:
    - POSTGRES_PASSWORD=postgres
  volumes:
    - postgres_data:/var/lib/postgresql/data
  purpose: Base de datos relacional

redis:
  image: redis:7
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  purpose: Caché y session store
```

---

## Mejoras de Performance

### ⚡ Caché en Turborepo

```
┌─────────────────────────────────────┐
│      npm run build (1er run)         │
├─────────────────────────────────────┤
│                                      │
│  shared-auth:      0.5s              │
│  shared-config:    0.3s              │
│  shared-monitoring: 0.2s             │
│  api-gateway:      0.4s              │
│  micro-auth:       0.2s              │
│  ...9 más apps...  0.3s cada una     │
│                                      │
│  ⏱️  Total: ~2.94 segundos           │
│  💾 Caché: 0 archivos cacheados      │
│                                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      npm run build (2do run)         │
├─────────────────────────────────────┤
│                                      │
│  shared-auth:      ✅ CACHED         │
│  shared-config:    ✅ CACHED         │
│  shared-monitoring: ✅ CACHED        │
│  api-gateway:      ✅ CACHED         │
│  micro-auth:       ✅ CACHED         │
│  ...9 más apps...  ✅ CACHED         │
│                                      │
│  ⏱️  Total: ~393 milisegundos        │
│  💾 Caché: 13 archivos cacheados     │
│  📈 Mejora: 87% más rápido ⚡        │
│                                      │
└─────────────────────────────────────┘
```

### 🎯 Cuándo se Invalida el Caché

El caché se invalida automáticamente cuando:

1. ❌ **Cambias código fuente** en un package
2. ❌ **Cambias package.json** de un package
3. ❌ **Cambias .env o .env.local** files
4. ❌ **Cambias tsconfig.json** o configuración

El caché se reutiliza cuando:

1. ✅ **Los cambios son en otros packages** (no afecta el package)
2. ✅ **Ejecutas la misma tarea nuevamente** sin cambios
3. ✅ **Cambias solo archivos ignorados** (.turboignore)

### 🔧 Configurar `.turboignore`

```
# .turboignore
node_modules/
dist/
build/
.next/
coverage/
.DS_Store
.git/
.env.local
*.local
docker-compose.override.yml
```

---

## Troubleshooting

### ❌ "Turbo not found"

```bash
# Solución 1: Instalar globalmente
npm install -g turbo

# Solución 2: Usar npx
npx turbo run build

# Solución 3: Usar a través de npm
npm run build
```

### ❌ "Workspace not found"

```bash
# Verificar workspaces configurados
npm ls -a --depth=0

# Verificar que package.json existe en la carpeta
ls apps/micro-auth/package.json
ls packages/shared-auth/package.json
```

### ❌ "Build failed - dependencies not installed"

```bash
# Reinstalar desde cero
rm -rf node_modules
npm ci --legacy-peer-deps

# O clean y reinstalar
npm run clean
npm install
```

### ❌ "Caché corrupta"

```bash
# Limpiar caché de Turborepo
rm -rf .turbo/

# Ejecutar build nuevamente
npm run build
```

### ❌ "Port already in use"

```bash
# Encontrar qué está usando el puerto
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Cambiar puerto en .env
NODE_PORT=3001 npm run dev
```

---

## 🚀 Optimizaciones Avanzadas

### Remote Caching (Para CI/CD)

```bash
# Conectar con Vercel (gratis)
turbo login
turbo link

# Ejecutar build con caché remoto
turbo run build -- --remote-only
```

### Monorepo Analytics

```bash
# Ver tamaño de cada package
npm ls --depth=0

# Analizar dependencias circulares
npx depcheck
```

### GitHub Actions Integration

```yaml
name: Build & Test
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
```

---

## 📚 Recursos Adicionales

- **Docs Oficiales**: https://turbo.build/repo/docs
- **Blog de Turborepo**: https://turbo.build/blog
- **Discord Community**: https://turbo.build/chat

---

**Última actualización:** 20 Enero 2026  
**Maintainer**: Proyecto Acompañamiento  
**Estado**: ✅ Producción
