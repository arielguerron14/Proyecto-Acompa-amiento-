# Deployment Workflow Guide

## Overview

El nuevo workflow de despliegue **Deploy Project to EC2 Instances** automatiza completamente el proceso de:

1. **Descubrimiento de Instancias**: Detecta las IPs (privadas y públicas) de todas las instancias EC2 desplegadas
2. **Actualización de Configuración**: Actualiza dinámicamente los archivos de configuración con las IPs descubiertas
3. **Despliegue de Servicios**: Despliega automáticamente los servicios en cada instancia según su rol
4. **Verificación de Salud**: Verifica que todos los puertos y endpoints estén funcionando correctamente
5. **Reporte Centralizado**: Genera un reporte integral con logs, estado de servicios y verificación de comunicación

---

## Quick Start

### 1. Acceder al Workflow

Ve a GitHub → **Actions** → **Deploy Project to EC2 Instances**

O usa la CLI:

```bash
gh workflow run deploy-project.yml \
  -f environment=production \
  -f deploy_all_services=true \
  -f skip_verification=false
```

### 2. Parámetros del Workflow

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `environment` | Ambiente (dev, staging, prod) | production |
| `deploy_all_services` | Desplegar todos los servicios | true |
| `skip_verification` | Saltar verificación de endpoints | false |

### 3. Flujo de Ejecución

```
discover-instances
    ↓
update-configuration
    ↓
deploy-services (paralelo con verify-endpoints)
    ↓
summary
```

---

## What Each Job Does

