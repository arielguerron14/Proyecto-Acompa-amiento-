# 10 Microservicios - Guía de Referencia

## Resumen General

El proyecto ahora consta de **10 microservicios** distribuidos en una arquitectura modular, escalable y con responsabilidades bien definidas. Todos comparten la misma estructura uniforme con Dockerfile para facilitar el despliegue en contenedores.

---

## 1. **API Gateway** (Puerto 5001)

**Descripción:** Router central que gestiona todas las solicitudes y redirecciona a los microservicios correspondientes.

**Responsabilidades:**

- Proxy HTTP de solicitudes
- Autenticación global
- Rate limiting
- CORS handling

**Stack:** Express.js + http-proxy-middleware

**Rutas expuestas:**

- `/maestros/*` → micro-maestros (5001)
- `/estudiantes/*` → micro-estudiantes (5002)
- `/reportes/estudiantes/*` → micro-reportes-estudiantes (5003)
- `/reportes/maestros/*` → micro-reportes-maestros (5004)
- `/auth/*` → api-gateway local (5008)

---

## 2. **micro-maestros** (Puerto 5001)

**Descripción:** Gestión de horarios y disponibilidad de maestros.

**Responsabilidades:**

- CRUD de horarios
- Gestión de disponibilidad
- Consultas de horarios por maestro
- Validación de conflictos

**Models:**

- `Horario` (maestroId, horaInicio, horaFin, dia, materia)

**Endpoints clave:**

- `GET /horarios` - Lista todos
- `POST /horarios` - Crea nuevo
- `PUT /horarios/:id` - Actualiza
- `DELETE /horarios/:id` - Elimina

---

## 3. **micro-estudiantes** (Puerto 5002)

**Descripción:** Gestión de reservas de estudiantes.

**Responsabilidades:**

- CRUD de reservas
- Validación de disponibilidad
- Consultas de reservas por estudiante
- Cancelación de reservas

**Models:**

- `Reserva` (estudianteId, maestroId, horarioId, fecha, estado)

**Endpoints clave:**

- `GET /reservas` - Lista todas
- `POST /reservas` - Crea nueva
- `PUT /reservas/:id` - Actualiza
- `DELETE /reservas/:id` - Cancela

---

## 4. **micro-reportes-estudiantes** (Puerto 5003)

**Descripción:** Generación de reportes analíticos para estudiantes.

**Responsabilidades:**

- Reportes de asistencia
- Historial de reservas
- Estadísticas de uso
- Exportación de datos

**Endpoints clave:**

- `GET /reportes/asistencia/:estudianteId` - Reporte de asistencia
- `GET /reportes/historial/:estudianteId` - Historial de reservas
- `GET /reportes/estadisticas` - Estadísticas generales
- `GET /reportes/export` - Exportar datos (CSV/PDF)

---

## 5. **micro-reportes-maestros** (Puerto 5004)

**Descripción:** Generación de reportes analíticos para maestros.

**Responsabilidades:**

- Reportes de estudiantes atendidos
- Estadísticas de sesiones
- Métricas de disponibilidad
- Análisis de carga

**Endpoints clave:**

- `GET /reportes/estudiantes/:maestroId` - Estudiantes atendidos
- `GET /reportes/sesiones/:maestroId` - Sesiones realizadas
- `GET /reportes/estadisticas` - Estadísticas de maestros
- `GET /reportes/carga` - Análisis de carga

---

## 6. **micro-auth** (Puerto 5005) ⭐ **NUEVO**

**Descripción:** Autenticación y autorización centralizada con RBAC.

**Responsabilidades:**

- Verificación de tokens JWT
- Validación de permisos
- Gestión de roles
- Control de acceso

**Endpoints clave:**

- `POST /auth/verify-token` - Verifica JWT
- `POST /auth/validate-permission` - Valida permiso
- `GET /auth/roles` - Lista roles
- `GET /auth/roles/:roleId/permissions` - Permisos del rol

**Roles soportados:**

- `admin` - Acceso total
- `maestro` - Gestionar horarios, ver reservas
- `estudiante` - Ver horarios, crear/cancelar reservas
- `auditor` - Solo lectura de reportes

---

## 7. **micro-notificaciones** (Puerto 5006) ⭐ **NUEVO**

**Descripción:** Servicio centralizado de notificaciones multicanal.

**Responsabilidades:**

- Envío de emails
- Envío de SMS
- Push notifications
- Templates reutilizables

**Endpoints clave:**

- `POST /notificaciones/email` - Envía email
- `POST /notificaciones/sms` - Envía SMS
- `POST /notificaciones/push` - Envía push
- `GET /notificaciones/templates` - Lista templates

**Templates disponibles:**

- `WELCOME` - Bienvenida
- `PASSWORD_RESET` - Reseteo contraseña
- `BOOKING_CONFIRMATION` - Confirmación reserva
- `REMINDER` - Recordatorio

---

## 8. **micro-analytics** (Puerto 5007) ⭐ **NUEVO**

**Descripción:** Análisis en tiempo real y procesamiento de eventos con Kafka.

**Responsabilidades:**

- Consumo de eventos desde Kafka
- Almacenamiento de analytics
- Estadísticas agregadas
- Generación de reportes

**Tópicos Kafka:**

- `reservas` - Eventos de reservas
- `horarios` - Eventos de horarios
- `reportes` - Eventos de reportes

**Endpoints clave:**

- `GET /analytics/events` - Lista eventos
- `GET /analytics/stats` - Estadísticas
- `POST /analytics/events` - Registra evento
- `GET /analytics/report` - Genera reporte

