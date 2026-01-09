# 🚀 DEPLOY & VALIDATE SUITE - GUÍA COMPLETA

## 📋 Descripción General

Suite completa de deployment y validación para todas las instancias EC2. Incluye:

1. **deploy-complete.ps1** - Deploy individual con rebuild Docker
2. **post-deploy-monitor.ps1** - Monitoreo en tiempo real y prueba de endpoints
3. **debug-post-deployment.ps1** - Diagnóstico completo de problemas
4. **deploy-and-validate.ps1** - Orquestador que ejecuta todo en secuencia

---

## 🎯 Instancias Disponibles

```
✅ EC2_CORE              - Servidor central de la aplicación
✅ EC2_DB                - Base de datos (MongoDB, PostgreSQL, Redis)
✅ EC2_API_GATEWAY       - API Gateway (enrutamiento y autenticación)
✅ EC2_AUTH              - Servicio de autenticación
✅ EC2_ESTUDIANTES       - Microservicio de estudiantes
✅ EC2_MAESTROS          - Microservicio de maestros
✅ EC2_MESSAGING         - Sistema de mensajería (Kafka)
✅ EC2_NOTIFICACIONES    - Sistema de notificaciones
✅ EC2_REPORTES          - Sistema de reportes
✅ EC2_SOAP_BRIDGE       - Puente SOAP para integraciones
✅ EC2_MONITORING        - Sistema de monitoreo
✅ EC2_KAFKA             - Broker Kafka (si está separado)
```

---

## 🚀 USO RÁPIDO

### 1. Deploy Básico (Una Instancia)

```powershell
# Deploy interactivo (pide confirmación entre fases)
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE"

# Deploy automático (continúa sin esperar)
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE" -AutoContinue
```

### 2. Deploy Solo (Sin Monitoreo)

```powershell
.\deploy-complete.ps1 -InstanceName "EC2_CORE" -Environment "prod"
```

### 3. Monitoreo Solo (Instancia Ya Deployada)

```powershell
# Ver logs en tiempo real
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -FollowLogs

# Probar endpoints
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -TestEndpoints

# Verificar conectividad
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -CheckConnectivity
```

### 4. Debug (Diagnosticar Problemas)

```powershell
# Diagnóstico completo
.\debug-post-deployment.ps1 -InstanceName "EC2_CORE"
```

### 5. Deploy Todas las Instancias

```powershell
# Usa el orquestador
.\deploy-orchestrator.ps1

# O deploy-and-validate en secuencia con auto-continue
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE" -AutoContinue
.\deploy-and-validate.ps1 -InstanceName "EC2_DB" -AutoContinue
.\deploy-and-validate.ps1 -InstanceName "EC2_API_GATEWAY" -AutoContinue
# ... etc para todas
```

---

## 📊 FASES DE DEPLOY-AND-VALIDATE

### Fase 1️⃣: Deployment Completo
```
✅ Cargar configuración centralizada
✅ Validar AWS credentials
✅ Conectar a instancia EC2 via SSH
✅ Cargar archivo .env.prod.*
✅ Subir configuración a la instancia
✅ Preparar directorios y servicios
✅ Rebuild imagen Docker (si aplica)
✅ Iniciar contenedor
✅ Validar logs del contenedor
✅ Health check inicial
```

**Tiempo esperado:** 5-15 minutos (depende de tamaño de imagen Docker)

### Fase 2️⃣: Monitoreo y Endpoints
```
✅ Ver logs más recientes
✅ Probar /health endpoint
✅ Probar /api/status endpoint
✅ Probar /api/info endpoint
✅ Probar /metrics endpoint
✅ Verificar conectividad desde máquina local
✅ Test de ping
✅ Test de puerto
```

**Tiempo esperado:** 1-2 minutos

### Fase 3️⃣: Diagnóstico Completo
```
✅ Verificar estado del contenedor Docker
✅ Revisar variables de entorno
✅ Examinar logs en detalle
✅ Test de conectividad de red
✅ Métricas de CPU/Memoria
✅ Generar reporte de diagnóstico
```

**Tiempo esperado:** 2-3 minutos

---

## 🔍 EJEMPLOS DE USO

### Ejemplo 1: Desplegar EC2_CORE y Validar

