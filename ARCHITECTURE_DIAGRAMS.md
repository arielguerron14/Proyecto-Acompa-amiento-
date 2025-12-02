# Arquitectura del Sistema - Diagramas Detallados

Visualización completa de la arquitectura con 10 microservicios, módulo compartido, y flujos de integración.

## 1. Diagrama General de Arquitectura

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         PROYECTO ACOMPAÑAMIENTO EDUCATIVO                         │
│                              (10 Microservicios)                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

                            ┌──────────────────────────┐
                            │   Cliente / Frontend     │
                            │   (Browser HTTP)         │
                            └────────────┬─────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │                                         │
                    │          API GATEWAY (8080)             │
                    │    (Express + http-proxy-middleware)    │
                    │                                         │
                    │   Funciones:                            │
                    │   - Router principal                    │
                    │   - Proxy HTTP                          │
                    │   - CORS handling                       │
                    │   - Auth validation                     │
                    │                                         │
                    └──────┬──────────────────┬───────────────┘
                           │                  │
          ┌────────────────┼──────────┬───────┼──────────┬───────────────┐
          │                │          │       │          │               │
          ▼                ▼          ▼       ▼          ▼               ▼
    ┌──────────┐    ┌──────────┐  ┌──┐  ┌──────┐  ┌─────────┐  ┌──────────┐
    │ Frontend │    │micro-    │  │  │  │micro-│  │ micro- │  │ micro-  │
    │   Web    │    │maestros  │  │  │  │estu- │  │reportes│  │reportes │
    │ (5500)   │    │  (5001)  │  │  │  │diantes   │estudiantes(5003) maestros
    │ Static   │    │ Horarios │  │  │  │ (5002)   │ (5004) │  │ (5004)  │
    │ HTML/CSS │    │ CRUD +   │  │  │  │Reservas  │Reports│  │Reports  │
    │   JS     │    │Validation│  │  │  │ CRUD +   │+Stats │  │+ Stats  │
    └──────────┘    │          │  │  │  │Validat.  │      │  │         │
                    └──────────┘  │  │  │          │      │  │         │
                         │        │  │  │          │      │  │         │
                         │        │  │  │          │      │  │         │
      ┌──────────────────┴────────┼──┼──┼──────────┴──────┴──┴─────────┘
      │                           │  │  │
      ▼                           ▼  ▼  ▼
  ┌─────────────────────────────────────────┐
  │     SHARED-AUTH MODULE (DRY Central)    │
  │         (Re-exported por todos)          │
  │                                         │
  │  ┌──────────────────────────────────┐  │
  │  │   AuthService (JWT)              │  │
  │  │ - generateAccessToken()          │  │
  │  │ - generateRefreshToken()         │  │
  │  │ - verifyAccessToken()            │  │
  │  │ - refreshAccessToken()           │  │
  │  └──────────────────────────────────┘  │
  │                                         │
  │  ┌──────────────────────────────────┐  │
  │  │   Middleware (RBAC)              │  │
  │  │ - authenticateToken()            │  │
  │  │ - requireRole()                  │  │
  │  │ - requirePermission()            │  │
  │  │ - optionalAuth()                 │  │
  │  └──────────────────────────────────┘  │
  │                                         │
  │  ┌──────────────────────────────────┐  │
  │  │   ROLES & PERMISSIONS (Matrix)   │  │
  │  │ - admin (full access)            │  │
  │  │ - maestro (create:horarios, ...) │  │
  │  │ - estudiante (create:reservas,..)│  │
  │  │ - auditor (read-only)            │  │
  │  └──────────────────────────────────┘  │
  │                                         │
  └──────┬──────────────────────────────────┘
         │ (importado por todos los servicios)
         │
    ┌────┴────────────────┬──────────────┬─────────────────┐
    │                     │              │                 │
    ▼                     ▼              ▼                 ▼
 ┌────────┐        ┌──────────┐   ┌──────────────┐  ┌────────────┐
 │micro-  │        │ micro-   │   │micro-        │  │micro-soap- │
 │auth    │        │notif.    │   │analytics     │  │bridge      │
 │(5005)  │        │(5006)    │   │(5007)        │  │(5008)      │
 │        │        │          │   │              │  │            │
 │Token   │        │Email     │   │Kafka         │  │SOAP        │
 │Verif.  │        │SMS       │   │Consumer      │  │Adapter     │
 │        │        │Push      │   │Events        │  │REST↔XML    │
 │        │        │Templates │   │Stats         │  │Legacy      │
 │        │        │          │   │Reports       │  │Systems     │
 └────────┘        └──────────┘   └──────────────┘  │            │
                                                    │ ALUMNOS    │
                                                    │ CALIF.     │
                                                    │ ASISTENCIA │
                                                    └────────────┘
      │                │                │              │
      └────────────────┼────────────────┴──────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   MONGODB (27017)    │
            │                      │
            │  - maestrosdb        │
            │  - estudiantesdb     │
            │  - reportesestdb     │
            │  - reportesmaestdb   │
            │  - authdb (future)   │
            │                      │
            └──────────────────────┘
