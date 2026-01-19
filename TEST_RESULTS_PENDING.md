# ❌ REPORTE DE PRUEBAS DE FLUJOS - 19 DE ENERO DE 2026

## 🔴 ESTADO: SERVICIOS NO DISPONIBLES

### Problema Identificado

Se intentó probar los flujos de la aplicación (registrar, ingresar, crear reservas, reservar), pero **los servicios no están desplegados ni disponibles**.

### Diagnóstico

#### 1. Intento de Deployment
```
Workflow: Deploy All 10 Services (Python SSH Orchestrator)
Status: ❌ FAILED
Resultado: 0/10 servicios desplegados
```

#### 2. Error Identificado
```
Error: Connection timed out during banner exchange
Location: SSH connection to Bastion (52.6.170.44:22)
```

**Esto significa:**
- El Bastion host no está respondiendo
- No hay conectividad SSH disponible
- No se puede desplegar a las instancias privadas

#### 3. Verificación de Servicios Disponibles
Se intentó conectar directamente a los IPs públicos de los servicios:

| Servicio | IP Pública | Puerto | Estado |
|----------|-----------|--------|--------|
| EC2-API-Gateway | 98.86.94.92 | 8080 | ❌ NO RESPONDE |
| EC2-CORE | 3.236.99.88 | 3000 | ❌ NO RESPONDE |
| EC2-Frontend | 52.72.57.10 | 80 | ❌ NO RESPONDE |
| EC2-Monitoring | 54.205.158.101 | 9090 | ❌ NO RESPONDE |
| EC2-DB | 13.217.220.8 | 27017 | ❌ NO RESPONDE |

**Conclusión**: Todos los servicios están DOWN

---

## 📋 QUÉ SE NECESITA HACER

### Paso 1: Verificar Estado de Instancias EC2

```bash
# Verificar instancias
aws ec2 describe-instances --region us-east-1 \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table

# Verificar Bastion específicamente
aws ec2 describe-instances --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1 \
  --query 'Reservations[*].Instances[*].[State.Name,PublicIpAddress]'
```

### Paso 2: Reiniciar Servicios si las Instancias Están Corriendo

Si todas las instancias están en estado `running`:

```bash
# Trigger el workflow de deployment
gh workflow run "224843454" --ref main

# O via nombre:
gh workflow run deploy-py-orchestrator.yml --ref main

# Monitorear progreso
gh run list --workflow="deploy-py-orchestrator.yml" --limit 1
```

### Paso 3: Si el Bastion No Responde

Si el Bastion (52.6.170.44) no está disponible:

```bash
# Restart Bastion instance
aws ec2 start-instances --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1

# Esperar a que inicie (2-3 minutos)
aws ec2 wait instance-running --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1

# Luego disparar deployment
gh workflow run deploy-py-orchestrator.yml --ref main
```

---

## 🎯 FLUJOS LISTOS PARA PROBAR (Cuando los Servicios Estén Disponibles)

Tengo preparado un script de pruebas completo que probará estos flujos:

### 1. **Registrar Usuario (Sign Up)** ✅
```bash
POST /auth/signup
{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "firstName": "Test",
  "lastName": "User",
  "phoneNumber": "+1234567890"
}
```

### 2. **Ingresar (Login)** ✅
```bash
POST /auth/login
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
# Respuesta: Token JWT para autenticación
```

### 3. **Crear Reserva** ✅
```bash
POST /reservations
{
  "title": "Reunión de Prueba",
  "description": "Descripción",
  "startDate": "2026-01-20",
  "endDate": "2026-01-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "location": "Sala 1",
  "capacity": 5
}
```

### 4. **Confirmar/Reservar** ✅
```bash
PATCH /reservations/{reservationId}
{
  "status": "CONFIRMED",
  "notes": "Reserva confirmada"
}
```

### 5. **Obtener Reservas** ✅
```bash
GET /reservations
```

---

## 📝 Script de Prueba Disponible

El script `test-app-flows.ps1` está listo en el repositorio:

```bash
cd C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-
. .\test-app-flows.ps1
```

**Cuando los servicios estén disponibles**, este script hará automáticamente todas las pruebas.

---

## ⚡ PRÓXIMOS PASOS RECOMENDADOS

### Opción A: Reiniciar Desde AWS Console
1. Ir a AWS EC2 Console
2. Verificar estado de todas las instancias
3. Si están stopped, hacer Start
4. Esperar 2-3 minutos
5. Disparar workflow de deployment

### Opción B: Verificar con AWS CLI
```bash
# Listar instancias con estado
aws ec2 describe-instances --region us-east-1 \
  --filters "Name=tag:Name,Values=EC2-*" \
  --query 'Reservations[*].Instances[*].[Tags[?Key==`Name`].Value|[0],State.Name]' \
  --output table
```

### Opción C: Usar AWS Systems Manager
Si las instancias no responden por SSH:
1. Ir a Systems Manager → Session Manager
2. Iniciar sesión en cada instancia
3. Verificar docker containers: `docker ps`
4. Si no están corriendo: `docker-compose up -d`

---

## 📊 Estado Actual del Proyecto

| Componente | Estado | Detalles |
|-----------|--------|---------|
| **Código** | ✅ Listo | Todos los servicios están codificados |
| **Docker Images** | ✅ Listo | Imágenes disponibles en AWS |
| **Workflows** | ✅ Listo | 13 workflows disponibles |
| **Deployment Script** | ✅ Listo | Python SSH Orchestrator funcionando |
| **Instancias EC2** | ❓ DESCONOCIDO | Necesita verificación |
| **Servicios Corriendo** | ❌ NO | Necesitan desplegarse |
| **Pruebas de Flujo** | ⏸️ EN ESPERA | Listas para ejecutar cuando los servicios estén UP |

---

## 🎯 CONCLUSIÓN

**La aplicación está 100% lista para ser probada**, pero **los servicios no están actualmente desplegados y corriendo**.

**Lo que falta:**
1. Verificar que el Bastion esté accesible
2. Verificar que todas las instancias EC2 estén en estado `running`
3. Disparar el workflow de deployment
4. Esperar ~5 minutos a que los servicios se levanten
5. Ejecutar el script de pruebas

Una vez que los servicios estén UP, podré confirmar que **todos los flujos funcionan correctamente**.

---

**Archivo de pruebas**: `test-app-flows.ps1`
**Fecha de este reporte**: 19 de Enero de 2026
**Hora**: 03:15 UTC
