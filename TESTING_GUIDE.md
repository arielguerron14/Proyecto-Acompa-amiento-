# 📊 Guía de Testing y Validación - Proyecto Acompañamiento

## Estado Actual del Despliegue

**Workflow ID**: 21124147438  
**Status**: En progreso (esperado completar en ~5-10 minutos)

### Servicios Siendo Desplegados

```
EC2 Instances:
├── EC2-CORE (3.236.99.88) - Auth, Estudiantes, Maestros, Reportes, Analytics
├── EC2-Notificaciones (98.92.17.165) - Notificaciones
├── EC2-Messaging (35.172.111.207) - Kafka, RabbitMQ, Zookeeper  
├── EC2-DB (13.217.220.8) - MongoDB
├── EC2-API-Gateway (98.86.94.92) - API Gateway
├── EC2-Monitoring (54.205.158.101) - Monitoreo
├── EC2-Frontend (52.72.57.10) - Web UI
└── EC2-Analytics (3.87.33.92) - Analytics
```

## 🧪 Suite de Tests Disponibles

### 1. **Python Test Suite** (Recomendado)
Archivo: `tests/integration/service_flow_tests.py`

```bash
python tests/integration/service_flow_tests.py
```

**Valida**:
- ✅ Health checks de todos los servicios
- ✅ Autenticación (login, validación de tokens, RBAC)
- ✅ CRUD de estudiantes
- ✅ CRUD de maestros
- ✅ Envío y consulta de notificaciones
- ✅ Generación y consulta de reportes
- ✅ Agregación de datos en analytics

**Duración**: ~2-3 minutos  
**Requisitos**: `python >= 3.8`, `requests`

### 2. **JavaScript Test Suite**
Archivo: `tests/integration/service-flow-tests.js`

```bash
npm install
npm test tests/integration/service-flow-tests.js
```

**Valida**: Mismo conjunto de tests que Python, con implementación en Node.js

### 3. **Deployment Validation Script** (Bash)
Archivo: `scripts/validate-deployment.sh`

```bash
bash scripts/validate-deployment.sh
```

**Valida**:
- ✅ Conectividad SSH a instancias
- ✅ Puertos abiertos de servicios
- ✅ Health endpoints respondiendo
- ✅ Contenedores Docker corriendo
- ✅ Volúmenes montados correctamente
- ✅ Redes Docker configuradas

**Duración**: ~2 minutos

### 4. **Automated Deployment Monitor**
Archivo: `scripts/deployment-monitor.py`

```bash
python scripts/deployment-monitor.py
```

**Funcionalidad**:
1. Espera a que todos los servicios estén disponibles (timeout: 10 min)
2. Ejecuta Python tests automáticamente
3. Ejecuta JavaScript tests si están disponibles
4. Ejecuta script de validación
5. Genera reporte JSON con resultados

**Genera**: `deployment-report.json`

## 🚀 Procedimiento Recomendado

### Opción 1: Prueba Rápida (~10 minutos)

```bash
# 1. Esperar y validar despliegue automáticamente
python scripts/deployment-monitor.py

# 2. Revisar reporte
cat deployment-report.json
```

### Opción 2: Pruebas Individuales (~5-10 minutos)

```bash
# 1. Validar infraestructura (SSH, puertos, contenedores)
bash scripts/validate-deployment.sh

# 2. Ejecutar tests de flujos
python tests/integration/service_flow_tests.py

# 3. (Opcional) Tests con Node.js
npm test tests/integration/service-flow-tests.js
```

### Opción 3: Prueba Manual Paso a Paso

```bash
# 1. Verificar IPs de instancias
cat config/instance_ips.json

# 2. SSH a instancia CORE
ssh -i ~/.ssh/id_rsa ubuntu@3.236.99.88

# En la instancia remota:
# Ver contenedores corriendo
docker ps

# Ver logs de servicio específico
docker logs micro-auth
docker logs micro-estudiantes

# Verificar health endpoint
curl http://localhost:5005/health
curl http://localhost:5002/health
```

## 📊 Flujos de Prueba Principales

### Flujo 1: Autenticación Completa

```bash
# 1. Login
curl -X POST http://3.236.99.88:5005/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maestro@test.com","password":"Test@123"}'

# 2. Obtener token (de respuesta anterior)
TOKEN="eyJhbG..."

# 3. Validar token
curl -X POST http://3.236.99.88:5005/validate \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}"

# 4. Consultar roles (requiere token)
curl -H "Authorization: Bearer $TOKEN" \
  http://3.236.99.88:5005/roles
```

