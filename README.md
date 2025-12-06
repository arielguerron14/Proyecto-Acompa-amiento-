# Proyecto Acompañamiento - Sistema de Gestión Educativa

Sistema de microservicios para la gestión de estudiantes, maestros, horarios y reportes de acompañamiento educativo.

## 🚀 Inicio Rápido (Desarrollo Local)

### Requisitos
- **Node.js** 18+
- **npm** 9+
- **Git**

### Instalación y Ejecución

#### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd Proyecto-Acompa-amiento-
```

#### 2. Instalar dependencias
```bash
# Instalar en api-gateway (puerta de entrada principal)
cd api-gateway
npm install
cd ..

# Instalar en shared-auth (dependencia compartida)
cd shared-auth
npm install
cd ..

# Instalar frontend
cd frontend-web
npm install
cd ..
```

#### 3. Arrancar los servicios

**En Windows (PowerShell o CMD):**

```powershell
# Terminal 1: API Gateway (puerto 8080)
cd api-gateway
npm start

# Terminal 2: Frontend Web (puerto 5500)
cd frontend-web
npm install -g http-server
http-server ./public -p 5500 -c-1
```

O más fácil, usa los scripts batch incluidos:

```batch
REM Terminal 1
start-gateway.bat

REM Terminal 2
start-frontend.bat
```

### 4. Acceder a la aplicación

**Frontend Web:**
```
http://localhost:5500/login.html
```

**API Gateway:**
```
http://localhost:8080
```

## 📋 Servicios

### Servicios Core (6)
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **MongoDB** | 27017 | Base de datos principal |
| **micro-maestros** | 5001 | Gestión de horarios de maestros |
| **micro-estudiantes** | 5002 | Gestión de reservas de estudiantes |
| **micro-reportes-estudiantes** | 5003 | Reportes de estudiantes |
| **micro-reportes-maestros** | 5004 | Reportes de maestros |
| **API Gateway** | 8080 | Router central de la aplicación |

### Nuevos Servicios (4)
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **micro-auth** | 5005 | Autenticación, autorización y RBAC centralizado |
| **micro-notificaciones** | 5006 | Notificaciones: email, SMS, push |
| **micro-analytics** | 5007 | Analytics en tiempo real, Kafka consumer |
| **micro-soap-bridge** | 5008 | Integración con servicios SOAP legacy |

### Frontend
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
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

        ┌─────────────────────────────────┐
        │    SHARED AUTH MODULE (DRY)     │
        │  - Roles & Permissions Matrix   │
        │  - JWT Service                  │
        │  - Auth Middleware              │
        └────────┬────────────────────────┘
                 │
   ┌─────────────┼─────────────┬──────────────┐
   ▼             ▼             ▼              ▼
micro-auth  micro-notif  micro-analytics  micro-soap
 (5005)      (5006)        (5007)        bridge(5008)
             
- RBAC      - Email       - Kafka       - SOAP
- JWT       - SMS         - Events      - Legacy
- Tokens    - Push        - Real-time   - Adapter
```

## 📝 Variables de Entorno

Cada servicio puede configurarse mediante un archivo `.env`:

### MongoDB URI (todos los microservicios)
```env
MONGO_URI=mongodb://localhost:27017/nombre_db
PORT=5001  # Varía según el servicio
```

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


# Reiniciar todos los servicios
docker-compose down

# Ejecutar un comando dentro de un contenedor
docker-compose exec api-gateway npm test

# Rebuild de imágenes
docker-compose build --no-cache
```

## 🧪 Health Checks

Verifica que todos los servicios están activos:

```bash
# Directamente
curl http://localhost:5001/health       # micro-maestros
curl http://localhost:5002/health       # micro-estudiantes
curl http://localhost:5003/health       # micro-reportes-estudiantes
curl http://localhost:5004/health       # micro-reportes-maestros
curl http://localhost:5005/health       # micro-auth
curl http://localhost:5006/health       # micro-notificaciones
curl http://localhost:5007/health       # micro-analytics
curl http://localhost:5008/health       # micro-soap-bridge

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
├── shared-auth/              # Módulo compartido de autenticación
│   ├── src/
│   │   ├── constants/
│   │   ├── services/
│   │   ├── middlewares/
│   │   └── index.js (barrel export)
│   └── package.json
├── micro-maestros/           # Microservicio de maestros
├── micro-estudiantes/        # Microservicio de estudiantes
├── micro-reportes-estudiantes/
├── micro-reportes-maestros/
├── micro-auth/               # Autenticación centralizada (NUEVO)
├── micro-notificaciones/     # Notificaciones email/SMS/push (NUEVO)
├── micro-analytics/          # Analytics y Kafka consumer (NUEVO)
├── micro-soap-bridge/        # Integración SOAP legacy (NUEVO)
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
- **jsonwebtoken**: Autenticación JWT
- **bcryptjs**: Hash de contraseñas
- **nodemailer**: Envío de emails
- **kafkajs**: Cliente Kafka para streaming de eventos
- **soap**: Integración con servicios SOAP

## 📞 Contacto y Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

---

**Última actualización**: Diciembre 2025
