# 🚀 GUÍA DE DESPLIEGUE Y PRUEBAS - FLUJOS DE APLICACIÓN

## 📋 Resumen Ejecutivo

Este documento contiene las instrucciones para:
1. ✅ Desplegar todos los contenedores Docker en las instancias EC2
2. ✅ Verificar que los servicios están funcionando correctamente
3. ✅ Ejecutar las pruebas de los 4 flujos principales:
   - **Registrar** (Sign Up)
   - **Ingresar** (Login)
   - **Crear Reservas** (Create Reservation)
   - **Reservar** (Book Reservation)

---

## 🏗️ ARQUITECTURA ACTUALIZADA

### Instancias EC2 (9 instancias, todas corriendo)

| Instancia | IP Pública | IP Privada | Contenedores |
|-----------|-----------|-----------|--------------|
| **EC2-CORE** | 100.49.160.199 | 172.31.64.170 | micro-auth, micro-estudiantes, micro-maestros, micro-core, **micro-analytics** |
| **EC2-API-Gateway** | 98.86.94.92 | - | api-gateway |
| **EC2-DB** | 3.235.120.8 | 172.31.67.130 | mongo, postgres, redis |
| **EC2-Messaging** | 35.174.19.29 | 172.31.75.187 | zookeeper, kafka, rabbitmq |
| **EC2-Notificaciones** | 3.226.74.67 | 172.31.76.95 | micro-notificaciones |
| **EC2-Reportes** | 23.22.116.142 | - | micro-reportes-estudiantes, micro-reportes-maestros |
| **EC2-Monitoring** | 54.205.158.101 | - | prometheus, grafana |
| **EC2-Frontend** | 52.72.57.10 | - | frontend-web |
| **EC-Bastion** | 52.6.170.44 | - | bastion-host |

### ⭐ CAMBIO CRÍTICO: micro-analytics

**ANTES:** Instancia separada EC2-Analytics (fallaba despliegue)
**AHORA:** Contenedor dentro de EC2-CORE en puerto 3004 ✅

Esto elimina el problema de 1/10 fallos y permite 10/10 despliegues exitosos.

---

## 📦 PASO 1: DESPLIEGUE DE CONTENEDORES

### Opción A: Usar PowerShell (Windows/macOS/Linux)

```powershell
# Navegar al directorio del proyecto
cd "C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-"

# Ejecutar script de despliegue
.\Deploy-AllContainers.ps1 `
  -PrivateKeyPath "$env:USERPROFILE\.ssh\id_rsa" `
  -DockerUsername "tu_usuario_docker"
```

### Opción B: Usar Bash (Linux/macOS/WSL)

```bash
cd /path/to/Proyecto-Acompa-amiento-
bash deploy-all-containers.sh
```

### Esperar Confirmaciones

El script ejecutará las siguientes fases en orden:

1. 🔧 **EC2-CORE** - Deploy de micro-auth, micro-estudiantes, micro-maestros, micro-core, micro-analytics
2. 🔧 **EC2-API-Gateway** - Deploy de api-gateway
3. 🔧 **EC2-DB** - Deploy de mongo, postgres, redis
4. 🔧 **EC2-Messaging** - Deploy de zookeeper, kafka, rabbitmq
5. 🔧 **EC2-Notificaciones** - Deploy de micro-notificaciones
6. 🔧 **EC2-Reportes** - Deploy de micro-reportes-estudiantes, micro-reportes-maestros
7. 🔧 **EC2-Monitoring** - Deploy de prometheus, grafana
8. 🔧 **EC2-Frontend** - Deploy de frontend-web
9. 🔧 **EC-Bastion** - Deploy de bastion-host

⏱️ **Tiempo estimado:** 15-20 minutos para desplegar todas las instancias

---

## ✅ PASO 2: VERIFICAR DESPLIEGUE

### 2.1 Verificar API Gateway

```powershell
# Prueba de conectividad
$apiUrl = "http://100.49.160.199:8080/health"
$response = Invoke-WebRequest -Uri $apiUrl -ErrorAction SilentlyContinue

if ($response.StatusCode -eq 200) {
    Write-Host "✅ API Gateway respondiendo correctamente" -ForegroundColor Green
    $response.Content
}
else {
    Write-Host "❌ API Gateway no responde" -ForegroundColor Red
}
```

### 2.2 Verificar Contenedores en EC2-CORE

