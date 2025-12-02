# Proyecto Acompañamiento - Sistema de Gestión Educativa

Sistema de microservicios para la gestión de estudiantes, maestros, horarios y reportes de acompañamiento educativo.

## 🚀 Inicio Rápido

### Requisitos
- **Docker** y **Docker Compose** instalados
- **Node.js** 18+ (solo si ejecutas localmente sin Docker)

### Opción 1: Con Docker Compose (Recomendado)

```bash
# Clonar el repositorio
git clone <repo-url>
cd Proyecto-Acompa-amiento-

# Levantar todos los servicios
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f
```

El proyecto estará disponible en: **http://localhost:8080/**

### Opción 2: Instalación Local (Sin Docker)

```bash
# Instalar dependencias en cada servicio
npm install --prefix micro-maestros
npm install --prefix micro-estudiantes
npm install --prefix micro-reportes-estudiantes
npm install --prefix micro-reportes-maestros
npm install --prefix api-gateway
npm install --prefix frontend-web

# Iniciar MongoDB (local o Docker)
docker run -d --name proyecto-mongo -p 27017:27017 mongo:6.0

# Iniciar cada servicio (en terminales separadas)
npm start --prefix micro-maestros
npm start --prefix micro-estudiantes
npm start --prefix micro-reportes-estudiantes
npm start --prefix micro-reportes-maestros
npm start --prefix api-gateway
npm start --prefix frontend-web
```

## 📋 Servicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **MongoDB** | 27017 | Base de datos principal |
| **micro-maestros** | 5001 | Gestión de horarios de maestros |
| **micro-estudiantes** | 5002 | Gestión de reservas de estudiantes |
| **micro-reportes-estudiantes** | 5003 | Reportes de estudiantes |
| **micro-reportes-maestros** | 5004 | Reportes de maestros |
| **API Gateway** | 8080 | Router central de la aplicación |
| **Frontend Web** | 5500 | Interfaz web estática |

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend Web (5500)               │
│                   (HTML/CSS/JS)                      │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                  API Gateway (8080)                  │
│         (Express + http-proxy-middleware)            │
└──┬─────────────┬─────────────┬──────────────┬───────┘
   │             │             │              │
   ▼             ▼             ▼              ▼
micro-        micro-       micro-reportes  micro-reportes
maestros    estudiantes    estudiantes      maestros
 (5001)       (5002)         (5003)           (5004)
   │             │             │              │
   └─────────────┴─────────────┴──────────────┘
                    │
                    ▼
              MongoDB (27017)
```

## 📝 Variables de Entorno

Cada servicio puede configurarse mediante un archivo `.env`:

### MongoDB URI (todos los microservicios)
```env
MONGO_URI=mongodb://localhost:27017/nombre_db
PORT=5001  # Varía según el servicio
```

### API Gateway
```env
PORT=8080
MAESTROS_URL=http://localhost:5001
ESTUDIANTES_URL=http://localhost:5002
REPORTES_EST_URL=http://localhost:5003
REPORTES_MAEST_URL=http://localhost:5004
FRONTEND_URL=http://localhost:5500
```

## 🔧 Comandos útiles

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f api-gateway

# Reiniciar todos los servicios
docker-compose restart

# Detener todo
docker-compose down

# Detener y eliminar volúmenes de datos
docker-compose down -v

# Ejecutar un comando dentro de un contenedor
docker-compose exec api-gateway npm test

# Rebuild de imágenes
docker-compose build --no-cache
```

## 🧪 Health Checks

Verifica que todos los servicios están activos:

```bash
# Directamente
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5003/health
curl http://localhost:5004/health

# A través del gateway
curl http://localhost:8080/maestros/health
curl http://localhost:8080/estudiantes/health
curl http://localhost:8080/reportes/estudiantes/health
curl http://localhost:8080/reportes/maestros/health

# Frontend
curl http://localhost:8080/
```

## 📂 Estructura de Carpetas

```
Proyecto-Acompa-amiento-/
├── api-gateway/              # Router central
├── frontend-web/             # Interfaz web
│   └── public/
│       ├── index.html
│       ├── estudiante.html
│       └── styles.css
├── micro-maestros/           # Microservicio de maestros
├── micro-estudiantes/        # Microservicio de estudiantes
├── micro-reportes-estudiantes/
├── micro-reportes-maestros/
├── docker-compose.yml        # Orquestación Docker
└── README.md                 # Este archivo
```

## 🚨 Solución de Problemas

### Puerto ya en uso
```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :8080

# Matar el proceso (Windows)
taskkill /PID <PID> /F
```

### MongoDB no conecta
```bash
# Verificar que el contenedor de Mongo está corriendo
docker-compose ps

# Reiniciar Mongo
docker-compose restart mongo
```

### Contenedor se cierra inmediatamente
```bash
# Ver logs de error
docker-compose logs <nombre-servicio>
```

## 👨‍💻 Desarrollo

Para desarrollo local sin Docker:

1. Clonar y instalar dependencias
2. Configurar `.env` en cada carpeta con `MONGO_URI=mongodb://localhost:27017/<db>`
3. Ejecutar `npm run dev` (si está disponible) o `npm start` en cada servicio

## 📦 Dependencias Principales

- **Express.js**: Framework web
- **Mongoose**: ODM para MongoDB
- **Axios**: Cliente HTTP
- **CORS**: Soporte de CORS
- **body-parser**: Parser de cuerpo de solicitudes
- **http-proxy-middleware**: Middleware de proxy para el gateway
- **http-server**: Servidor estático para frontend
- **dotenv**: Gestión de variables de entorno

## 📞 Contacto y Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

---

**Última actualización**: Diciembre 2025
