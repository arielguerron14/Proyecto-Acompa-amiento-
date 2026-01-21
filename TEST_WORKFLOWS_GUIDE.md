# 🧪 Test & Validation Workflows

Documentación completa de los workflows de pruebas y validación del proyecto.

---

## 📋 Workflows Disponibles

### 1. 🧪 Test Suite (`test-suite.yml`)

**Propósito:** Ejecutar pruebas unitarias, funcionales y generación de cobertura de código.

**Triggers:**
- Push a `main` o `develop` con cambios en `apps/` o `packages/`
- Pull Request a `main` o `develop`
- Manual (workflow_dispatch)

**Opciones de Input:**
```yaml
test_level:
  - unit        # Solo pruebas unitarias
  - functional  # Solo pruebas funcionales
  - full        # Todas las pruebas (default)
  - coverage    # Solo reporte de cobertura
```

**Jobs Ejecutados:**

#### 1.1 Unit Tests
Ejecuta `npm test` en cada microservicio con Jest:
- ✅ micro-auth
- ✅ micro-estudiantes
- ✅ micro-maestros
- ✅ micro-reportes-estudiantes

**Servicios Provistos:**
- MongoDB (27017)
- PostgreSQL (5432)

**Salida:**
```
✅ Logs de pruebas unitarias
✅ Resumen de resultados
✅ Artifacts: unit-test-logs
```

#### 1.2 Functional Tests
Inicia los microservicios y valida:
- ✅ Endpoints disponibles
- ✅ Documentación de API
- ✅ Respuestas HTTP correctas

**Endpoints Probados:**
```
GET  /auth/health
GET  /auth/status
POST /auth/register
POST /auth/login

GET  /estudiantes/health
GET  /maestros/health
GET  /reportes/health
```

**Salida:**
```
✅ Estado de cada endpoint
✅ Tiempos de respuesta
✅ Artifacts: functional-test-logs
```

#### 1.3 Code Coverage
Genera reportes de cobertura de código:

**Comando:**
```bash
npm run test:coverage
```

**Salida:**
```
📊 coverage/coverage-summary.json
📊 coverage/lcov.info
📊 Reporte HTML en coverage/
```

#### 1.4 Test Summary
Reporte final consolidado de todos los tests.

**Output:**
```markdown
## 🧪 Complete Test Suite Summary
- Unit Tests: passed/failed
- Functional Tests: passed/failed
- Coverage Report: status
```

---

### 2. 🔗 Endpoint Validation (`endpoint-validation.yml`)

**Propósito:** Monitoreo de salud de endpoints en producción (AWS EC2).

**Triggers:**
- Cada 4 horas (programado)
- Manual (workflow_dispatch)

**Endpoints Validados (Nginx/ALB):**

```javascript
ALB (Production):
  - http://<ALB_DNS>/health   // Health check del nginx
  - http://<ALB_DNS>/         // Root endpoint servido por nginx

Notas:
  - `<ALB_DNS>` puede pasarse como input del workflow (`alb_dns`).
  - Por defecto, se usa el DNS conocido si no se provee input.
  - La validación de servicios locales se removió aquí para enfocarse en producción.
```

**Métricas Recolectadas:**
```json
{
  "timestamp": "2026-01-20T12:00:00Z",
  "summary": {
    "total": 7,
    "healthy": 7,
    "unhealthy": 0,
    "uptime_percentage": 100
  },
  "endpoints": [
    {
      "endpoint": "Frontend",
      "status": 200,
      "duration": 145,
      "success": true
    }
  ]
}
```

**Salida:**
```
✅ endpoint-validation.json (descargable como artifact)
✅ Reporte en GitHub Step Summary
✅ Notificación en caso de fallos
```

---

### 3. 🔄 Integration Tests (`integration-tests.yml`)

**Propósito:** Pruebas de integración entre servicios.

**Triggers:**
- Push a `main` o `develop` con cambios en `apps/`
- Pull Request a `main` o `develop`
- Manual (workflow_dispatch)

**Servicios Provistos:**
- MongoDB (27017)
- PostgreSQL (5432)
- Redis (6379)

**Tests Incluidos:**

#### 3.1 Database Connectivity
Verifica conexión a:
- ✅ MongoDB
- ✅ PostgreSQL

#### 3.2 Service Communication Flows
Valida flujos de integración:
```
1. Auth → DB
   User authentication writes to database

2. Auth → Message Broker
   Auth events published to message queue

3. Estudiantes ↔ MongoDB
   Student data CRUD operations

4. Frontend → API Gateway → Microservices
   Full request chain through architecture

5. Reportes → Data Aggregation
   Reports query multiple databases
```

#### 3.3 API Interactions
Prueba health checks en todos los servicios:
```bash
GET localhost:3001/auth/health
GET localhost:3002/estudiantes/health
GET localhost:3003/maestros/health
GET localhost:3004/reportes/health
```

**Salida:**
```
✅ Logs de servicios (auth.log, estudiantes.log, etc.)
✅ Resultados de interacciones API
✅ Reporte consolidado
```

---

## 🚀 Cómo Usar

### Ejecutar Tests Localmente

**Unit Tests:**
```bash
cd apps/micro-auth
npm test
npm run test:coverage
```

**Functional Tests:**
```bash
# Iniciar servicios
cd apps/micro-auth && npm start &
cd apps/micro-estudiantes && npm start &

# Correr pruebas funcionales
node test-endpoints.js
```

