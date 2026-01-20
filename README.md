# Proyecto Acompañamiento - Sistema de Gestión Educativa

Sistema moderno de **microservicios con Turborepo Monorepo** para la gestión de estudiantes, maestros, horarios y reportes de acompañamiento educativo. Implementado con Node.js, Express, MongoDB y principios SOLID.

### 📚 Documentación Principal
- **[📐 Arquitectura CQRS](./ARCHITECTURE_CQRS.md)** - Patrón CQRS completo, flujos, ejemplos
- **[🚀 Turborepo Monorepo](./TURBOREPO_DOCUMENTATION.md)** - Setup, comandos, performance
- **[⚙️ Configuración de Ambiente](./env.template)** - Template para variables de entorno

## 🚀 Inicio Rápido (Docker)

### Requisitos Mínimos
- Docker & Docker Compose
- (Opcional) Node.js 18+ para desarrollo local

### Instalación y Ejecución
```bash
# 1. Clonar el proyecto
git clone <repo-url>
cd Proyecto-Acompa-amiento-

# 2. Levantar todos los servicios con Docker
docker-compose up -d

# 3. Verificar servicios
docker-compose ps

# Para parar
docker-compose down
```

### Acceso a Servicios
- **API Gateway** (Punto de entrada): http://localhost:8080
- **MongoDB**: mongodb://localhost:27017
- **Documentación**: [Ver QUICK_START.md](./QUICK_START.md)

## 🎯 Estructura de Proyecto - Turborepo Monorepo

```
Proyecto-Acompañamiento/
├── apps/
│   ├── api-gateway/           # Puerta de entrada única (puerto 8080)
│   ├── frontend-web/          # Interfaz web
│   ├── micro-auth/            # Autenticación (puerto 3000)
│   ├── micro-estudiantes/     # Gestión de estudiantes (puerto 3001)
│   ├── micro-maestros/        # Gestión de maestros (puerto 3002)
│   ├── micro-notificaciones/  # Notificaciones
│   ├── micro-reportes-estudiantes/
│   ├── micro-reportes-maestros/
│   ├── micro-analytics/       # Analytics
│   └── micro-soap-bridge/     # Integración SOAP
│
├── packages/
│   ├── shared-auth/           # Middleware y utilitarios de autenticación
│   ├── shared-config/         # Configuración centralizada
│   └── shared-monitoring/     # Logging y métricas
│
├── turbo.json                 # Configuración de Turborepo
├── package.json               # Root con npm workspaces
└── docker-compose.yml         # Orquestación de contenedores
```

## 📦 Comandos Disponibles

### Desarrollo Local
```bash
# Instalar dependencias (desde raíz)
npm install

# Iniciar todos los servicios en paralelo
npm run dev

# Build de todos los workspaces
npm run build

# Lint en todos los workspaces
npm run lint

# Tests en todos los workspaces
npm run test
```

### Docker
```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down

# Parar y eliminar volúmenes
docker-compose down -v
```

### Turborepo Específico
```bash
# Ejecutar build solo en dependencias de api-gateway
npm run turbo run build -- --scope api-gateway --include-dependencies

# Ver dependencias del monorepo
npm run turbo run build -- --graph
```

Arquitectura de microservicios con:
- ✅ API Gateway centralizado
- ✅ Autenticación JWT con RBAC
- ✅ Message brokers (RabbitMQ/Kafka/MQTT)
- ✅ Servicios independientes y escalables
- ✅ Monitoreo y logging centralizado

Ver [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) para más detalles o consulta [📐 ARCHITECTURE_CQRS.md](./ARCHITECTURE_CQRS.md) para implementación CQRS detallada.

## 🔐 Autenticación

Sistema de autenticación centralizado con:
- JWT (JSON Web Tokens)
- RBAC (Role-Based Access Control)
- Roles: admin, maestro, estudiante, auditor
- Tokens con expiración configurable

📖 Ver [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md) para guía completa.

## 📨 Servicios de Mensajería

Los servicios de mensajería están organizados en la carpeta `messaging/` con sus propias imágenes Docker:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Zookeeper** | 2181 | Coordinador para Kafka |
| **Kafka** | 9092/29092 | Event streaming distribuido |
| **RabbitMQ** | 5672/15672 | Message broker AMQP |
| **Kafka UI** | 8081 | Panel de control Kafka |

### Iniciar servicios de mensajería

```bash
cd messaging
docker-compose up -d
```

📖 Ver [messaging/README.md](./messaging/README.md) y [messaging/EXAMPLES.md](./messaging/EXAMPLES.md) para uso detallado.

## 📦 Estructura del Proyecto

```
├── api-gateway/              # Gateway API
├── micro-auth/               # Autenticación
├── micro-estudiantes/        # Estudiantes
├── micro-maestros/           # Maestros
├── micro-notificaciones/     # Notificaciones
├── micro-reportes-estudiantes/
├── micro-reportes-maestros/
├── micro-soap-bridge/        # SOAP Bridge
├── micro-analytics/          # Analytics
├── messaging/                # Servicios de mensajería
│   ├── zookeeper/
│   ├── kafka/
│   ├── rabbitmq/
│   └── docker-compose.yml
├── databases/                # Bases de datos
├── monitoring/               # Monitoreo (Prometheus/Grafana)
├── shared-auth/              # Auth compartido
├── shared-monitoring/        # Monitoreo compartido
├── frontend-web/             # Frontend
└── [config y documentación]
```

