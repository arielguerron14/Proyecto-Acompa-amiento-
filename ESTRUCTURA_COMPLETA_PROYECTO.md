# 📁 ESTRUCTURA COMPLETA DEL PROYECTO - Acompañamiento Académico

**Fecha**: 2026-01-05 | **Versión**: 1.0 | **Estado**: Completo

---

## 📊 Índice General

1. [Descripción General](#descripción-general)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Microservicios](#microservicios)
4. [Frontend](#frontend)
5. [Bases de Datos](#bases-de-datos)
6. [Infraestructura](#infraestructura)
7. [Documentación](#documentación)
8. [Scripts y Automatización](#scripts-y-automatización)
9. [Archivos Clave](#archivos-clave)

---

## 📋 Descripción General

**Proyecto**: Sistema de Acompañamiento Académico
**Arquitectura**: Microservicios con Node.js + MongoDB + PostgreSQL
**Infraestructura**: AWS Académico (EC2s)
**Herramientas**: Docker, GitHub Actions, Prometheus, Grafana

**Stack Tecnológico**:
- Backend: Express.js, Node.js
- BD: MongoDB, PostgreSQL, Redis
- Frontend: HTML5 + Vanilla JS + Tailwind CSS
- Monitoreo: Prometheus + Grafana
- Mensajería: Kafka + RabbitMQ
- CI/CD: GitHub Actions

---

## 📂 Estructura de Carpetas

```
Proyecto-Acompa-amiento-/
│
├── 📘 DOCUMENTACIÓN (Raíz)
│   ├── INICIO.md ................................ 🎯 Punto de entrada
│   ├── README.md ................................ Documentación general
│   ├── CAMBIAR_IPS_RAPIDO.md ................... Guía rápida de IPs
│   ├── INDICE_DOCUMENTACION.md ................. Mapa de documentos
│   ├── ESTADO_FINAL_SISTEMA.md ................. Resumen ejecutivo
│   ├── MONITOREO_IP_CONSUMO.md ................. Análisis de monitoreo
│   ├── PROCEDIMIENTO_CAMBIAR_IPS.md ............ Guía paso a paso
│   ├── INFRASTRUCTURE_CONFIG_GUIDE.md .......... Guía técnica
│   ├── README_INFRAESTRUCTURA.md ............... Descripción de sistema
│   ├── IMPLEMENTACION_COMPLETADA.md ............ Resumen técnico
│   ├── INFRASTRUCTURE_CONFIG_SETUP.md .......... Guía de instalación
│   ├── QUICK_START.md ........................... Inicio rápido
│   ├── DOCUMENTACION_TECNICA_COMPLETA.md ....... Documentación completa
│   ├── HEALTH_CHECK_REPORT.md .................. Reporte de salud
│   ├── INFORME_COMPLETO_PROYECTO.md ............ Informe completo
│   ├── REQUIREMENTS_COMPLIANCE_MATRIX.md ....... Matriz de cumplimiento
│   └── MICROSERVICES_GUIDE.md .................. Guía de microservicios
│
├── ⚙️ CONFIGURACIÓN CENTRALIZADA
│   ├── infrastructure.config.js ................ 🔑 Configuración central
│   ├── .env.infrastructure ..................... Variables de IPs
│   ├── .env (generado) ......................... Compilado automático
│   ├── .env.generated .......................... Referencia generada
│   ├── docker-entrypoint.sh .................... Entry point Docker
│   ├── docker-compose.yml ....................... Orquestación local
│   ├── docker-compose.dev.yml .................. Desarrollo
│   ├── docker-compose.prod.yml ................. Producción
│   ├── docker-compose.web.yml .................. Web services
│   └── .dockerignore ........................... Ignorar en Docker
│
├── 🤖 SCRIPTS DE AUTOMATIZACIÓN
│   └── scripts/
│       ├── build-infrastructure.js ............ Compilar configuración
│       ├── validate-infrastructure.js ........ Validar config
│       ├── gen-config.js ..................... Generador de config
│       ├── start-stack.ps1 ................... Iniciar stack (PowerShell)
│       ├── start.ps1 ......................... Iniciar servicios
│       └── set_token.js ...................... Configurar tokens
│
├── 🔄 CI/CD - GitHub Actions
│   └── .github/workflows/
│       ├── deploy-api-gateway.yml ............ Deploy API Gateway
│       ├── deploy-core-microservices.yml .... Deploy core
│       ├── deploy-frontend.yml .............. Deploy frontend
│       ├── deploy-frontend-new-ips.yml ...... Deploy con nuevas IPs
│       ├── deploy-monitoring.yml ............ Deploy monitoreo
│       ├── deploy-reportes.yml .............. Deploy reportes
│       ├── deploy-reportes-fix.yml .......... Fix de reportes
│       └── fix-reportes-routing.yml ......... Fix de routing
│
├── 🔐 MICROSERVICIOS PRINCIPALES
│
│   ├── micro-auth/ ............................. Autenticación
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   └── index.js .................. Configuración
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── middlewares/
│   │   │   └── utils/
│   │   ├── __tests__/ ........................ Tests Jest
│   │   ├── Dockerfile ........................ Imagen Docker
│   │   ├── package.json ...................... Dependencias
│   │   ├── server.js ......................... Servidor principal
│   │   ├── README.md ......................... Documentación
│   │   └── node_modules/ ..................... Dependencias instaladas
│   │
│   ├── micro-estudiantes/ ..................... Gestión estudiantes
│   │   ├── src/
│   │   │   ├── config/ ....................... Configuración
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── database/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── README.md
│   │   └── node_modules/
│   │
│   ├── micro-maestros/ ........................ Gestión maestros
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── database/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── README.md
│   │   └── node_modules/
│   │
│   ├── micro-notificaciones/ ................. Notificaciones
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   └── routes/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   ├── micro-reportes-estudiantes/ .......... Reportes estudiantes
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── database/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   ├── micro-reportes-maestros/ ............ Reportes maestros
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── database/
│   │   │   └── services/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   ├── micro-analytics/ ..................... Analytics
│   │   ├── src/
│   │   │   ├── consumers/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── config/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   ├── micro-core/ ........................... Core services
│   │
│   ├── micro-soap-bridge/ ................... SOAP Bridge
│   │
│   └── api-gateway/ .......................... 🚪 API Gateway
│       ├── src/
│       │   ├── config/ ....................... Configuración
│       │   ├── routes/
│       │   │   ├── authRoutes.js
│       │   │   ├── maestrosRoutes.js
│       │   │   ├── estudiantesRoutes.js
│       │   │   ├── reportesRoutes.js
│       │   │   ├── notificacionesRoutes.js
│       │   │   └── healthRoutes.js
│       │   ├── middlewares/
│       │   ├── utils/
│       │   └── services/
│       ├── server.js ........................ Servidor principal
│       ├── Dockerfile ...................... Imagen Docker
│       ├── package.json
│       ├── README.md
│       └── node_modules/
│
├── 💻 FRONTEND
│   └── frontend-web/ ......................... Aplicación web
│       ├── index.html ...................... Home
│       ├── maestro.html .................... Vista maestros
│       ├── estudiante.html ................. Vista estudiantes
│       ├── dashboard.html .................. Dashboard
│       ├── test-reportes.html .............. Test reportes
│       ├── debug-api.html .................. Debug API
│       ├── css/
│       │   └── styles.css
│       ├── js/
│       │   ├── config.js ................... Configuración
│       │   ├── api.js ...................... Cliente API
│       │   ├── auth.js ..................... Autenticación
│       │   ├── maestros.js ................. Lógica maestros
│       │   ├── estudiantes.js .............. Lógica estudiantes
│       │   └── utils.js .................... Utilidades
│       ├── public/ ......................... Archivos estáticos
│       ├── Dockerfile
│       ├── server.js ....................... Servidor web
│       ├── package.json
│       ├── tailwind.config.js .............. Tailwind config
│       ├── eslint.config.js ................ ESLint config
│       ├── prettier.config.js .............. Prettier config
│       ├── node_modules/
│       └── README.md
│
├── 🗄️ BASES DE DATOS
│   └── databases/
│       ├── docker-compose.yml .............. Orquestación BD
│       ├── Dockerfile ..................... Imagen principal
│       ├── ci-trigger.txt ................. Trigger CI
│       │
│       ├── mongodb/ ........................ MongoDB
│       │   ├── init-mongo.js .............. Inicialización
│       │   ├── seed.js .................... Datos iniciales
│       │   └── backups/ ................... Respaldos
│       │
│       ├── postgres/ ....................... PostgreSQL
│       │   ├── init.sql ................... Esquema
│       │   ├── seed.sql ................... Datos iniciales
│       │   └── migrations/ ................ Migraciones
│       │
│       └── redis/ .......................... Redis
│           └── conf/ ....................... Configuración
│
├── 📨 MENSAJERÍA
│   └── messaging/ ........................... Kafka + RabbitMQ
│       ├── docker-compose.yml ............ Orquestación
│       ├── start.sh ....................... Iniciar
│       ├── test.sh ........................ Pruebas
│       ├── EXAMPLES.md .................... Ejemplos
│       ├── README.md
│       │
│       ├── kafka/
│       │   ├── config/ .................... Configuración
│       │   └── topics/ .................... Temas
│       │
│       ├── rabbitmq/ ...................... RabbitMQ
│       │   ├── config/ .................... Configuración
│       │   └── queues/ .................... Colas
│       │
│       └── zookeeper/ ..................... Zookeeper
│           └── conf/ ...................... Configuración
│
├── 📊 MONITOREO
│   └── monitoring/ .......................... Prometheus + Grafana
│       ├── docker-compose.yml ............ Orquestación
│       ├── README.md ...................... Documentación
│       ├── datasource.yml ................ Datasources Grafana
│       ├── prometheus.yml ................ Configuración Prometheus
│       │
│       ├── prometheus/ .................... Prometheus
│       │   ├── config/ .................... Configuración
│       │   └── rules/ ..................... Reglas de alertas
│       │
│       ├── grafana/ ....................... Grafana
│       │   ├── dashboards/ ................ Dashboards
│       │   ├── provisioning/ .............. Provisioning
│       │   └── config/ .................... Configuración
│       │
│       ├── mqtt-config.conf/ .............. MQTT Config
│       └── shared-monitoring/ ............ Módulo compartido
│           ├── src/
│           │   └── metrics.js ............ Métricas
│           ├── package.json
│           └── node_modules/
│
├── 📦 MÓDULOS COMPARTIDOS
│   ├── shared-auth/ ......................... Autenticación compartida
│   │   ├── src/
│   │   │   ├── constants/
│   │   │   │   └── roles.js .............. Roles de usuario
│   │   │   ├── middlewares/
│   │   │   │   ├── authMiddleware.js
│   │   │   │   ├── errorHandler.js
│   │   │   │   └── logger.js
│   │   │   ├── services/
│   │   │   │   └── authService.js
│   │   │   └── index.js
│   │   ├── node_modules/
│   │   ├── package.json
│   │   ├── README.md
│   │   └── .env.example
│   │
│   └── shared-monitoring/ .................. Monitoreo compartido
│       ├── src/
│       │   └── metrics.js
│       ├── package.json
│       └── node_modules/
│
├── 🧪 TESTING Y VALIDATION
│   ├── test-server.js ...................... Test servidor
│   ├── test-api.html ....................... Test API HTML
│   ├── test-put.js ......................... Test PUT
│   ├── test-reportes.js .................... Test reportes
│   ├── test-reportes.html .................. Test reportes HTML
│   ├── test-reserva.json ................... Datos test
│   ├── PRUEBAS_README.md .................... Guía de pruebas
│   ├── BROWSER_TEST.md ..................... Test en navegador
│   ├── HEALTH_CHECK_REPORT.md .............. Reporte de salud
│   ├── post-deployment-test.sh ............ Test post-despliegue
│   ├── diagnose-failed-containers.ps1 .... Diagnosticar
│   └── smoke-trigger.txt ................... Smoke test trigger
│
├── 🛠️ HERRAMIENTAS Y UTILIDADES
│   ├── convert_objectid.js ................. Convertir ObjectID
│   ├── insert_sample.js .................... Insertar datos
│   ├── update_cmd.js ....................... Comando update
│   ├── verificar-datos.js .................. Verificar datos
│   ├── set_token.js ........................ Establecer token
│   ├── deploy-reportes-fix.sh ............ Script deploy
│   └── debug-browser.js .................... Debug navegador
│
├── 📋 CONFIGURACIÓN Y CONTROL DE VERSIONES
│   ├── package.json ......................... NPM principal
│   ├── .gitignore ........................... Git ignore
│   ├── .gitattributes ....................... Git attributes
│   ├── .env.example ......................... Ejemplo env
│   ├── .env.infrastructure ................. Variables IPs
│   └── .dockerignore ........................ Docker ignore
│
└── 📚 DOCUMENTACIÓN ADICIONAL
    ├── MESSAGING_REORGANIZATION.md .......... Reorganización mensajería
    └── TECHNICAL_DEBT.md .................... Deuda técnica

```

---

## 🔐 Microservicios (Detalle)

### 1️⃣ **micro-auth** (Puerto 3000)
**Propósito**: Autenticación y autorización
- Gestión de usuarios
- Generación de JWT tokens
- Validación de credenciales
- Integración con MongoDB

**Archivos Clave**:
- `server.js` - Punto de entrada
- `src/config/index.js` - Configuración (IP MongoDB)
- `src/services/authService.js` - Lógica de autenticación
- `src/routes/` - Endpoints REST

---

### 2️⃣ **micro-estudiantes** (Puerto 3001)
**Propósito**: Gestión de estudiantes
- Crear/actualizar estudiantes
- Consultar información
- Gestionar reservas
- Integración con MongoDB y PostgreSQL

**Archivos Clave**:
- `src/config/index.js` - Configuración
- `src/models/` - Esquemas Mongoose
- `src/controllers/` - Lógica controladores
- `src/database/` - Conexiones BD

---

### 3️⃣ **micro-maestros** (Puerto 3002)
**Propósito**: Gestión de maestros
- Crear/actualizar maestros
- Gestionar disponibilidad
- Horarios y calendarios
- Integración con MongoDB y PostgreSQL

**Archivos Clave**:
- `src/config/index.js` - Configuración
- `src/models/` - Esquemas
- `src/controllers/` - Controladores
- `src/services/` - Servicios

---

### 4️⃣ **micro-notificaciones** (Puerto 5006)
**Propósito**: Sistema de notificaciones
- Envío de emails
- Push notifications
- SMS
- Integración con RabbitMQ/Kafka

**Archivos Clave**:
- `src/services/` - Servicios de notificación
- `src/routes/` - Endpoints
- `src/config/` - Configuración

---

### 5️⃣ **micro-reportes-estudiantes** (Puerto 5003)
**Propósito**: Reportes de estudiantes
- Generación de reportes
- Estadísticas académicas
- Exportación de datos

**Archivos Clave**:
- `src/database/index.js` - Conexión BD
- `src/controllers/` - Lógica reportes
- `src/routes/` - Endpoints

---

### 6️⃣ **micro-reportes-maestros** (Puerto 5004)
**Propósito**: Reportes de maestros
- Estadísticas de enseñanza
- Evaluaciones
- Generación de reportes

**Archivos Clave**:
- `src/database/index.js` - Conexión BD
- `src/controllers/` - Lógica reportes
- `src/routes/` - Endpoints

---

### 7️⃣ **micro-analytics** (Puerto 5007)
**Propósito**: Analytics
- Análisis de datos
- Métricas del sistema
- Consumo desde Kafka/RabbitMQ

**Archivos Clave**:
- `src/consumers/` - Consumidores de mensajes
- `src/services/` - Servicios de análisis
- `src/controllers/` - Endpoints

---

### 8️⃣ **api-gateway** (Puerto 8080)
**Propósito**: Puerta de entrada de la API
- Proxy reverso
- Enrutamiento de requests
- Autenticación centralizada
- Balance de carga

**Archivos Clave**:
- `server.js` - Servidor principal
- `src/config/index.js` - Rutas y URLs
- `src/routes/` - Definición de rutas
- `src/middlewares/` - Middlewares

---

## 💻 Frontend (frontend-web)

**Propósito**: Interfaz de usuario web

**Estructura**:
```
frontend-web/
├── index.html ........................ Página principal
├── maestro.html ..................... Panel maestros
├── estudiante.html .................. Panel estudiantes
├── dashboard.html ................... Dashboard
├── css/
│   └── styles.css ................... Estilos CSS
├── js/
│   ├── config.js .................... Configuración de IPs
│   ├── api.js ....................... Cliente HTTP
│   ├── auth.js ...................... Lógica autenticación
│   ├── maestros.js .................. Lógica de maestros
│   ├── estudiantes.js ............... Lógica estudiantes
│   └── utils.js ..................... Funciones utilitarias
├── public/ .......................... Archivos estáticos
├── Dockerfile ....................... Imagen Docker
├── server.js ........................ Servidor web
├── package.json ..................... Dependencias
└── README.md ........................ Documentación
```

---

## 🗄️ Bases de Datos

### MongoDB
- **Propósito**: BD de documentos (no relacional)
- **Ubicación**: AWS (13.220.99.207:27017)
- **Datos**:
  - Usuarios (auth)
  - Estudiantes
  - Maestros
  - Notificaciones
  - Reportes

### PostgreSQL
- **Propósito**: BD relacional
- **Ubicación**: AWS (13.220.99.207:5432)
- **Datos**:
  - Información académica
  - Horarios
  - Reservas

### Redis
- **Propósito**: Cache y sesiones
- **Ubicación**: AWS (13.220.99.207:6379)
- **Uso**:
  - Caché de sesiones
  - Rate limiting
  - Queues

---

## 📊 Monitoreo

### Prometheus (localhost:9090)
- Recolecta métricas de servicios
- Almacena datos de rendimiento
- Configuración: `monitoring/prometheus.yml`

### Grafana (localhost:3001)
- Visualización de métricas
- Dashboards personalizados
- Usuario: admin / Contraseña: admin

**No consume IP adicional** - Es totalmente local

---

## 🔄 CI/CD - GitHub Actions

**Workflows Disponibles**:

1. `deploy-api-gateway.yml` - Deploy del API Gateway
2. `deploy-core-microservices.yml` - Deploy microservicios core
3. `deploy-frontend.yml` - Deploy frontend
4. `deploy-monitoring.yml` - Deploy monitoreo
5. `deploy-reportes.yml` - Deploy reportes
6. Y más...

**Proceso**:
```
Push a GitHub
    ↓
GitHub Actions
    ↓
Build & Test
    ↓
Deploy a AWS EC2
    ↓
Containers iniciados
```

---

## 🤖 Scripts de Automatización

### **build-infrastructure.js**
Compila `.env.infrastructure` en `.env` con todas las variables

```bash
npm run build:infrastructure
```

### **validate-infrastructure.js**
Valida que toda la configuración esté correcta

```bash
npm run validate:infrastructure
```

### **gen-config.js**
Generador de configuración

```bash
npm run gen-config
```

---

## 📋 Archivos Clave

### Configuración Central
- `infrastructure.config.js` - 🔑 Fuente única de verdad para IPs
- `.env.infrastructure` - Variables de usuario
- `.env` - Compilado automático
- `docker-entrypoint.sh` - Entry point Docker

### Docker
- `docker-compose.yml` - Orquestación
- `docker-compose.dev.yml` - Desarrollo
- `docker-compose.prod.yml` - Producción

### Documentación Principal
- `INICIO.md` - Punto de entrada
- `README_INFRAESTRUCTURA.md` - Descripción del sistema
- `PROCEDIMIENTO_CAMBIAR_IPS.md` - Cómo cambiar IPs
- `INFRASTRUCTURE_CONFIG_GUIDE.md` - Guía técnica

---

## 🎯 Resumen de Carpetas Principales

| Carpeta | Propósito | Archivos Clave |
|---------|-----------|----------------|
| `micro-auth/` | Autenticación | server.js, config/index.js |
| `micro-estudiantes/` | Estudiantes | server.js, config/index.js |
| `micro-maestros/` | Maestros | server.js, config/index.js |
| `api-gateway/` | Gateway API | server.js, routes/ |
| `frontend-web/` | Interfaz web | index.html, js/config.js |
| `databases/` | Bases de datos | docker-compose.yml |
| `messaging/` | Kafka + RabbitMQ | docker-compose.yml |
| `monitoring/` | Prometheus + Grafana | docker-compose.yml |
| `scripts/` | Automatización | *.js |
| `.github/workflows/` | CI/CD | *.yml |

---

## 🚀 Cómo Usar Esta Estructura

### Para Cambiar IPs
1. Editar `.env.infrastructure`
2. Ejecutar `npm run build:infrastructure`
3. Ejecutar `npm run validate:infrastructure`
4. Ejecutar `npm run rebuild:services`

### Para Desarrollar
1. Instalar dependencias: `npm install` en cada servicio
2. Configurar `.env.infrastructure`
3. Ejecutar `docker-compose up -d` (desarrollo)
4. Acceder a endpoints locales

### Para Desplegar
1. Push a GitHub
2. GitHub Actions ejecuta workflow
3. Crea imágenes Docker
4. Despliega a AWS EC2s

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Microservicios | 8 |
| Frontend | 1 |
| Documentos | 18+ |
| Scripts | 8+ |
| Workflows | 8+ |
| Líneas de código | 50,000+ |
| Líneas de documentación | 3,000+ |

---

## ✅ Checklist de Estructura

- ✅ Configuración centralizada implementada
- ✅ Todos los microservicios en su carpeta
- ✅ Frontend con estructura clara
- ✅ Bases de datos configuradas
- ✅ Monitoreo implementado
- ✅ CI/CD configurado
- ✅ Documentación completa
- ✅ Scripts de automatización

---

**Última actualización**: 2026-01-05 | **Estado**: ✅ Completo y Funcional