### Disparar Workflows Manualmente

#### Desde GitHub CLI:
```bash
# Test Suite
gh workflow run test-suite.yml -f test_level=full

# Endpoint Validation
gh workflow run endpoint-validation.yml

# Integration Tests
gh workflow run integration-tests.yml
```

#### Desde GitHub Web:
1. Ve a **Actions** → Selecciona workflow
2. Click **Run workflow**
3. Selecciona rama (main/develop)
4. Opcional: Configura inputs
5. Click **Run workflow**

### Descargar Artifacts

```bash
# Desde GitHub CLI
gh run download <RUN_ID> -n unit-test-logs
gh run download <RUN_ID> -n functional-test-logs
gh run download <RUN_ID> -n coverage-reports
gh run download <RUN_ID> -n endpoint-validation-<RUN_ID>
gh run download <RUN_ID> -n integration-test-logs
```

---

## 📊 Interpretando Resultados

### Unit Tests
```
✅ PASSED - Todos los tests pasaron
⚠️  WARNING - Algunos tests fallaron pero continuaron
❌ FAILED - Al menos un test crítico falló
```

**Acciones:**
- ✅ PASSED: Seguro hacer merge
- ⚠️ WARNING: Revisar logs antes de merge
- ❌ FAILED: Arreglar antes de merge

### Functional Tests
```
200 OK        - Endpoint disponible y funciona
404 NOT FOUND - Endpoint no existe
500 ERROR     - Servidor error interno
TIMEOUT       - Endpoint no responde en tiempo límite
ERROR         - Conexión rechazada/red
```

### Code Coverage
```
80-100%  - Excelente
60-80%   - Bueno
40-60%   - Moderado (mejora recomendada)
<40%     - Bajo (revisión necesaria)
```

### Endpoint Validation
```
✅ All endpoints healthy (100%)
🟡 Degraded (>80% healthy)
🔴 Critical (>50% down)
```

---

## 🔧 Configuración

### Variables de Entorno

**Test Suite:**
```yaml
NODE_VERSION: '20'
MONGODB_URI: 'mongodb://localhost:27017/test'
POSTGRES_HOST: 'localhost'
POSTGRES_USER: 'test'
POSTGRES_PASSWORD: 'test'
POSTGRES_DB: 'test'
```

**Endpoint Validation:**
Se actualizan automáticamente con las IPs de AWS desde secretos:
```
AWS_FRONTEND_PUBLIC_IP
AWS_APIGW_PUBLIC_IP
```

### Secrets Requeridos

Ninguno es requerido por los workflows de test (usan valores por defecto).

Para validación de producción, se pueden actualizar en `.github/workflows/endpoint-validation.yml`:
```yaml
{
  name: 'Frontend',
  url: 'http://YOUR_FRONTEND_IP:5500'
},
{
  name: 'API Gateway',
  url: 'http://YOUR_APIGW_IP:8080'
}
```

---

## 📈 Métricas y Reportes

### Dónde Ver Resultados

| Workflow | Ubicación | Detalles |
|----------|-----------|---------|
| Test Suite | Actions → test-suite → Summary | Resumen ejecutivo |
| Test Suite | Actions → test-suite → Artifacts | Logs y coverage |
| Endpoint Validation | Actions → endpoint-validation → Summary | JSON report |
| Endpoint Validation | Actions → endpoint-validation → Artifacts | endpoint-validation.json |
| Integration Tests | Actions → integration-tests → Summary | Reporte de flujos |
| Integration Tests | Actions → integration-tests → Artifacts | Service logs |

### GitHub Step Summary

Cada workflow genera un resumen visual en:
```
GitHub Actions Run → Resumen → Step Summary
```

Incluye:
- ✅/❌ Estado de cada test
- 📊 Métricas cuantitativas
- 📋 Endpoints probados
- ⏰ Timestamps
- 📁 Artifacts disponibles

---

## 🐛 Troubleshooting

### Test Suite Falla

**Problema:** `npm install` falla
**Solución:** 
```bash
npm install --legacy-peer-deps
```

**Problema:** MongoDB/PostgreSQL no conecta
**Solución:**
- Workflow usa servicios Docker (automático en CI)
- Localmente: iniciar manualmente
```bash
docker run -d -p 27017:27017 mongo:6
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:15
```

### Endpoint Validation Falla

**Problema:** Endpoints devuelven TIMEOUT
**Solución:**
- Verificar que las instancias EC2 están corriendo
- Verificar Security Groups permiten puertos 5500, 8080
- Verificar IPs en workflow coinciden con AWS

### Integration Tests Falla

**Problema:** Services no inician
**Solución:**
```bash
# Verificar logs
cat apps/*/auth.log
cat apps/*/estudiantes.log

# Verificar puertos disponibles
lsof -i :3001  # Auth
lsof -i :3002  # Estudiantes
```

---

## ✨ Mejoras Futuras

- [ ] Badge de status en README
- [ ] Reports automáticos en Slack
- [ ] Performance benchmarks
- [ ] E2E tests con Cypress/Playwright
- [ ] Load testing con k6
- [ ] Security scanning
- [ ] SBOM generation
- [ ] Compatibility matrix

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisar logs en Artifacts
2. Ejecutar localmente con: `npm test`
3. Verificar GitHub Issues existentes
4. Crear issue detallado con:
   - Workflow name
   - Run number
   - Error message
   - Ambiente (local/CI)
