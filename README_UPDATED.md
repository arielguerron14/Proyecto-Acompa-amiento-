# Proyecto Acompañamiento - Sistema de Gestión Educativa

Sistema de microservicios para la gestión de estudiantes, maestros, horarios y reportes de acompañamiento educativo.

## 🎯 Descripción General

Este proyecto es una plataforma integral para el acompañamiento educativo que permite:
- **Estudiantes**: Reservar sesiones, consultar reportes y hacer seguimiento académico
- **Maestros**: Gestionar horarios, crear reportes y hacer seguimiento a estudiantes
- **Administradores**: Supervisar todo el sistema con acceso total
- **Auditores**: Revisar registros y generar informes de auditoría

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

## 🔐 Credenciales de Prueba

El sistema incluye usuarios pre-cargados para testing:

```
Rol: Admin
Email: admin@sistema.com
Password: admin123

Rol: Maestro
Email: maestro@sistema.com
Password: maestro123

Rol: Estudiante
Email: estudiante@sistema.com
Password: estudiante123

Rol: Auditor
Email: auditor@sistema.com
Password: auditor123
```

## 📚 Funcionalidades Principales

### 1. Autenticación (POST /auth/login)
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "15m",
  "user": {
    "userId": "admin-001",
    "email": "admin@sistema.com",
    "role": "admin"
  }
}
```

### 2. Registro (POST /auth/register)
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@ejemplo.com",
    "password": "password123",
    "name": "Nuevo Usuario",
    "role": "estudiante"
  }'
```

### 3. Verificar Token (POST /auth/verify-token)
```bash
curl -X POST http://localhost:8080/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGc..."}'
```

### 4. Renovar Token (POST /auth/refresh)
```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGc..."}'
```

## 🏗️ Arquitectura de Microservicios

```
┌─────────────────────────────────────────────┐
│        Frontend Web (puerto 5500)           │
│  - Login / Registro                         │
│  - Panel Estudiante                         │
│  - Panel Maestro                            │
└──────────────┬──────────────────────────────┘
               │ HTTP/REST
               ▼
┌─────────────────────────────────────────────┐
│     API Gateway (puerto 8080)               │
│  - CORS habilitado                          │
│  - Rate limiting                            │
│  - Enrutamiento de rutas                    │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴───────────────────────┐
        │                              │
        ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐
│    Auth Routes       │    │ Proxy a Servicios    │
│ - /auth/login        │    │ - /maestros          │
│ - /auth/register     │    │ - /estudiantes       │
│ - /auth/verify-token │    │ - /reportes/*        │
│ - /auth/refresh      │    │                      │
└──────────────────────┘    └──────────────────────┘
```

## 🔧 Configuración

### Variables de Entorno

Archivo `.env` (crear si no existe):

```env
# API Gateway
PORT=8080
NODE_ENV=development
JWT_SECRET=tu-secret-key-cambiar-en-produccion
REFRESH_SECRET=tu-refresh-secret-cambiar-en-produccion

# Frontend
FRONTEND_URL=http://localhost:5500
```

### CORS

El sistema está configurado para desarrollo con CORS permisivo:
- ✅ Permite cualquier origen en desarrollo
- ✅ Headers: `Content-Type`, `Authorization`, `X-Requested-With`
- ✅ Métodos: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, `PATCH`, `HEAD`

En producción, cambiar `origin: true` a validación específica en `api-gateway/src/middlewares/security.js`.

## 📝 Endpoints Principales

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/register` | Crear nueva cuenta |
| POST | `/auth/verify-token` | Verificar validez de JWT |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/me` | Obtener info del usuario autenticado |
| POST | `/auth/logout` | Cerrar sesión |
| GET | `/auth/roles` | Listar roles disponibles |

### Datos de Usuario

El JWT contiene:
```json
{
  "userId": "string",
  "email": "string",
  "role": "admin|maestro|estudiante|auditor",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 🐛 Resolución de Problemas

### "NetworkError when attempting to fetch resource"

**Causa:** El servidor no está respondiendo

**Solución:**
1. Verifica que `start-gateway.bat` está corriendo
2. Revisa que el puerto 8080 está libre: `netstat -ano | findstr :8080`
3. Recarga el navegador (Ctrl+Shift+R)

### "Access to fetch has been blocked by CORS"

**Causa:** CORS no está configurado correctamente

**Solución:**
- El proyecto ya incluye CORS habilitado
- Si sigue fallando, verifica que estás usando `localhost` (no `127.0.0.1`) o vice versa

### "handleLogout is not defined"

**Causa:** Código JavaScript fuera del tag `<script>`

**Solución:** Ya corregido en este proyecto. Verifica que `</script>` esté al final del archivo HTML.

## 📦 Estructura de Carpetas

```
Proyecto-Acompa-amiento-/
├── api-gateway/                 # Puerta de entrada (puerto 8080)
│   ├── src/
│   │   ├── middlewares/
│   │   ├── routes/              # /auth, /maestros, etc.
│   │   └── services/
│   ├── server.js
│   └── package.json
├── frontend-web/                # UI estática (puerto 5500)
│   ├── public/
│   │   ├── login.html
│   │   ├── index.html
│   │   ├── estudiante.html
│   │   └── styles.css
│   └── package.json
├── shared-auth/                 # Módulo compartido de autenticación
│   ├── src/
│   │   ├── services/
│   │   ├── middlewares/
│   │   └── constants/
│   └── package.json
├── micro-*/                     # Otros microservicios (sin usar en desarrollo local)
└── README.md
```

## 🚀 Despliegue con Docker Compose

Para producción o ambiente completo:

```bash
docker-compose up -d
```

Esto arranca:
- MongoDB (base de datos)
- Kafka + Zookeeper (event bus)
- RabbitMQ (message queue)
- MQTT (telemetría)
- Todos los microservicios
- API Gateway
- Frontend

## 📖 Documentación Adicional

- **[AUTH_DOCUMENTATION.md](./AUTH_DOCUMENTATION.md)** - Detalles de autenticación y JWT
- **[MICROSERVICES_GUIDE.md](./MICROSERVICES_GUIDE.md)** - Guía de microservicios
- **[ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)** - Diagramas de arquitectura

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
2. Commit cambios: `git commit -am 'Añade nueva funcionalidad'`
3. Push: `git push origin feature/nueva-funcionalidad`
4. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo licencia ISC.

---

**Última actualización:** Diciembre 5, 2025
**Versión:** 1.0.0
**Estado:** ✅ Funcionando - Login, Registro y Autenticación listos para testing