```

## 2. Flujo de Autenticación (Auth Flow)

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ POST /auth/login
       │ {email, password}
       ▼
┌──────────────────────┐
│   API Gateway        │
│   (8080)             │
└──────┬───────────────┘
       │
       │ (sin validación, forward a auth)
       ▼
┌──────────────────────────────┐
│   micro-auth (5005)          │
│   POST /auth/login           │
└──────┬───────────────────────┘
       │
       │ (usa shared-auth)
       ▼
┌──────────────────────────────┐
│   shared-auth/AuthService    │
│                              │
│ 1. Validar credenciales      │
│ 2. generateAccessToken()     │
│    - Payloaf: userId, role   │
│    - Expiry: 15 minutos      │
│ 3. generateRefreshToken()    │
│    - Payloaf: userId, type   │
│    - Expiry: 7 días          │
│                              │
└──────┬───────────────────────┘
       │
       │ Retorna tokens
       ▼
┌──────────────────────────────┐
│   Cliente recibe:            │
│ {                            │
│   accessToken: "eyJhbGc..." │
│   refreshToken: "eyJhbGc..." │
│   user: {...}                │
│ }                            │
└──────┬───────────────────────┘
       │
       │ Siguiente request:
       │ GET /maestros/horarios
       │ Header: Authorization: Bearer <accessToken>
       ▼
┌──────────────────────────────┐
│   API Gateway                │
│   authMiddleware             │
│                              │
│ 1. Extrae token del header   │
│ 2. Llama shared-auth         │
│    verifyAccessToken()       │
│ 3. Si válido:                │
│    req.user = {userId, role} │
│ 4. Si inválido:              │
│    Retorna 401 Unauthorized  │
└──────┬───────────────────────┘
       │
       │ Si es válido, forward a
       │ micro-maestros
       ▼
┌──────────────────────────────┐
│   micro-maestros (5001)      │
│   GET /horarios              │
│                              │
│ - req.user ya está en context│
│ - Procesa la solicitud       │
│ - Retorna datos              │
└──────────────────────────────┘
```

## 3. Flujo de Creación de Reserva

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUJO: CREAR RESERVA (Estudiante)              │
└─────────────────────────────────────────────────────────────────┘

1. CLIENTE (Frontend)
   POST /estudiantes/reservas
   {
     "maestroId": "maestro-001",
     "horarioId": "horario-123",
     "fecha": "2024-12-15"
   }
   Header: Authorization: Bearer <token>

2. API GATEWAY (8080)
   ├─ authMiddleware valida token
   ├─ Extrae userId del token
   └─ Forward a micro-estudiantes

3. MICRO-ESTUDIANTES (5002)
   POST /reservas
   ├─ Validar que estudiante existe
   ├─ Validar que maestro existe
   ├─ Validar horario disponible
   │  └─ (Llama a micro-maestros GET /horarios/:id)
   ├─ Crear documento Reserva en MongoDB
   └─ Retorna reserva creada

4. EVENTO → KAFKA (Opcional, si Kafka habilitado)
   Topic: "reservas"
   {
     "eventType": "reserva_created",
     "maestroId": "maestro-001",
     "estudianteId": "est-001",
     "fecha": "2024-12-15",
     "timestamp": "2024-12-01T10:30:00Z"
   }

5. MICRO-ANALYTICS (5007)
   ├─ Kafka Consumer consume evento
   ├─ Procesa event
   ├─ Almacena en analytics store
   └─ Actualiza estadísticas

