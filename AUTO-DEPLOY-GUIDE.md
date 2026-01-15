# 🚀 Auto-Deploy Complete Infrastructure Workflow

Un workflow completo y automático que despliega toda la infraestructura del proyecto en cualquier cuenta AWS, descubriendo dinámicamente las instancias EC2, actualizando configuraciones y validando que todo funcione correctamente.

## ✨ Características

### 🔍 **Auto-Discovery de Infraestructura**
- **Descubre automáticamente** todas las instancias EC2 por nombre
- **Extrae IPs públicas y privadas** dinámicamente
- **No requiere hardcoding** de direcciones IP
- **Compatible con cualquier cuenta AWS** (solo necesita acceso)

### 🔄 **Auto-Configuration Update**
- **Actualiza automáticamente** todas las referencias a IPs
- **Modifica docker-compose files** con URLs correctas
- **Actualiza environment files** (.env.prod.frontend, etc)
- **Actualiza config files** de microservicios
- **Git commits automáticamente** los cambios

### 🐳 **Despliegue Automatizado**
- **Clona/actualiza el repositorio** en cada instancia
- **Instala Docker & Docker Compose** si es necesario
- **Construye imágenes** desde Dockerfiles (no pull)
- **Inicia contenedores** con configuraciones correctas
- **Estrategia paralela** - despliega múltiples servicios simultáneamente

### 🧪 **Validación Completa**
- **Prueba endpoints HTTP** de todos los servicios
- **Verifica logs de Docker** en busca de errores
- **Chequea salud de servicios** con reintentos
- **Genera reporte detallado** con status de cada endpoint
- **Documenta la configuración final**

## 📋 Requisitos Previos

### AWS Setup
1. **Instancias EC2 creadas** con los siguientes tags:
   ```
   Tag Name: "Project"
   Tag Value: "acompaamiento" (o tu project_tag)
   
   Tag Name: "Name"
   Tag Values: "EC2-Frontend", "EC2-API-Gateway", "EC2-CORE", "EC2-DB", etc.
   ```

2. **Secretos en GitHub** configurados:
   ```
   AWS_ACCESS_KEY_ID      - AWS Access Key
   AWS_SECRET_ACCESS_KEY  - AWS Secret Access Key
   AWS_SESSION_TOKEN      - (Opcional) Session token si usas assumeRole
   EC2_SSH_KEY            - Private key (.pem) para acceder a instancias
   ```

### Instancias Requeridas
El workflow busca las siguientes instancias (pueden no existir todas):
- `EC2-Frontend` - Para la aplicación web
- `EC2-API-Gateway` - Para el API Gateway
- `EC2-CORE` - Para Core Services
- `EC2-DB` - Para bases de datos
- `EC2-Messaging` - Para sistemas de mensajería
- `EC2-Notificaciones` - Para notificaciones
- `EC2-Reportes` - Para generación de reportes
- `EC2-Monitoring` - Para Prometheus/Grafana
- `EC2-Bastion` - Para jump host (opcional)

## 🚀 Cómo Usar

### Opción 1: Desde GitHub UI

1. Ve a **Actions** en tu repositorio
2. Selecciona **"Auto-Deploy Complete Infrastructure"**
3. Haz clic en **"Run workflow"**
4. Completa los inputs:
   - `aws_region`: AWS region (default: us-east-1)
   - `project_tag`: Tag del proyecto para identificar instancias (default: acompaamiento)
   - `environment`: dev, staging, o prod
   - `skip_tests`: true para saltar validaciones (más rápido)
5. Haz clic en **"Run workflow"**

### Opción 2: Desde CLI (gh)

```bash
gh workflow run auto-deploy-complete.yml \
  --ref main \
  -f aws_region=us-east-1 \
  -f project_tag=acompaamiento \
  -f environment=prod \
  -f skip_tests=false
```

### Opción 3: Script Python Local

```bash
# Primero instala dependencias
pip install boto3 requests

# Descubrir instancias
python scripts/auto-discovery.py \
  --region us-east-1 \
  --project-tag acompaamiento \
  --output-json instances.json

# Validar endpoints
python scripts/health-check.py \
  --instances-json instances.json \
  --output-json health-results.json
```

## 📊 Workflow Execution Flow

```
┌─────────────────────────────────────┐
│  discover-infrastructure            │
│  (Descubre IPs dinámicamente)      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  update-configurations              │
│  (Actualiza docker-compose, env)   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  deploy-services (PARALELO)         │
│  ├─ Frontend                        │
│  ├─ API Gateway                     │
│  ├─ Core Services                   │
│  ├─ Database                        │
│  ├─ Messaging                       │
│  ├─ Notificaciones                  │
│  ├─ Reportes                        │
│  └─ Monitoring                      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  validate-health                    │
│  (Prueba endpoints y logs)          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  deployment-summary                 │
│  (Genera reporte final)             │
└─────────────────────────────────────┘
```

## 📈 Output & Resultados

### En la Ejecución del Workflow

**Job 1: discover-infrastructure**
```
🔍 Descubriendo instancias EC2 con tag Project=acompaamiento...

📋 **Instancias Descubiertas**:
- 🌐 Frontend: 44.220.126.89
- 🔌 API Gateway: 52.7.168.4
- 💻 Core Services: 98.80.149.136
- 🗄️ Database: 100.31.92.150
- ...
```