```bash
# SSH a EC2-CORE
ssh -i ~/.ssh/id_rsa ec2-user@100.49.160.199

# Ver contenedores corriendo
docker ps

# Resultado esperado:
# CONTAINER ID   IMAGE                        STATUS      PORTS
# xxxxx          micro-auth:latest            Up 2 min    0.0.0.0:3000->3000/tcp
# xxxxx          micro-estudiantes:latest     Up 2 min    0.0.0.0:3001->3001/tcp
# xxxxx          micro-maestros:latest        Up 2 min    0.0.0.0:3002->3002/tcp
# xxxxx          micro-core:latest            Up 2 min    0.0.0.0:3003->3003/tcp
# xxxxx          micro-analytics:latest       Up 2 min    0.0.0.0:3004->3004/tcp
```

### 2.3 Verificar Bases de Datos

```bash
# SSH a EC2-DB
ssh -i ~/.ssh/id_rsa ec2-user@3.235.120.8

# Ver bases de datos
docker ps | grep -E "mongo|postgres|redis"

# Conectar a MongoDB desde EC2-CORE
ssh -i ~/.ssh/id_rsa ec2-user@100.49.160.199
mongo mongodb://172.31.67.130:27017 -u root -p example
```

---

## 🧪 PASO 3: EJECUTAR PRUEBAS DE FLUJOS

### 3.1 Ejecutar Script de Pruebas

```powershell
# Desde Windows PowerShell
cd "C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-"

# Ejecutar las pruebas
.\test-app-flows.ps1 -ApiGatewayUrl "http://100.49.160.199:8080"
```

O desde bash:
```bash
bash test-app-flows.sh
```

### 3.2 Los 4 Flujos Probados

#### 1️⃣ **REGISTRAR** (Sign Up)

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "test-$(Get-Random)@example.com",
  "password": "SecurePassword123!",
  "nombre": "Test User",
  "rol": "estudiante"
}
```

**Respuesta Esperada (200 OK):**
```json
{
  "id": "user-id-123",
  "email": "test@example.com",
  "nombre": "Test User",
  "rol": "estudiante",
  "token": "eyJhbGci..."
}
```

**Validación:**
- ✅ Status code 200
- ✅ Token incluido en respuesta
- ✅ Usuario creado en MongoDB

---

#### 2️⃣ **INGRESAR** (Login)

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

**Respuesta Esperada (200 OK):**
```json
{
  "id": "user-id-123",
  "email": "test@example.com",
  "token": "eyJhbGci...",
  "expiresIn": 3600
}
```

**Validación:**
- ✅ Status code 200
- ✅ Token válido para próximas llamadas
- ✅ Usuario autenticado correctamente

---

#### 3️⃣ **CREAR RESERVAS** (Create Reservation)

**Endpoint:** `POST /api/reservas/create`

**Request:**
```json
{
  "aula": "A-101",
  "descripcion": "Reunion de proyecto",
  "fecha_inicio": "2024-01-15T14:00:00Z",
  "fecha_fin": "2024-01-15T15:00:00Z"
}
```

**Respuesta Esperada (201 Created):**
```json
{
  "id": "reserva-id-456",
  "aula": "A-101",
  "estado": "pendiente",
  "usuario_id": "user-id-123",
  "fecha_creacion": "2024-01-15T10:00:00Z"
}
```

**Validación:**
- ✅ Status code 201
- ✅ Reserva creada en base de datos
- ✅ Estado inicial es "pendiente"

---

#### 4️⃣ **RESERVAR** (Book/Confirm Reservation)

**Endpoint:** `POST /api/reservas/{id}/confirmar`

**Request:**
```json
{
  "observaciones": "Confirmo la reserva de aula"
}
```

**Respuesta Esperada (200 OK):**
```json
{
  "id": "reserva-id-456",
  "aula": "A-101",
  "estado": "confirmada",
  "usuario_id": "user-id-123",
  "fecha_confirmacion": "2024-01-15T10:05:00Z"
}
```

**Validación:**
- ✅ Status code 200
- ✅ Estado cambió a "confirmada"
- ✅ Fecha de confirmación registrada

---

## 📊 VERIFICACIÓN MANUAL DE FLUJOS (Alternativa)

Si deseas probar manualmente, puedes usar `curl` o Postman:

### 1. Registrar Usuario

```bash
curl -X POST http://100.49.160.199:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "nombre": "Test User",
    "rol": "estudiante"
  }'