6. MICRO-NOTIFICACIONES (5006)
   ├─ Consumidor de eventos (o triggered por sistema)
   ├─ Prepara notificación
   ├─ Envía email al estudiante:
   │  "Tu reserva con maestro X ha sido confirmada"
   └─ Envía email al maestro:
      "Tienes una nueva reserva de Y"

7. RESPUESTA al Cliente
   200 OK
   {
     "id": "reserva-456",
     "estudianteId": "est-001",
     "maestroId": "maestro-001",
     "estado": "confirmada",
     "fecha": "2024-12-15",
     "createdAt": "2024-12-01T10:30:00Z"
   }
```

## 4. Integración SOAP Legacy

```
┌─────────────────────────────────────────────────────────┐
│         FLUJO: INTEGRACIÓN CON SISTEMA LEGACY SOAP      │
└─────────────────────────────────────────────────────────┘

1. CLIENTE (Nuestro sistema)
   POST /soap/call
   {
     "serviceName": "ALUMNOS",
     "method": "getAlumno",
     "args": {"id": "ALU-001"}
   }

2. MICRO-SOAP-BRIDGE (5008)
   ├─ authMiddleware valida token
   ├─ Busca configuración de servicio SOAP
   │  ALUMNOS → http://legacy-system:8080/ws/alumnos
   ├─ Transforma request JSON → SOAP XML
   │  <soap:Envelope>
   │    <soap:Body>
   │      <getAlumno>
   │        <id>ALU-001</id>
   │      </getAlumno>
   │    </soap:Body>
   │  </soap:Envelope>
   └─ Envía solicitud SOAP al legacy system

3. LEGACY SYSTEM
   ├─ Procesa solicitud SOAP
   ├─ Retorna respuesta XML
   │  <soap:Envelope>
   │    <soap:Body>
   │      <getAlumnoResponse>
   │        <alumno>
   │          <id>ALU-001</id>
   │          <nombre>Juan Pérez</nombre>
   │          ...
   │        </alumno>
   │      </getAlumnoResponse>
   │    </soap:Body>
   │  </soap:Envelope>

4. MICRO-SOAP-BRIDGE
   ├─ Recibe respuesta SOAP XML
   ├─ Transforma XML → JSON
   │  {
   │    "id": "ALU-001",
   │    "nombre": "Juan Pérez",
   │    ...
   │  }
   └─ Retorna al cliente

5. RESPUESTA
   200 OK
   {
     "success": true,
     "service": "ALUMNOS",
     "method": "getAlumno",
     "result": {
       "id": "ALU-001",
       "nombre": "Juan Pérez",
       "email": "juan@example.com",
       "activo": true
     }
   }
```

## 5. Matriz de Comunicación entre Servicios

```
┌─────────────────────────┬──────┬────────┬────────┬────────┬──────┐
│ ORIGTEN → DESTINO       │ TIPO │ SYNC   │ AUTH   │ PUERTO │ APPS │
├─────────────────────────┼──────┼────────┼────────┼────────┼──────┤
│ Cliente → API Gateway   │ HTTP │ ✓ Sync │ Bearer │ 8080   │ ✓    │
│ Gateway → Maestros      │ HTTP │ ✓ Sync │ Proxy  │ 5001   │ ✓    │
│ Gateway → Estudiantes   │ HTTP │ ✓ Sync │ Proxy  │ 5002   │ ✓    │
│ Gateway → Rep-Est       │ HTTP │ ✓ Sync │ Proxy  │ 5003   │ ✓    │
│ Gateway → Rep-Maest     │ HTTP │ ✓ Sync │ Proxy  │ 5004   │ ✓    │
│ Gateway → Auth          │ HTTP │ ✓ Sync │ Proxy  │ 5005   │ ✓    │
│ Gateway → Notif         │ HTTP │ ✓ Sync │ Proxy  │ 5006   │ ✓    │
│ Gateway → Analytics     │ HTTP │ ✓ Sync │ Proxy  │ 5007   │ ✓    │
│ Gateway → SOAP          │ HTTP │ ✓ Sync │ Proxy  │ 5008   │ ✓    │
├─────────────────────────┼──────┼────────┼────────┼────────┼──────┤
│ Maestros → Estudiantes  │ HTTP │ ✓ Sync │ Bearer │ 5002   │ ✓    │
│ Estudiantes → Maestros  │ HTTP │ ✓ Sync │ Bearer │ 5001   │ ✓    │
│ Reportes → Maestros     │ HTTP │ ✓ Sync │ Bearer │ 5001   │ ✓    │
│ Reportes → Estudiantes  │ HTTP │ ✓ Sync │ Bearer │ 5002   │ ✓    │
├─────────────────────────┼──────┼────────┼────────┼────────┼──────┤
│ * → SHARED-AUTH         │ NODE │ ✓ Sync │ N/A    │ Local  │ ✓    │
│ * → MongoDB             │ TCP  │ ✓ Sync │ Auth   │ 27017  │ ✓    │
├─────────────────────────┼──────┼────────┼────────┼────────┼──────┤
│ * → Notificaciones      │ HTTP │ async  │ Bearer │ 5006   │ ✓    │
│ * → Analytics           │ HTTP │ async  │ Bearer │ 5007   │ ✓    │
│ * → Kafka               │ Bin. │ async  │ N/A    │ 9092   │ ○    │
│ * → SOAP Bridge         │ HTTP │ ✓ Sync │ Bearer │ 5008   │ ○    │
└─────────────────────────┴──────┴────────┴────────┴────────┴──────┘