## 🎯 Características

✅ **Microservicios Escalables**  
✅ **Autenticación Segura con RBAC**  
✅ **Mensajería Asincrónica**  
✅ **Monitoreo Centralizado**  
✅ **Código Limpio (SOLID)**  
✅ **79% Menos Código Duplicado (DRY)**  

## 🧪 Testing

```bash
npm test                # Ejecutar tests
npm run test:coverage   # Tests con cobertura
npm run test:watch     # Tests en modo watch
```

Ver [TESTING.md](./TESTING.md) para más detalles.

## 📚 Documentación Importante

| Documento | Descripción |
|-----------|------------|
| [INDEX.md](./INDEX.md) | Índice completo |
| [QUICKSTART.md](./QUICKSTART.md) | Inicio rápido |
| [AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md) | Autenticación |
| [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) | Arquitectura |
| [MICROSERVICES_GUIDE.md](./MICROSERVICES_GUIDE.md) | Microservicios |
| [TEST_VALIDATION_REPORT.md](./TEST_VALIDATION_REPORT.md) | Validación |
| [REFACTORING_DESIGN_PRINCIPLES.md](./REFACTORING_DESIGN_PRINCIPLES.md) | Principios |

## 💻 Desarrollo

```bash
# Copiar variables de entorno
cp .env.example .env

# Con Docker Compose
docker-compose up -d

# O servicios individuales
cd micro-auth && npm start
cd api-gateway && npm start
```

## 🔧 Configuración

Archivos principales:
- **docker-compose.yml** - Orquestación local
- **docker-compose.prod.yml** - Producción
- **.env.example** - Variables de entorno
- **mqtt-config.conf** - MQTT config

## 📝 Principios de Diseño

✅ **SOLID** - Principios SOLID implementados  
✅ **DRY** - 79% código duplicado eliminado  
✅ **KISS** - Simplicidad en diseño  
✅ **GRASP** - Patrones de asignación  
✅ **YAGNI** - Solo lo necesario  

Ver [REFACTORING_DESIGN_PRINCIPLES.md](./REFACTORING_DESIGN_PRINCIPLES.md) para detalles.

## ☁️ Despliegue en AWS EC2

Nuestro proyecto incluye un **Workflow de GitHub Actions con descubrimiento dinámico de IPs**. No requiere hardcoding de direcciones IP.

### Características del Despliegue
✅ **IPs Dinámicas** - Detecta automáticamente IPs públicas y privadas  
✅ **Routing Inteligente** - IP pública para SSH, IP privada para inter-servicio  
✅ **Multi-Cuenta** - Funciona en cualquier cuenta AWS  
✅ **Automático** - Build, deploy y verificación automáticas  

### Guía Rápida

**1. Configura GitHub Secrets:**
```bash
# Usa el script interactivo
python3 setup-github-secrets.py

# O ingresa manualmente en:
# Settings → Secrets and variables → Actions
```

Requiere:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (opcional)
- `SSH_PRIVATE_KEY` (base64)

**2. Etiqueta tus instancias EC2:**
```
Tag: Name = "EC2-CORE"
Tag: Name = "EC2-API-GATEWAY"
(etc.)
```

**3. Ejecuta el workflow:**
```
GitHub → Actions → Deploy to EC2 (Dynamic IP Discovery) → Run workflow
```

### Documentación Completa
- 📖 [QUICK_START.md](./QUICK_START.md) - Checklist paso a paso
- 📖 [WORKFLOW_SETUP.md](./WORKFLOW_SETUP.md) - Configuración detallada
- 📖 [IP_ROUTING_STRATEGY.md](./IP_ROUTING_STRATEGY.md) - Teoría de networking
- 📖 [SOLUTION_SUMMARY.md](./SOLUTION_SUMMARY.md) - Resumen de cambios

## 🚨 Troubleshooting

### Despliegue en AWS

**Error: "No running instance found"**
- Verifica que la instancia esté en estado "running"
- Confirma que tenga el tag Name configurado
- Revisa que esté en la región correcta

**Error: "SSH access denied"**
- Verifica que SSH_PRIVATE_KEY esté en base64
- Confirma que el archivo .pem es válido
- Intenta SSH manualmente: `ssh -i key.pem ubuntu@PUBLIC_IP`

**Servicios no inician**
- SSH a la instancia
- Revisa logs: `docker-compose logs [servicio]`
- Verifica security groups permiten el tráfico

Ver [WORKFLOW_SETUP.md](./WORKFLOW_SETUP.md) "Troubleshooting" para más detalles.

### Desarrollo Local

**Puerto en uso**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**MongoDB no conecta**
```bash
docker-compose ps
docker-compose restart
```

## 📞 Soporte

1. Consulta [INDEX.md](./INDEX.md)
2. Revisa logs: `docker-compose logs [servicio]`
3. Ejecuta tests: `npm test`

---

**Última actualización**: 2025-12-10  
**Versión**: 2.0 (Refactorizado)  
**Estado**: ✅ Production Ready
# Trigger