```powershell
# Opción 1: Con pauses interactivas
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE"

# Opción 2: Automático (sin pauses)
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE" -AutoContinue

# Opción 3: Solo deploy (sin monitoreo ni debug)
.\deploy-complete.ps1 -InstanceName "EC2_CORE"
```

### Ejemplo 2: Monitorear Aplicación en Vivo

```powershell
# Ver logs en tiempo real
.\post-deploy-monitor.ps1 -InstanceName "EC2_API_GATEWAY" -FollowLogs

# Presiona Ctrl+C para salir
```

### Ejemplo 3: Diagnosticar Problema en EC2_DB

```powershell
# Ejecutar diagnóstico completo
.\debug-post-deployment.ps1 -InstanceName "EC2_DB"

# Script generará reporte automático: debug-report-EC2_DB-TIMESTAMP.json
```

### Ejemplo 4: Deploy Secuencial de Todas

```powershell
# Opción 1: Usar orquestador
.\deploy-orchestrator.ps1

# Opción 2: Manual con auto-continue (17 minutos aprox)
for ($i=0; $i -lt 12; $i++) {
    .\deploy-and-validate.ps1 -InstanceName $instances[$i] -AutoContinue
    Start-Sleep -Seconds 30  # Pausa entre deployments
}
```

---

## 📈 SALIDA ESPERADA

### Deploy Exitoso

```
╔═══════════════════════════════════════════════════════════════════╗
║  🚀 DEPLOY & VALIDATE - SUITE COMPLETA
║  Instancia: EC2_CORE
║  Modo: INTERACTIVO
╚═══════════════════════════════════════════════════════════════════╝

[FASE 1] DEPLOYMENT COMPLETO
✅ Configuración cargada exitosamente
✅ SSH Key obtecida desde AWS Secrets Manager
✅ Conexión SSH exitosa
✅ Subiendo .env.prod.core...
✅ Docker image construida exitosamente
✅ Contenedor iniciado correctamente

[FASE 2] MONITOREO Y ENDPOINTS
✅ /health endpoint - 200 OK
✅ /api/status endpoint - 200 OK
✅ /api/info endpoint - 200 OK
✅ /metrics endpoint - 200 OK

[FASE 3] DIAGNÓSTICO
✅ Contenedor ejecutándose correctamente
✅ Variables de entorno cargadas
✅ No hay errores en logs
✅ Puerto 3000 respondiendo

📊 RESUMEN
Instancia: EC2_CORE
Tiempo Total: 245.32 segundos
Fases: Deployment ✅, Monitoring ✅, Debug ✅
```

### Problemas y Soluciones

**Problema:** "SSH connection failed"
```
Solución:
1. Verifica security group permite puerto 22
2. Verifica SSH key en AWS Secrets Manager
3. Verifica IP pública en infrastructure.config.js
4. Ejecuta: aws ec2 describe-security-groups --group-names default
```

**Problema:** "Docker image build failed"
```
Solución:
1. Verifica Dockerfile en el servicio
2. Verifica logs: .\post-deploy-monitor.ps1 -InstanceName EC2_CORE -FollowLogs
3. Verifica .env.prod.core tiene todas las variables
4. Intenta manual: ssh ec2-user@IP "cd /home/ec2-user/EC2_CORE && docker build -t EC2_CORE ."
```

**Problema:** "Health check failed"
```
Solución:
1. Verifica contenedor está running: docker ps
2. Ver logs: .\post-deploy-monitor.ps1 -InstanceName EC2_CORE -FollowLogs
3. Verifica puerto correcto en infrastructure.config.js
4. Ejecuta debug completo: .\debug-post-deployment.ps1 -InstanceName EC2_CORE
```

**Problema:** "Endpoints not responding"
```
Solución:
1. Verifica firewall/security group permite puerto 3000
2. Verifica aplicación está escuchando en puerto correcto
3. Verifica DNS resuelve IP pública
4. Intenta desde instancia EC2: curl http://localhost:3000/health
```

---

## 🛠️ PARÁMETROS AVANZADOS

### deploy-complete.ps1
```powershell
.\deploy-complete.ps1 `
    -InstanceName "EC2_CORE" `
    -Environment "prod" `           # prod, staging, dev
    -SkipImageBuild $true `         # No rebuild docker
    -DryRun $false                  # Simular sin ejecutar
```