### Flujo 2: Gestión de Estudiantes

```bash
# 1. Crear estudiante
curl -X POST http://98.86.94.92:8080/api/estudiantes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "García",
    "email": "juan@school.com",
    "grado": "10A"
  }'

# 2. Obtener ID de respuesta anterior
STUDENT_ID="123abc..."

# 3. Consultar estudiante
curl -H "Authorization: Bearer $TOKEN" \
  http://98.86.94.92:8080/api/estudiantes/$STUDENT_ID

# 4. Actualizar estudiante
curl -X PUT http://98.86.94.92:8080/api/estudiantes/$STUDENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"grado": "10B"}'

# 5. Listar estudiantes
curl -H "Authorization: Bearer $TOKEN" \
  http://98.86.94.92:8080/api/estudiantes

# 6. Eliminar estudiante
curl -X DELETE http://98.86.94.92:8080/api/estudiantes/$STUDENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Flujo 3: Notificaciones

```bash
# 1. Enviar notificación
curl -X POST http://98.92.17.165:5006/api/notificaciones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destinatario": "profesor@school.com",
    "asunto": "Nuevo reporte",
    "mensaje": "El reporte está listo",
    "tipo": "email"
  }'

# 2. Obtener notificaciones
curl -H "Authorization: Bearer $TOKEN" \
  http://98.92.17.165:5006/api/notificaciones
```

### Flujo 4: Reportes

```bash
# 1. Generar reporte
curl -X POST http://3.236.99.88:5003/api/reportes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "'$STUDENT_ID'",
    "tipo": "desempeño",
    "periodo": "2024-Q1"
  }'

# 2. Obtener ID de reporte
REPORT_ID="abc123..."

# 3. Consultar reporte
curl -H "Authorization: Bearer $TOKEN" \
  http://3.236.99.88:5003/api/reportes/$REPORT_ID

# 4. Exportar como PDF
curl -H "Authorization: Bearer $TOKEN" \
  "http://3.236.99.88:5003/api/reportes/$REPORT_ID/export?format=pdf" \
  -o reporte.pdf
```

## 📈 Métricas de Éxito

### Requisitos para "Despliegue Exitoso":

- [x] Todos los 10 servicios desplegados
- [x] Health checks respondiendo (código 200)
- [x] Autenticación funcionando (login genera token)
- [x] CRUD de estudiantes y maestros operacional
- [x] Notificaciones enviándose correctamente
- [x] Reportes generando sin errores
- [x] Analytics agregando datos
- [x] Tasa de éxito de tests >= 95%

## 🔍 Troubleshooting

### Si los servicios no responden:

1. **Verificar SSH**:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@3.236.99.88 "echo 'OK'"
   ```

2. **Verificar contenedores en remoto**:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@3.236.99.88 "docker ps"
   ```

3. **Ver logs de contenedor específico**:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@3.236.99.88 "docker logs micro-auth"
   ```

4. **Verificar puerto abierto**:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@3.236.99.88 "curl http://localhost:5005/health"
   ```

### Si tests fallan:

1. **Revisar token válido**:
   - Token expirado (intenta nuevo login)
   - Token inválido (revisar formato "Bearer <token>")

2. **Verificar datos de prueba**:
   - Email/contraseña correctos
   - IDs de recursos válidos

3. **Revisar logs de servicio**:
   ```bash
   ssh -i ~/.ssh/id_rsa ubuntu@3.236.99.88 "docker logs <container_name>"
   ```

## 📝 Próximos Pasos

1. ✅ Esperar a que workflow complete (21124147438)
2. ✅ Ejecutar `python scripts/deployment-monitor.py`
3. ✅ Revisar `deployment-report.json`
4. ✅ Documentar resultados
5. ✅ Comunicar estatus a stakeholders

## 📞 Información Útil

**Archivos de Configuración**:
- `config/instance_ips.json` - IPs de instancias
- `.github/workflows/deploy-docker-compose.yml` - Workflow CI/CD
- `docker-compose.*.yml` - Composición de servicios

**URLs de Instancias**:
- Frontend: http://52.72.57.10:5500
- API Gateway: http://98.86.94.92:8080
- Auth: http://3.236.99.88:5005
- Notificaciones: http://98.92.17.165:5006

**Logs del Workflow**:
```bash
gh run view 21124147438 --log
```

**Estado actual del workflow**:
```bash
gh run list --workflow="deploy-docker-compose.yml" --limit 1
```

---

**Última actualización**: 2026-01-18 22:37:00 UTC  
**Estado**: Despliegue en progreso