### **discover-instances**
- ✅ Se conecta a AWS usando los mismos secrets (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
- ✅ Consulta EC2 instances con tag `Project=lab-8-ec2`
- ✅ Extrae: nombre, IP privada, IP pública, Instance ID
- ✅ Genera JSON con mapa de instancias
- ✅ Identifica la IP pública del Bastion para acceso remoto

**Output:**
```json
{
  "EC-Bastion": {
    "private_ip": "10.0.1.10",
    "public_ip": "3.21.0.100",
    "instance_id": "i-0123456789abcdef0"
  },
  "EC2-Frontend": {
    "private_ip": "10.0.1.20",
    "public_ip": "3.21.0.101",
    "instance_id": "i-0123456789abcdef1"
  },
  ...
}
```

### **update-configuration**
- ✅ Descarga el JSON de instancias
- ✅ Actualiza `infrastructure-instances.config.js` con IPs reales
- ✅ Crea archivo `discovered-instances.json` para scripts posteriores
- ✅ Mapea servicios a puertos esperados

**Archivo generado: `infrastructure-instances.config.js`**
```javascript
module.exports = {
  instances: { /* mapa de IPs */ },
  serviceMap: {
    'EC2-Frontend': { port: 3000, health: '/health' },
    'EC2-API-Gateway': { port: 8080, health: '/api/health' },
    // ... más servicios
  },
  bastionConfig: {
    host: "3.21.0.100",
    timeout: 30
  }
};
```

### **deploy-services**
- ✅ Para cada instancia, prepara un script de despliegue
- ✅ Copia el script a la instancia vía SSH (directo o via Bastion)
- ✅ Ejecuta el script remotamente
- ✅ Detecta automáticamente qué servicio ejecutar según el nombre de la instancia

**Por instancia se ejecuta:**
- `apt-get update`
- Instala Docker si no existe
- Instala Docker Compose si no existe
- Ejecuta el `docker-compose` correspondiente

**Servicios soportados:**
- **EC2-Frontend** → `docker-compose.frontend.yml`
- **EC2-API-Gateway** → `docker-compose.api-gateway.yml`
- **EC2-DB** → `databases/docker-compose.db.yml`
- **EC2-CORE** → `docker-compose.core.yml`
- **EC2-Messaging** → `docker-compose.messaging.yml`
- **EC2-Notificaciones** → `docker-compose.notificaciones.yml`
- **EC2-Reportes** → `docker-compose.reportes.yml`
- **EC2-Monitoring** → `docker-compose.infrastructure.yml`

### **verify-endpoints**
- ✅ Prueba conectividad a puertos comunes en cada instancia
- ✅ Verifica HTTP endpoints específicos de cada servicio
- ✅ Genera reporte de salud en markdown
- ✅ Prueba puerto SSH, HTTP, HTTPS y puertos de aplicación

**Puertos verificados:**
- 22 (SSH), 80 (HTTP), 443 (HTTPS)
- 3000, 5000, 5432, 5672, 8080-8083, 9090

**Endpoints probados por servicio:**
- Frontend: `GET http://IP/`
- API: `GET http://IP:8080/api/health`
- CORE: `GET http://IP:8081/api/status`
- Reportes: `GET http://IP:8083/reports/health`
- Notifications: `GET http://IP:8082/notifications/health`
- Prometheus: `GET http://IP:9090/-/healthy`

### **summary**
- ✅ Genera resumen final
- ✅ Muestra todas las instancias descubiertas
- ✅ Punto de información para artefactos

---

## Artifacts Generated

Después de cada ejecución, los siguientes archivos están disponibles en GitHub:

### 1. **instances-discovered**
```
instances.json - Datos de instancias descubiertas
```

### 2. **updated-config**
```
infrastructure-instances.config.js - Config actualizado con IPs
.env* - Archivos de variables de entorno
```

### 3. **deployment-report**
```
deployment-report.md - Reporte de salud y endpoints
```

---

## Scripts Auxiliares Locales

Si prefieres ejecutar comandos localmente desde tu máquina:

### 1. **Actualizar Configuración**
```bash
./scripts/update-project-config.sh '{"EC2-Frontend":{"private_ip":"...","public_ip":"..."}...}'
```

### 2. **Verificar Salud de Servicios**
```bash
# Requiere: discovered-instances.json en el directorio actual
./scripts/verify-deployment-health.sh
```

Genera: `health-report-YYYYMMDD-HHMMSS.md`

### 3. **Recopilar Logs Centralizados**
```bash
# Requiere: discovered-instances.json en el directorio actual
./scripts/collect-deployment-logs.sh
```

Genera: `deployment-logs-YYYYMMDD-HHMMSS/` con:
- `containers.txt` - Estado de contenedores Docker
- `service-logs.txt` - Logs de los servicios
- `system.log` - Log del sistema
- `kernel.log` - Kernel messages
- `disk-usage.txt` - Uso de disco
- `memory.txt` - Uso de memoria
- `network.txt` - Conexiones de red

---

## Troubleshooting

### ❌ SSH Connection Failed
**Problema**: No puede conectarse a las instancias vía SSH

**Soluciones**:
1. Verifica que la Security Group tenga puerto 22 abierto ✓ (ya incluida en terraform)
2. Verifica que el SSH_KEY secret esté configurado correctamente
3. Si usas Bastion, verifica que `bastion_ip` se detectó correctamente

### ❌ Docker Compose Files Not Found
**Problema**: Script de despliegue no encuentra los archivos docker-compose

**Soluciones**:
1. Verifica que los archivos existan en el repo:
   ```bash
   ls -la docker-compose*.yml
   ls -la databases/docker-compose.db.yml
   ```
2. Si faltan, necesitas crear los archivos
3. El workflow continuará sin error incluso si el archivo no existe

### ❌ Port Verification Returns 000
**Problema**: Los puertos no responden a las pruebas

**Soluciones**:
1. Verifica que los servicios estén realmente corriendo:
   ```bash
   ssh ubuntu@IP "docker ps"
   ```
2. Verifica que los contenedores escuchen en los puertos correctos
3. Verifica Security Group ingress rules

### ❌ HTTP Endpoints Return 000
**Problema**: Los endpoints HTTP no responden

**Soluciones**:
1. Verifica que los servicios estén en running:
   ```bash
   ssh ubuntu@IP "docker logs <container-name>"
   ```
2. Verifica que la aplicación esté escuchando en la IP correcta (0.0.0.0 vs localhost)
3. Verifica logs de la aplicación para errores

---

## Complete Workflow Example

```bash
# 1. Trigger workflow
gh workflow run deploy-project.yml \
  -f environment=production \
  -f deploy_all_services=true

# 2. Wait for completion
gh run list --workflow=deploy-project.yml --limit 1

# 3. Download artifacts
gh run download <RUN_ID> -n instances-discovered
gh run download <RUN_ID> -n deployment-report

# 4. Review outputs
cat instances-discovered/instances.json | jq '.'
cat deployment-report/deployment-report.md

# 5. Run local health verification (optional)
cp instances-discovered/instances.json discovered-instances.json
./scripts/verify-deployment-health.sh

# 6. Collect comprehensive logs (optional)
./scripts/collect-deployment-logs.sh
```

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Actions: Deploy Project to EC2 Instances             │
└─────────────────────────────────────────────────────────────┘
         │
         ├─→ [discover-instances]
         │       ├─ Query EC2 with AWS API
         │       ├─ Extract IPs (private & public)
         │       └─ Output: instances.json
         │
         ├─→ [update-configuration]
         │       ├─ Read instances.json
         │       ├─ Generate config files
         │       └─ Output: infrastructure-instances.config.js
         │
         ├─→ [deploy-services] (paralelo)
         │       ├─ For each instance:
         │       │   ├─ SSH connect
         │       │   ├─ Install Docker/Compose
         │       │   └─ Run docker-compose up
         │       └─ Output: container logs
         │
         ├─→ [verify-endpoints] (paralelo)
         │       ├─ Test port connectivity
         │       ├─ Test HTTP endpoints
         │       └─ Output: health-report.md
         │
         └─→ [summary]
                 └─ Generate summary
```

---

## Security Notes

✅ **Credenciales**: Usa los mismos secrets configurados en Terraform
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`
- `SSH_KEY` (para acceso a instancias)

✅ **Network**: El workflow usa:
- IP pública del Bastion como proxy SSH (si existe)
- IPs privadas para comunicación interna
- Security Group ya permite todos los TCP (0-65535)

✅ **Logs**: Todos los logs se almacenan en artefactos de GitHub (no en logs públicos)

---

## Next Steps

1. **Configurar SSH_KEY secret** (si aún no está configurado)
2. **Ejecutar workflow**: `gh workflow run deploy-project.yml`
3. **Monitorear ejecución**: Checks → Actions
4. **Descargar reporte**: Artifacts → deployment-report
5. **Validar endpoints**: Revisar health-report.md

Para más info, ver: [README_TERRAFORM.md](./README_TERRAFORM.md)
