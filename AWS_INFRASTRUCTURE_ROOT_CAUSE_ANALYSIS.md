# 🚨 Análisis de Root Cause - 503/504 Service Errors

## Resumen Ejecutivo
El análisis exhaustivo ha determinado que los errores **503 "Service Unavailable"** y **504 "Gateway Timeout"** que ves en la aplicación NO son causados por problemas de código o configuración Docker, sino por **infraestructura AWS inaccesible**.

## 📊 Diagnóstico Realizado

### 1. Intentos de Conexión (Workflow 21022171513)
```
❌ Bastion (34.194.48.73)          → Connection timeout (port 22)
❌ EC2-Core (172.31.71.182)        → Unreachable via SSH
❌ Frontend (44.220.126.89)        → SSH Permission denied
❌ API Gateway (52.7.168.4)        → SSH Permission denied
```

### 2. Análisis de Errores
- **Frontend reporta**: 
  - `GET /horarios 503: Service Unavailable`
  - `GET /estudiantes/reservas/estudiante/3 504: Gateway Timeout`
- **Root cause**: API Gateway (52.7.168.4:8080) no puede conectar a microservicios en 172.31.71.182:3000/3001/3002

### 3. Verificaciones Completadas
✅ Código Docker corregido (commits: d64dec2, 25f6e87, ff2c3f4, ff2c3f4)
✅ CORS configurado (commit: d3045ba)
✅ Microservicios definidos (commit: 955fc99)
✅ Workflow automático de deployment (commits: 100c1e2, b1fb32b, dc6a334)

## 🔍 Estado Actual de Instancias

| Instancia | IP Pública | IP Privada | SSH Acceso | Estado |
|-----------|-----------|-----------|-----------|--------|
| Frontend | 44.220.126.89 | 172.31.69.107 | ❌ Timeout | ? |
| API Gateway | 52.7.168.4 | 172.31.70.85 | ❌ Timeout | ? |
| EC2-Core | N/A | 172.31.71.182 | ❌ Timeout | 🔴 DOWN |
| Bastion | 34.194.48.73 | 172.31.78.45 | ❌ Timeout | 🔴 DOWN |
| Otros (DB, Messaging, etc) | ? | ? | ❌ Timeout | 🔴 DOWN |

## 🔴 Problemas Identificados

### Problema 1: Instancias EC2 Inaccesibles
**Síntomas:**
- Todas las conexiones SSH resultan en "Connection timed out"
- El Bastion (que debería ser alcanzable) también está caído
- Incluso Frontend/API Gateway (con IPs públicas) no responden a SSH

**Causa Probable:**
- Las instancias EC2 pueden estar:
  1. **Stopped** (detenidas pero no eliminadas)
  2. **Terminated** (eliminadas)
  3. **Problemas de red AWS** (Security Groups, NACLs, Route Tables)
  4. **Sin Elastic IPs** (IPs públicas pueden haber cambiado)

### Problema 2: Microservicios en EC2-Core No Responden
**Evidencia:**
- El docker-compose en EC2-Core no se puede reiniciar (instancia inaccesible)
- API Gateway obtiene 503/504 al intentar conectar a 172.31.71.182:3000/3001/3002

**Causa Probable:**
- EC2-Core está completamente caída o sin poder de cómputo
- Los contenedores Docker nunca se iniciaron o se detuvieron

## ✅ Lo Que SÍ Está Funcionando

1. **Frontend & API Gateway** - IPs públicas todavía existen:
   - Frontend: 44.220.126.89 (accesible antes)
   - API Gateway: 52.7.168.4:8080 (responde a health checks en logs anteriores)

2. **Código correcto**:
   - docker-compose.core.yml tiene microservicios correctamente definidos
   - docker-compose.api-gateway.yml con proxy routing correcto
   - CORS whitelist actualizado
   - Workflow automático funcional

3. **GitHub Actions**:
   - Workflows se ejecutan correctamente
   - SSH keys disponibles en repo
   - Bastion SSH config funcional (cuando el bastion esté disponible)

## 🛠️ Acciones Requeridas (INMEDIATAS)

### PASO 1: Verificar Estado de Instancias EC2
**Acciona en AWS Console:**
1. Ve a **EC2 Dashboard** → **Instances**
2. Busca todas las instancias del proyecto:
   - EC2-Frontend
   - EC2-ApiGateway
   - EC2-Core
   - EC2-Bastion
   - EC2-Database
   - (y otros servicios)

3. **Verifica el estado de cada una:**
   - ✅ running = OK
   - 🟡 stopped = Necesita reinicio
   - 🔴 terminated = Necesita recreación

### PASO 2: Reiniciar Instancias (Si están Stopped)
```
1. Selecciona todas las instancias
2. Click derecho → Instance State → Start
3. Espera 2-3 minutos a que se inicien
4. Verifica que tengan IPs públicas asignadas
```

### PASO 3: Verificar Security Groups
**Para cada instancia:**
1. Selecciona la instancia
2. Mira la pestaña "Security" → "Security groups"
3. Verifica que el Security Group permita:
   - Inbound SSH (port 22) desde GitHub Actions IP o 0.0.0.0/0
   - Inbound HTTP (port 80) desde 0.0.0.0/0
   - Inbound HTTPS (port 443) desde 0.0.0.0/0
   - Inbound puertos 3000-3002 (microservicios)

### PASO 4: Verificar Elastic IPs
**Para instancias con IP pública:**
1. Ve a **EC2** → **Elastic IPs**
2. Verifica que las IPs esperadas estén asignadas:
   - 44.220.126.89 → EC2-Frontend
   - 52.7.168.4 → EC2-ApiGateway
   - 34.194.48.73 → EC2-Bastion

### PASO 5: Una Vez Instancias Online
**Ejecuta el workflow:**
```bash
gh workflow run deploy-via-bastion.yml
```

O el original:
```bash
gh workflow run deploy-fix.yml
```

Esto automáticamente:
- Conectará via Bastion a EC2-Core
- Reiniciará docker-compose services
- Iniciará micro-auth, micro-estudiantes, micro-maestros
- MongoDB será accesible en 27017

## 📋 Checklist de Verificación

Después de reiniciar instancias, ejecuta esto desde tu browser o terminal:

```bash
# 1. Verifica que Frontend responde
curl -I http://44.220.126.89

# 2. Verifica que API Gateway responde
curl -I http://52.7.168.4:8080/health

# 3. Verifica que APIs no retornan 503/504
curl http://52.7.168.4:8080/horarios -v

# 4. En el browser
# - Ve a http://44.220.126.89
# - Carga una reserva o horario
# - Debe funcionar sin errores 503/504
```

## 📚 Documentación Relacionada

- [Workflow automático](../.github/workflows/deploy-via-bastion.yml)
- [Docker-compose core](../docker-compose.core.yml)
- [API Gateway config](../api-gateway/server.js)
- [Instancias y IPs](./INSTANCIAS_Y_IPS.md)

## 🎯 Próximos Pasos (Cuando AWS esté Online)

1. ✅ Instancias iniciadas
2. ✅ Workflow deploy via Bastion ejecutado
3. ✅ Verificar logs: `gh run view <ID> --log`
4. ✅ Testear en browser: http://44.220.126.89
5. ✅ Verificar sin errores 503/504

---

**Última actualización:** 2026-01-15 06:37 UTC
**Workflow IDs analizados:** 21021407397, 21021804248, 21022096402, 21022171513
**Código commits:** b1fb32b, dc6a334 (correcciones aplicadas)
