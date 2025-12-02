# 🚀 Guía de Inicio Rápido - 4 Nuevos Microservicios

Instrucciones para empezar a trabajar con los 4 nuevos microservicios (micro-auth, micro-notificaciones, micro-analytics, micro-soap-bridge).

## ⚡ Inicio Ultrarrápido (Docker)

```bash
# 1. Clonar/Actualizar repositorio
cd Proyecto-Acompa-amiento-
git pull

# 2. Build todas las imágenes (incluye los nuevos servicios)
docker-compose build

# 3. Levantar TODOS los servicios (10 microservicios + MongoDB)
docker-compose up -d

# 4. Verificar que todo está corriendo
docker-compose ps

# Debería mostrar:
# - proyecto-mongo (27017)
# - micro-maestros (5001)
# - micro-estudiantes (5002)
# - micro-reportes-estudiantes (5003)
# - micro-reportes-maestros (5004)
# - micro-auth (5005) ✨ NUEVO
# - micro-notificaciones (5006) ✨ NUEVO
# - micro-analytics (5007) ✨ NUEVO
# - micro-soap-bridge (5008) ✨ NUEVO
# - api-gateway (8080)
# - frontend-web (5500)

# 5. Ver logs en tiempo real
docker-compose logs -f
```

## 🔍 Verificar que los Nuevos Servicios están Activos

```bash
# Verificar health de cada nuevo servicio
curl http://localhost:5005/health  # micro-auth
curl http://localhost:5006/health  # micro-notificaciones
curl http://localhost:5007/health  # micro-analytics
curl http://localhost:5008/health  # micro-soap-bridge

# Respuesta esperada:
# {"status":"healthy","service":"micro-auth","timestamp":"2024-12-01T..."}
```

## 📝 Ejemplos de Uso - Nuevos Servicios

### 1. **micro-auth** (Autenticación Centralizada)

```bash
# Verificar un token JWT
curl -X POST http://localhost:5005/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"eyJhbGc..."}'

# Validar un permiso
curl -X POST http://localhost:5005/auth/validate-permission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "userId": "user-001",
    "role": "maestro",
    "requiredPermission": "create:horarios"
  }'

# Listar roles disponibles
curl http://localhost:5005/auth/roles

# Ver permisos de un rol
curl http://localhost:5005/auth/roles/maestro/permissions
```

### 2. **micro-notificaciones** (Envío de Notificaciones)

```bash
# Enviar email
curl -X POST http://localhost:5006/notificaciones/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "to": "user@example.com",
    "subject": "Bienvenido",
    "templateId": "WELCOME",
    "data": {
      "appName": "Mi Sistema",
      "name": "Juan"
    }
  }'

# Enviar SMS
curl -X POST http://localhost:5006/notificaciones/sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "phoneNumber": "+34612345678",
    "message": "Tu código es: 123456"
  }'

# Enviar push notification
curl -X POST http://localhost:5006/notificaciones/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "userId": "user-001",
    "title": "Nueva Reserva",
    "body": "Tu reserva ha sido confirmada",
    "data": {"reservaId": "RES-123"}
  }'

# Ver templates disponibles
curl http://localhost:5006/notificaciones/templates
```

### 3. **micro-analytics** (Analytics en Tiempo Real)

```bash
# Listar eventos
curl http://localhost:5007/analytics/events?limit=10 \
  -H "Authorization: Bearer <TOKEN>"

# Ver estadísticas
curl http://localhost:5007/analytics/stats?period=7d \
  -H "Authorization: Bearer <TOKEN>"

# Registrar un evento manualmente
curl -X POST http://localhost:5007/analytics/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "eventType": "reservas",
    "userId": "user-001",
    "metadata": {
      "reservaId": "RES-123",
      "action": "created"
    }
  }'

# Generar reporte (solo admin)
curl http://localhost:5007/analytics/report?format=json \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Exportar como CSV
curl http://localhost:5007/analytics/report?format=csv \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -o analytics-report.csv
```

### 4. **micro-soap-bridge** (Integración SOAP Legacy)

```bash
# Listar servicios SOAP disponibles
curl http://localhost:5008/soap/services \
  -H "Authorization: Bearer <TOKEN>"

# Llamar un servicio SOAP (ejemplo: obtener alumno)
curl -X POST http://localhost:5008/soap/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "serviceName": "ALUMNOS",
    "method": "getAlumno",
    "args": {"id": "ALU-001"}
  }'

# Llamar servicio de calificaciones
curl -X POST http://localhost:5008/soap/call \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "serviceName": "CALIFICACIONES",
    "method": "getCalificacion",
    "args": {"id": "CAL-001"}
  }'

# Transformar datos JSON a SOAP XML
curl -X POST http://localhost:5008/soap/transform \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "data": {"alumnoId": "ALU-001", "nombre": "Juan"},
    "format": "soap"
  }'

# Obtener WSDL de un servicio
curl http://localhost:5008/soap/wsdl/ALUMNOS
```

## 🔐 Obtener Token JWT para Pruebas