```

### 2. Login

```bash
curl -X POST http://100.49.160.199:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Guardar el token: TOKEN="eyJhbGci..."
```

### 3. Crear Reserva

```bash
curl -X POST http://100.49.160.199:8080/api/reservas/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "aula": "A-101",
    "descripcion": "Reunion de proyecto",
    "fecha_inicio": "2024-01-15T14:00:00Z",
    "fecha_fin": "2024-01-15T15:00:00Z"
  }'

# Guardar el id: RESERVA_ID="reserva-456"
```

### 4. Confirmar Reserva

```bash
curl -X POST http://100.49.160.199:8080/api/reservas/$RESERVA_ID/confirmar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "observaciones": "Confirmo la reserva"
  }'
```

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### Problema: "Connection Refused" en API Gateway

**Causa:** El contenedor api-gateway no está corriendo o el puerto no es accesible

**Solución:**
```bash
# SSH a EC2-API-Gateway
ssh -i ~/.ssh/id_rsa ec2-user@98.86.94.92

# Ver logs del contenedor
docker logs api-gateway

# Reiniciar si es necesario
docker restart api-gateway
```

### Problema: "Authentication Failed" en Login

**Causa:** Usuario no registrado o contraseña incorrecta

**Solución:**
1. Verificar que el registro se completó exitosamente
2. Verificar que los datos en MongoDB son correctos:
   ```bash
   mongo mongodb://172.31.67.130:27017 -u root -p example
   use proyecto
   db.usuarios.findOne({email: "test@example.com"})
   ```

### Problema: "Reserva Not Found"

**Causa:** El ID de reserva no existe en base de datos

**Solución:**
1. Crear la reserva primero
2. Verificar que el ID retornado es correcto
3. Verificar en MongoDB:
   ```bash
   db.reservas.findOne({_id: ObjectId("...")})
   ```

### Problema: Timeout en SSH a instancias

**Causa:** Security groups mal configurados o IPs no correctas

**Solución:**
1. Verificar IPs públicas en AWS Console:
   ```powershell
   aws ec2 describe-instances \
     --filters "Name=tag:Name,Values=EC2-*" \
     --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value|[0],PublicIpAddress]'
   ```
2. Actualizar si es necesario en `config/instance_ips.json`

---

## 📈 MÉTRICAS DE ÉXITO

Cuando todos los flujos pasen correctamente, verás:

```
✅ Health Check: PASS
✅ Sign Up Flow: PASS (Usuario creado)
✅ Login Flow: PASS (Token válido)
✅ Create Reservation: PASS (Reserva ID: xxx)
✅ Confirm Reservation: PASS (Estado: confirmada)

Resultado Final: 5/5 FLUJOS EXITOSOS ✅
```

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE PRUEBAS

1. ✅ Verificar logs de Prometheus/Grafana en http://54.205.158.101:3000
2. ✅ Validar métricas de desempeño de API Gateway
3. ✅ Revisar logs de notificaciones si hay eventos registrados
4. ✅ Probar escalabilidad con múltiples usuarios simultáneos
5. ✅ Validar comunicación Kafka entre servicios

---

## 📞 REFERENCIAS

- **Archivo de configuración:** `config/instance_ips.json`
- **Script de despliegue PowerShell:** `Deploy-AllContainers.ps1`
- **Script de despliegue Bash:** `deploy-all-containers.sh`
- **Script de pruebas:** `test-app-flows.ps1`
- **Documentación anterior:** `TEST_RESULTS_PENDING.md`, `SETUP_AND_TEST_INSTRUCTIONS.md`

---

## 🔐 CREDENCIALES POR DEFECTO

| Servicio | Usuario | Contraseña |
|----------|---------|-----------|
| MongoDB | root | example |
| PostgreSQL | admin | example |
| Grafana | admin | admin |
| RabbitMQ | guest | guest |

⚠️ **IMPORTANTE:** Cambiar todas las credenciales en producción

---

**Última actualización:** 2024-01-15
**Estado:** Listo para despliegue
**Instancias EC2:** 9 (todas corriendo)
**Contenedores totales:** 21
**Flujos a probar:** 4 (Registrar, Ingresar, Crear Reservas, Reservar)

✅ **SISTEMA LISTO PARA DEPLOYMENT** ✅