### post-deploy-monitor.ps1
```powershell
.\post-deploy-monitor.ps1 `
    -InstanceName "EC2_CORE" `
    -FollowLogs `                   # Seguir en tiempo real
    -TestEndpoints `                # Probar todos endpoints
    -CheckConnectivity `            # Verificar conectividad
    -MaxLines 100                   # Líneas de log a mostrar
```

### deploy-and-validate.ps1
```powershell
.\deploy-and-validate.ps1 `
    -InstanceName "EC2_CORE" `
    -AutoContinue `                 # Sin pauses interactivas
    -SkipDeploy `                   # Saltar deployment
    -SkipDebug                      # Saltar debugging
```

---

## 📝 VARIABLES DE CONFIGURACIÓN

Todas las instancias lee de `infrastructure.config.js`:

```javascript
{
  PUBLIC: {
    EC2_CORE_IP: "44.222.119.15",
    EC2_DB_IP: "54.236.151.227",
    // ... etc
  },
  PRIVATE: {
    EC2_CORE_PRIVATE_IP: "10.0.0.10",
    EC2_DB_PRIVATE_IP: "10.0.0.11",
    // ... etc
  },
  PORTS: {
    EC2_CORE: 3000,
    EC2_DB: 27017,
    // ... etc
  }
}
```

**Para actualizar IPs:**
1. Editar `infrastructure.config.js`
2. Regenerar .env: `node generate-env-from-config.js`
3. Ejecutar deploy nuevamente

---

## ✅ CHECKLIST PRE-DEPLOYMENT

- [ ] `infrastructure.config.js` actualizado con IPs correctas
- [ ] `.env.prod.*` generados: `node generate-env-from-config.js`
- [ ] AWS Secrets Manager tiene SSH private key
- [ ] Security groups permiten puertos necesarios (22, 3000, 27017, 5432, 6379)
- [ ] Instancias EC2 están en running state
- [ ] Docker instalado en todas las instancias
- [ ] Credenciales AWS configuradas localmente

---

## 📊 MONITOREO CONTINUADO

Después del deployment:

```powershell
# Ver logs en tiempo real
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -FollowLogs

# Probar endpoints regularmente
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -TestEndpoints

# Diagnosticar si hay problemas
.\debug-post-deployment.ps1 -InstanceName "EC2_CORE"
```

---

## 🔗 DOCUMENTOS RELACIONADOS

- `QUICK_START.md` - Inicio rápido general
- `DEPLOYMENT_GUIDE_NUEVAS_IPS.md` - Guía de nuevas IPs
- `EC2-CORE_DEPLOYMENT_GUIDE.md` - Guía específica EC2_CORE
- `infrastructure.config.js` - Configuración centralizada
- `generate-env-from-config.js` - Auto-generador .env

---

## 💡 TIPS & TRICKS

1. **Ejecutar en modo batch:**
   ```powershell
   $instances = "EC2_CORE", "EC2_DB", "EC2_API_GATEWAY"
   foreach ($instance in $instances) {
       .\deploy-and-validate.ps1 -InstanceName $instance -AutoContinue
   }
   ```

2. **Guardar logs para análisis:**
   ```powershell
   .\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -MaxLines 500 | Out-File -FilePath "logs.txt"
   ```

3. **Monitorear múltiples instancias:**
   ```powershell
   # En terminal 1
   .\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -FollowLogs
   
   # En terminal 2
   .\post-deploy-monitor.ps1 -InstanceName "EC2_DB" -FollowLogs
   ```

4. **Scheduling automático (Task Scheduler):**
   - Crear tarea que ejecute deploy-and-validate cada día
   - Guardar reportes en carpeta centralizada
   - Enviar notificaciones si hay fallos

---

## 🎓 APRENDE MÁS

Para entender mejor cómo funciona:

1. Lee `deploy-complete.ps1` - Entenderás fases de deployment
2. Lee `post-deploy-monitor.ps1` - Verás cómo monitorear
3. Lee `debug-post-deployment.ps1` - Aprenderás debugging
4. Lee `infrastructure.config.js` - Entenderás configuración centralizada

---

**Última actualización:** 2024
**Versión:** 3.0
**Estado:** ✅ Production Ready