LEYENDA:
✓ = Implementado
○ = Opcional
* = Todos los servicios
```

## 6. Stack Tecnológico por Servicio

```
┌──────────────────────────────────────────────────────────────────┐
│ SERVICIO          │ PUERTO │ STACK                              │
├──────────────────────────────────────────────────────────────────┤
│ API Gateway       │ 8080   │ Node.js + Express + http-proxy     │
│ micro-maestros    │ 5001   │ Node.js + Express + Mongoose       │
│ micro-estudiantes │ 5002   │ Node.js + Express + Mongoose       │
│ micro-reportes-*  │ 5003   │ Node.js + Express + Mongoose       │
│ micro-auth        │ 5005   │ Node.js + Express + JWT            │
│ micro-notif       │ 5006   │ Node.js + Express + Nodemailer     │
│ micro-analytics   │ 5007   │ Node.js + Express + KafkaJS        │
│ micro-soap-bridge │ 5008   │ Node.js + Express + xml/soap       │
│ Frontend          │ 5500   │ HTML5 + CSS3 + Vanilla JS          │
│ MongoDB           │ 27017  │ MongoDB 6.0                        │
│ Kafka (opt)       │ 9092   │ Apache Kafka 3.x                   │
└──────────────────────────────────────────────────────────────────┘
```

## 7. Ciclo de Vida de una Solicitud

```
SOLICITUD HTTP
    │
    ▼
┌─────────────────────────────────┐
│ API Gateway (8080)              │
│ - Recibe solicitud              │
│ - Extrae método y path          │
│ - Busca ruta coincidente        │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ Middleware Logger               │
│ - Log: [TIMESTAMP] METHOD PATH  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ authMiddleware (shared-auth)    │
│ - Si ruta NO requiere auth:     │
│   → Continuar                   │
│ - Si ruta requiere auth:        │
│   ├─ Extrae token del header    │
│   ├─ Valida con AuthService     │
│   ├─ Si inválido → 401          │
│   ├─ Si válido → Agrega req.user│
│   └─ Continuar                  │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ requireRole() o               │
│ requirePermission()            │
│ (Si se especifica)              │
│ - Valida que req.user.role      │
│   coincida con requerimiento    │
│ - Si no → 403 Forbidden         │
│ - Si sí → Continuar             │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ http-proxy-middleware           │
│ - Busca destino según ruta:     │
│   /maestros → http://micro-...  │
│   /estudiantes → http://micro...│
│ - Envía solicitud al microserv. │
│ - Espera respuesta              │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ Microservicio (ej: maestros)    │
│ - Extrae parámetros             │
│ - Valida entrada                │
│ - Procesa lógica de negocio     │
│ - Accede a MongoDB si aplica    │
│ - Retorna respuesta JSON        │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│ API Gateway recibe respuesta    │
│ - Agrega headers (CORS, etc.)   │
│ - Retorna al cliente            │
└─────────────────────────────────┘
    │
    ▼
RESPUESTA HTTP
```

---

**Diagrama Actualizado:** Diciembre 2025  
**Arquitectura:** Microservicios (10 servicios)  
**Patrón:** API Gateway + Shared Auth Module  
**Protocolos:** HTTP/REST, SOAP (legacy), Kafka (streaming)