```bash
# Hacer login (través del API Gateway)
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maestro@sistema.com",
    "password": "maestro123"
  }'

# Respuesta:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc...",
#   "user": {"userId": "maestro-001", "email": "maestro@sistema.com", "role": "maestro"}
# }

# Usar el accessToken en las solicitudes subsiguientes:
curl http://localhost:5005/auth/roles \
  -H "Authorization: Bearer <AQUI_VA_EL_TOKEN>"
```

## 🛠️ Desarrollo Local (Sin Docker)

Si prefieres desarrollar sin Docker:

```bash
# 1. Instalar dependencias de cada servicio
npm install --prefix micro-auth
npm install --prefix micro-notificaciones
npm install --prefix micro-analytics
npm install --prefix micro-soap-bridge

# 2. Iniciar MongoDB (si usas Docker solo para esto)
docker run -d --name proyecto-mongo -p 27017:27017 mongo:6.0

# 3. Iniciar cada servicio en una terminal separada
npm start --prefix micro-auth              # Terminal 1
npm start --prefix micro-notificaciones    # Terminal 2
npm start --prefix micro-analytics         # Terminal 3
npm start --prefix micro-soap-bridge       # Terminal 4

# 4. Iniciar otros servicios necesarios
npm start --prefix api-gateway             # Terminal 5
npm start --prefix frontend-web            # Terminal 6
```

## 📋 Variables de Entorno Importantes

### micro-auth
```env
PORT=5005
JWT_SECRET=tu-secret-key-cambiar-en-produccion
REFRESH_SECRET=tu-refresh-secret-cambiar-en-produccion
```

### micro-notificaciones
```env
PORT=5006
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@sistema.com
```

### micro-analytics
```env
PORT=5007
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=micro-analytics
```

### micro-soap-bridge
```env
PORT=5008
SOAP_ALUMNOS_URL=http://legacy-system:8080/ws/alumnos
SOAP_CALIFICACIONES_URL=http://legacy-system:8080/ws/calificaciones
SOAP_ASISTENCIA_URL=http://legacy-system:8080/ws/asistencia
```

## 🐛 Solución de Problemas

### Los nuevos servicios no aparecen en docker-compose ps

**Problema:** Posiblemente falló el build

**Solución:**
```bash
docker-compose build --no-cache micro-auth
docker-compose build --no-cache micro-notificaciones
docker-compose build --no-cache micro-analytics
docker-compose build --no-cache micro-soap-bridge
```

### micro-notificaciones: Error de SMTP

**Problema:** No puede conectar al servidor SMTP

**Solución:**
1. Verificar credenciales en `.env`
2. Usar Ethereal Email (testing): https://ethereal.email
3. Para Gmail: usar App Passwords, no contraseña normal

### micro-analytics: Kafka no conecta

**Problema:** KAFKA_ENABLED=true pero Kafka no está corriendo

**Solución:**
```bash
# Opción 1: Deshabilitar Kafka en desarrollo
# Cambiar KAFKA_ENABLED=false en docker-compose.yml

# Opción 2: Levantar Kafka (si tienes docker-compose de Kafka)
docker-compose -f kafka-compose.yml up -d
```

### micro-soap-bridge: Error 404 en SOAP service

**Problema:** Legacy system no está disponible

**Solución:**
1. Verificar que el legacy system está corriendo en la URL configurada
2. En desarrollo, usar mock (implementado por defecto)
3. Cambiar SOAP_*_URL en .env cuando el legacy esté disponible

## 📚 Documentación Detallada

- [MICROSERVICES_GUIDE.md](./MICROSERVICES_GUIDE.md) - Guía completa de todos los servicios
- [CHECKLIST.md](./CHECKLIST.md) - Lista de verificación del proyecto
- [shared-auth/README.md](./shared-auth/README.md) - Documentación del módulo de auth
- [micro-auth/README.md](./micro-auth/README.md) - Documentación de micro-auth
- [micro-notificaciones/README.md](./micro-notificaciones/README.md) - Documentación de notificaciones
- [micro-analytics/README.md](./micro-analytics/README.md) - Documentación de analytics
- [micro-soap-bridge/README.md](./micro-soap-bridge/README.md) - Documentación de SOAP bridge

## 🎯 Próximos Pasos

1. **Testear endpoints:** Usa los ejemplos de curl anteriores
2. **Integrar con API Gateway:** Ya está configurado en docker-compose
3. **Conectar al frontend:** Los nuevos servicios están disponibles vía gateway
4. **Configurar Kafka:** Descomentar KAFKA_ENABLED=true cuando esté listo
5. **Integrar legacy system:** Actualizar URLs SOAP cuando esté disponible

## 📞 Soporte

Para problemas o preguntas:
1. Revisar los README.md de cada servicio
2. Ver MICROSERVICES_GUIDE.md para arquitectura
3. Revisar docker-compose logs: `docker-compose logs <servicio>`
4. Abrir issue en el repositorio

---

**Última actualización:** Diciembre 2025  
**Proyecto:** Acompañamiento Educativo  
**Versión:** 2.0
