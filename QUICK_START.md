# 🚀 QUICK START - COMIENZA AQUÍ

## En 5 pasos, despliega todo en ~40 minutos

### 📍 ESTÁS AQUÍ: PASO 0
```powershell
# Ya tienes todo configurado. Solo ejecuta:
cd "C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-"
```

---

## 🎯 PASO 1: Validar Configuración (2 minutos)

```powershell
.\Validate-PreDeployment.ps1
```

**Debe mostrar:**
- ✅ SSH disponible
- ✅ Claves SSH presentes
- ✅ config/instance_ips.json válido
- ✅ Scripts de deploy listos

Si hay errores: revisar `DEPLOYMENT_AND_TEST_GUIDE.md` sección "Troubleshooting"

---

## 🔌 PASO 2: Desplegar Contenedores (15-20 minutos)

```powershell
# Configurar usuario Docker
$env:DOCKER_USERNAME = "tu_usuario_docker"  # Cambiar a tu usuario

# Ejecutar deployment
.\Deploy-AllContainers.ps1 -DockerUsername $env:DOCKER_USERNAME
```

**Espera a que termine. Verás:**
```
✅ EC2-CORE completado
✅ EC2-API-Gateway completado
✅ EC2-DB completado
✅ EC2-Messaging completado
✅ EC2-Notificaciones completado
✅ EC2-Reportes completado
✅ EC2-Monitoring completado
✅ EC2-Frontend completado
✅ EC-Bastion completado
```

---

## ✔️ PASO 3: Verificar Despliegue (5 minutos)

```powershell
# Verificar API Gateway responde
Invoke-WebRequest -Uri "http://100.49.160.199:8080/health" -Verbose

# Debe retornar Status 200
# Resultado: Status Code 200 ✅
```

---

## 🧪 PASO 4: Ejecutar Pruebas (10 minutos)

```powershell
.\test-app-flows.ps1 -ApiGatewayUrl "http://100.49.160.199:8080"
```

**Las 4 pruebas:**
1. ✅ Registrar (Sign Up)
2. ✅ Ingresar (Login)
3. ✅ Crear Reservas
4. ✅ Reservar (Confirm)

**Resultado esperado:**
```
✅ Test 1: PASS - Usuario registrado
✅ Test 2: PASS - Login exitoso
✅ Test 3: PASS - Reserva creada
✅ Test 4: PASS - Reserva confirmada

TOTAL: 4/4 PRUEBAS EXITOSAS ✅
```

---

## 📊 PASO 5: Validar Métricas (5 minutos)

```
Abrir en navegador:
http://54.205.158.101:3000
Usuario: admin
Contraseña: admin
```

Verás dashboard de Grafana con métricas en tiempo real.

---

## ⏱️ TIEMPO TOTAL: ~40 MINUTOS

```
Validación      2 min ✅
Deployment     18 min ✅
Verificación    5 min ✅
Pruebas        10 min ✅
Análisis        5 min ✅
───────────────────
TOTAL          40 min ✅
```

---

## 🆘 ¿ALGO SALIÓ MAL?

### Error: "Connection refused" en API Gateway
```powershell
# Verificar que EC2-API-Gateway tiene contenedor corriendo
ssh -i "$env:USERPROFILE\.ssh\id_rsa" ec2-user@98.86.94.92
docker logs api-gateway
docker restart api-gateway
```

### Error: SSH timeout
```powershell
# Ejecutar validación
.\Validate-PreDeployment.ps1

# Verificar que IPs son correctas en AWS Console
```

### Error: "Authentication failed"
```powershell
# El usuario no existe. Primero hacer Sign Up (Paso 4, Test 1)
```

**Más problemas:** Ver [DEPLOYMENT_AND_TEST_GUIDE.md](DEPLOYMENT_AND_TEST_GUIDE.md) sección Troubleshooting

---

## 📚 DOCUMENTACIÓN COMPLETA

| Archivo | Propósito |
|---------|----------|
| [README_FINAL.md](README_FINAL.md) | Resumen completo de trabajo |
| [DEPLOYMENT_AND_TEST_GUIDE.md](DEPLOYMENT_AND_TEST_GUIDE.md) | Guía detallada |
| [ESTADO_ACTUAL_PROYECTO.md](ESTADO_ACTUAL_PROYECTO.md) | Estado del proyecto |
| [Project-Dashboard.ps1](Project-Dashboard.ps1) | Dashboard interactivo |

---

## 🎯 LO QUE SE DESPLEGA

### 9 Instancias EC2 → 21 Contenedores

**EC2-CORE** (100.49.160.199)
- micro-auth, micro-estudiantes, micro-maestros, micro-core, micro-analytics

**EC2-API-Gateway** (98.86.94.92)
- api-gateway

**EC2-DB** (3.235.120.8)
- mongo, postgres, redis

**EC2-Messaging** (35.174.19.29)
- zookeeper, kafka, rabbitmq

**EC2-Notificaciones** (3.226.74.67)
- micro-notificaciones

**EC2-Reportes** (23.22.116.142)
- micro-reportes-estudiantes, micro-reportes-maestros

**EC2-Monitoring** (54.205.158.101)
- prometheus, grafana

**EC2-Frontend** (52.72.57.10)
- frontend-web

**EC-Bastion** (52.6.170.44)
- bastion-host

---

## ✨ LOS 4 FLUJOS PROBADOS

### 1. REGISTRAR (Sign Up)
```
POST /api/auth/register
Input:  email, password, nombre, rol
Output: token, user_id
```

### 2. INGRESAR (Login)
```
POST /api/auth/login
Input:  email, password
Output: token
```

### 3. CREAR RESERVAS (Create Reservation)
```
POST /api/reservas/create
Input:  aula, descripcion, fecha_inicio, fecha_fin
Output: reserva_id, estado="pendiente"
```

### 4. RESERVAR (Confirm Reservation)
```
POST /api/reservas/{id}/confirmar
Input:  observaciones
Output: estado="confirmada"
```

---

## 🔐 CREDENCIALES

| Servicio | User | Password |
|----------|------|----------|
| MongoDB | root | example |
| PostgreSQL | admin | example |
| Grafana | admin | admin |
| RabbitMQ | guest | guest |

---

## ✅ CHECKLIST FINAL

Antes de empezar:
- [ ] SSH keys en `~/.ssh/id_rsa`
- [ ] Todas las instancias "En ejecución" en AWS
- [ ] Variable Docker Username lista

Después de desplegar:
- [ ] Todos los 21 contenedores corriendo
- [ ] API Gateway responde
- [ ] 4/4 pruebas de flujo exitosas
- [ ] Grafana accesible

---

## 🎉 ¡LISTO!

Ejecuta en orden:
```powershell
.\Validate-PreDeployment.ps1
$env:DOCKER_USERNAME = "tu_usuario"
.\Deploy-AllContainers.ps1 -DockerUsername $env:DOCKER_USERNAME
.\test-app-flows.ps1 -ApiGatewayUrl "http://100.49.160.199:8080"
```

**Duración: ~40 minutos** ⏱️

**Resultado esperado:** ✅ Todos los flujos funcionando correctamente

---

**Status:** ✅ LISTO
**Últimas actualizaciones:** 2024-01-15
**Repositorio:** https://github.com/arielguerron14/Proyecto-Acompa-amiento-