**Job 2: update-configurations**
```
🔄 Actualizando IP del API Gateway a: 52.7.168.4
  ✅ docker-compose.frontend.yml
  ✅ infrastructure.config.js
  ✅ frontend-web/server.js
  ...
```

**Job 3: deploy-services**
```
🚀 Desplegando Frontend en 44.220.126.89...
  📦 Instalando Docker...
  🐳 Construyendo imágenes...
  🐳 Iniciando contenedores...
  ✅ Frontend desplegado exitosamente
```

**Job 4: validate-health**
```
🧪 SERVICE HEALTH CHECK

🔍 Checking API Gateway [http://52.7.168.4:8080]...
  ✅ Health              (0.45s)
  ✅ Status              (0.42s)
  ✅ Auth Register       (0.38s)

🔍 Checking Frontend [http://44.220.126.89]...
  ✅ Home                (0.52s)
  ✅ Index               (0.50s)
```

**Job 5: deployment-summary**
```
╔════════════════════════════════════════════════════════════════╗
║          🎉 INFRASTRUCTURE DEPLOYMENT SUMMARY                   ║
╚════════════════════════════════════════════════════════════════╝

📋 DEPLOYED SERVICES
──────────────────────────────────────────────────────────────

Service             | IP Address         | Port  | Status
────────────────────┼────────────────────┼───────┼─────────
🌐 Frontend         | 44.220.126.89      | 80    | ✅
🔌 API Gateway      | 52.7.168.4         | 8080  | ✅
💻 Core Services    | 98.80.149.136      | 3000+ | ✅
...

🔗 ENDPOINTS DISPONIBLES
──────────────────────────────────────────────────────────────

Frontend:
  http://44.220.126.89

API Gateway:
  http://52.7.168.4:8080
  http://52.7.168.4:8080/health
  POST http://52.7.168.4:8080/auth/register
```

## 🔐 Secrets Configuration

En **Settings > Secrets and variables > Actions**, agrega:

```
AWS_ACCESS_KEY_ID
├─ Tu AWS Access Key ID

AWS_SECRET_ACCESS_KEY
├─ Tu AWS Secret Access Key

AWS_SESSION_TOKEN (Opcional)
├─ Para temporary credentials

EC2_SSH_KEY
├─ Contenido completo del archivo .pem
├─ Incluye -----BEGIN PRIVATE KEY-----
└─ Incluye -----END PRIVATE KEY-----
```

### Obtener EC2_SSH_KEY

```bash
# En Windows PowerShell
$content = Get-Content -Raw "C:\path\to\your-key.pem"
$content | Set-Clipboard

# En macOS/Linux
cat /path/to/your-key.pem | pbcopy
```

## 🧪 Testing & Validation

### Health Check Manual

```bash
# Test API Gateway
curl -v http://52.7.168.4:8080/health

# Test Frontend
curl -v http://44.220.126.89

# Test Auth Register (POST)
curl -X POST http://52.7.168.4:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### SSH a Instancias

```bash
# Usando SSH key
ssh -i your-key.pem ubuntu@44.220.126.89

# Una vez dentro, chequear Docker
docker ps
docker logs [container-name]
docker-compose logs
```

## 🔧 Troubleshooting

### Problema: "No se encontraron todas las instancias"

**Causa**: Instancias no existen o no tienen los tags correctos

**Solución**:
```bash
# Chequear instancias en AWS
aws ec2 describe-instances \
  --filters "Name=tag:Project,Values=acompaamiento" \
  --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value|[0],PublicIpAddress]' \
  --output table
```

### Problema: "Connection timeout" en SSH

**Causa**: Security group no permite acceso SSH

**Solución**:
```bash
# Agregar SSH rule a Security Group
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0  # Restringe según necesidad
```

### Problema: "Docker build failed"

**Causa**: Dockerfiles incompletos o dependencias faltantes

**Solución**:
```bash
# SSH a la instancia y debug
ssh ubuntu@IP
sudo docker-compose -f docker-compose.xyz.yml build --no-cache --progress=plain
```

## 📚 Ejemplos Avanzados

### Desplegar Solo en Dev

```bash
gh workflow run auto-deploy-complete.yml \
  -f environment=dev \
  -f skip_tests=true  # Más rápido en desarrollo
```

### Desplegar en Region Diferente

```bash
gh workflow run auto-deploy-complete.yml \
  -f aws_region=eu-west-1 \
  -f project_tag=acompaamiento
```

### Con Instancias Custom

Simplemente crea instancias con:
- Tag `Project: acompaamiento`
- Tag `Name: EC2-[ServiceName]`

El workflow las descubrirá automáticamente.

## 📝 Notes

- Los archivos de configuración se actualizan automáticamente **solo si cambian**
- Los cambios se hacen commit en GitHub automáticamente
- Puedes hacer un **dry-run** sin aplicar cambios usando el script Python con `--dry-run`
- Los logs se guardan en Artifacts si hay errores

## 🎯 Next Steps

1. **Configura los Secrets** en GitHub
2. **Crea las instancias EC2** con los tags requeridos
3. **Ejecuta el workflow** desde GitHub Actions
4. **Verifica los endpoints** usando los URLs en el reporte
5. **Monitorea** con Prometheus/Grafana

¡Listo! Tu infraestructura completa está desplegada y funcionando automáticamente. 🚀