---

## 9. **micro-soap-bridge** (Puerto 5008) ⭐ **NUEVO**

**Descripción:** Puente de integración con servicios SOAP legacy.

**Responsabilidades:**

- Adaptador REST → SOAP
- Transformación de datos
- Gestión de servicios legacy
- WSDL management

**Servicios SOAP soportados:**

- `ALUMNOS` - Gestión de alumnos
- `CALIFICACIONES` - Calificaciones
- `ASISTENCIA` - Registro de asistencia

**Endpoints clave:**
- `POST /soap/call` - Llama servicio SOAP
- `GET /soap/services` - Lista servicios
- `POST /soap/transform` - Transforma datos
- `GET /soap/wsdl/:serviceName` - Obtiene WSDL

---

## 10. **Frontend Web** (Puerto 5500)

**Descripción:** Interfaz web estática para estudiantes y maestros.

**Responsabilidades:**
- Interfaz de usuario
- Gestión de reservas (estudiantes)
- Gestión de horarios (maestros)
- Visualización de reportes

**Archivos principales:**
- `index.html` - Landing page
- `estudiante.html` - Portal de estudiantes
- `maestro.html` - Portal de maestros
- `styles.css` - Estilos globales

---

## Componente Compartido: **shared-auth**

**Descripción:** Módulo centralizado de autenticación reutilizado por todos los microservicios.

**Contenido:**
- `AuthService` - Lógica JWT (generar, verificar, refrescar tokens)
- Middlewares - Autenticación, validación de roles/permisos
- Constantes - Definición de roles y matriz de permisos

**Beneficios:**
- ✅ DRY: Una única fuente de verdad para auth
- ✅ SOLID: Separación de responsabilidades
- ✅ Fácil mantenimiento: cambios en un solo lugar
- ✅ Consistencia: mismo comportamiento en todos los servicios

---

## 📊 Comparativa de Microservicios

| Servicio | Tipo | Base Datos | Integraciones | Estado |
|----------|------|-----------|---------------|--------|
| micro-maestros | Datos | MongoDB | - | Core |
| micro-estudiantes | Datos | MongoDB | - | Core |
| micro-reportes-est | Agregación | MongoDB | - | Core |
| micro-reportes-maest | Agregación | MongoDB | - | Core |
| micro-auth | Autenticación | - | JWT | Core |
| micro-notificaciones | Notificaciones | - | SMTP/SMS/FCM | Nuevo |
| micro-analytics | Streaming | In-memory | Kafka | Nuevo |
| micro-soap-bridge | Integración | - | SOAP legacy | Nuevo |
| api-gateway | Router | - | HTTP proxy | Core |
| frontend-web | Presentación | - | API Gateway | Core |

---

## 🔄 Flujos de Integración

### Flujo 1: Reserva de Estudiante
```
Frontend (estudiante.html)
    ↓
API Gateway (/estudiantes/reservas)
    ↓
micro-estudiantes (POST /reservas)
    ↓
Validar horario → micro-maestros
    ↓
MongoDB (Reserva creada)
    ↓
Evento → Kafka (reservas topic)
    ↓
micro-analytics (procesa evento)
    ↓
micro-notificaciones (envía confirmación)
```

### Flujo 2: Autenticación Global
```
Cliente (Login)
    ↓
API Gateway (/auth/login)
    ↓
shared-auth/AuthService (genera JWT + refresh)
    ↓
Retorna tokens
    ↓
Cliente usa Bearer token en headers
    ↓
shared-auth/authMiddleware (verifica en cada request)
```

### Flujo 3: Integración SOAP Legacy
```
micro-soap-bridge (POST /soap/call)
    ↓
SoapService.callService()
    ↓
Busca servicios en SOAP_SERVICES config
    ↓
Transforma request REST → SOAP
    ↓
Llama a legacy system (http://legacy-system:8080)
    ↓
Retorna response en JSON
```

---

## 🚀 Despliegue Docker

Cada microservicio incluye:
- `Dockerfile` - Imagen Alpine con Node.js 18
- `package.json` - Dependencias específicas
- `docker-compose.yml` - Orquestación (en root)

```bash
# Build todas las imágenes
docker-compose build

# Levantar todos los servicios
docker-compose up -d

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f
```

---

## 📈 Escalabilidad

**Horizontal scaling:**
- Cada microservicio puede escalarse independientemente
- Load balancer frente a API Gateway
- Instancias de micro-analytics para consumo de Kafka

**Vertical scaling:**
- Aumentar memoria/CPU según métricas
- Optimización de queries MongoDB
- Caching en micro-notificaciones

---

## 🔐 Seguridad

- ✅ JWT tokens con expiración
- ✅ Refresh token rotation
- ✅ RBAC con matriz de permisos
- ✅ Autenticación en todas las rutas protegidas
- ✅ Validación de entrada en controllers
- ✅ Variables de entorno para secretos

---

## 📞 Contacto y Documentación

Cada microservicio tiene su propio `README.md` con:
- Descripción detallada
- Endpoints disponibles
- Variables de entorno
- Ejemplos de uso
- Docker deployment

Ver:
- `/micro-auth/README.md`
- `/micro-notificaciones/README.md`
- `/micro-analytics/README.md`
- `/micro-soap-bridge/README.md`
- `/shared-auth/README.md`

---

**Última actualización:** 17 de diciembre de 2025
**Versión:** 2.0 (Con 10 microservicios + Refactoring SOLID)
