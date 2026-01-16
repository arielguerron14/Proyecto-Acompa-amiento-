# Ejemplos de Uso - Workflows de Despliegue Docker

## 🚀 Casos de Uso Comunes

### 1. Desplegar Todo en Producción

#### Opción A: GitHub Actions (Recomendado)
```bash
# 1. Ve a GitHub → Actions
# 2. Selecciona uno de los workflows (ej: deploy-core.yml)
# 3. Click "Run workflow"
# 4. Selecciona environment: "prod"
# 5. Click "Run workflow"
```

#### Opción B: Orquestador Python
```bash
python3 deployment/orchestrator.py deploy-all --environment prod
```

#### Opción C: Script Bash
```bash
./deployment/scripts/deploy-all-instances.sh prod
```

---

### 2. Desplegar Solo EC2-CORE (Microservicios)

#### Opción A: GitHub Actions
```
Actions → deploy-core.yml → Run workflow → environment: dev
```

#### Opción B: Script Directo
```bash
./deployment/scripts/deploy-core.sh
```

#### Opción C: Python Orchestrator
```bash
python3 deployment/orchestrator.py deploy --instance EC2-CORE
```

---

### 3. Desplegar Solo Base de Datos

```bash
./deployment/scripts/deploy-database.sh
```

Esto despliega:
- MongoDB (puerto 27017)
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)

---

### 4. Verificar Salud de Servicios

```bash
./deployment/scripts/health-check.sh
```

Output esperado:
```
═══════════════════════════════════════════════════════
     🏥 HEALTH CHECK - TODAS LAS INSTANCIAS
═══════════════════════════════════════════════════════

📍 Verificando: EC2-CORE
   ✓ Instancia: i-1234567890abcdef0
   ✓ IP privada: 10.0.1.50
   ✓ Servicios activos:
      ✓ micro-auth: UP
      ✓ micro-estudiantes: UP
      ✓ micro-maestros: UP
      ✓ micro-core: UP

[... más instancias ...]

═══════════════════════════════════════════════════════
     📊 RESUMEN
═══════════════════════════════════════════════════════
   ✓ Saludables: 25
   ✗ No saludables: 0
   ⚠ Desconocidos: 0
   Total verificados: 10
═══════════════════════════════════════════════════════
```

---

### 5. Rollback a Versión Anterior

```bash
# Rollback de EC2-CORE a versión anterior
./deployment/scripts/rollback.sh EC2-CORE v1.0.0

# Rollback de EC2-API-Gateway a latest
./deployment/scripts/rollback.sh EC2-API-Gateway latest
```

---

### 6. Listar Instancias Disponibles

```bash
python3 deployment/orchestrator.py --list
```

Output:
```
📋 Instancias disponibles:
============================================================

EC2-Bastion
  Imágenes: bastion-host:latest
  Puertos: 22

EC2-API-Gateway
  Imágenes: api-gateway:latest
  Puertos: 8080

EC2-CORE
  Imágenes: micro-auth:latest, micro-estudiantes:latest, micro-maestros:latest, micro-core:latest
  Puertos: 3001, 3002, 3003, 3004

[... más ...]
```

---

### 7. Desplegar Instancia Específica Sin Esperar

```bash
python3 deployment/orchestrator.py deploy --instance EC2-Frontend --no-wait
```

Util cuando necesitas disparar un despliegue y continuar con otras tareas.

---

### 8. Monitorear Despliegue en Curso

#### Opción A: GitHub Actions
```
GitHub → Actions → deploy-bastion.yml → Click en el workflow en curso
```

#### Opción B: AWS Console
```
AWS → Systems Manager → Command history → Ver CommandId
```

---

### 9. Ver Logs de un Contenedor

```bash
# Obtener ID de instancia
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-CORE" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

# Ver logs de micro-auth
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids $INSTANCE_ID \
  --parameters "commands=['docker logs micro-auth -f']"
```

---

### 10. Actualizar Imagen Específica

```bash
# Ejemplo: Actualizar solo micro-auth en EC2-CORE

# 1. Pull de la nueva imagen
# 2. Parar el contenedor viejo
# 3. Remover contenedor
# 4. Iniciar con nueva imagen

INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-CORE" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids $INSTANCE_ID \
  --parameters "commands=[
    'docker pull micro-auth:latest',
    'docker stop micro-auth',
    'docker rm micro-auth',
    'docker run -d --name micro-auth -p 3001:3000 --restart always micro-auth:latest'
  ]"
```

---

## 🔐 Casos Avanzados

### 1. Despliegue Blue-Green

```bash
# Versión 1 ya en producción (blue)
# Desplegar versión 2 (green) en paralelo

python3 deployment/orchestrator.py deploy --instance EC2-API-Gateway --no-wait

# Luego, hacer el switch de tráfico
```

### 2. Canary Deployment

```bash
# 1. Desplegar en dev primero
python3 deployment/orchestrator.py deploy-all --environment dev

# 2. Esperar validación
# 3. Desplegar en staging
python3 deployment/orchestrator.py deploy-all --environment staging

# 4. Después en producción
python3 deployment/orchestrator.py deploy-all --environment prod
```

### 3. Despliegue Programado

```bash
# Usar cron para despliegues automáticos
0 2 * * * cd /path/to/repo && python3 deployment/orchestrator.py deploy-all --environment dev
```

---

## 📊 Monitoreo y Dashboards

### Acceder a Dashboards Post-Despliegue

```bash
# Obtener IP de EC2-Monitoring
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-Monitoring" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text

# Luego visitar:
# - Grafana: http://<IP>:3000
# - Prometheus: http://<IP>:9090
```

---

## 🚨 Troubleshooting

### Problema: "Instancia no encontrada"

```bash
# Verificar instancias activas
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[InstanceId, Tags[0].Value, State.Name]' \
  --output table
```

### Problema: "Contenedor no inicia"

```bash
# Ver logs de error
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-CORE" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids $INSTANCE_ID \
  --parameters "commands=['docker logs micro-auth']"
```

### Problema: "Permisos insuficientes"

```bash
# Verificar Systems Manager Agent
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids $INSTANCE_ID \
  --parameters "commands=['systemctl status amazon-ssm-agent']"
```

---

## 📈 Mejores Prácticas

1. ✅ **Siempre desplegar DB y Messaging primero**
2. ✅ **Usar ambientes (dev → staging → prod)**
3. ✅ **Verificar health checks después de despliegue**
4. ✅ **Tener un plan de rollback**
5. ✅ **Monitorear logs y dashboards**
6. ✅ **Documentar cambios en el repositorio**

---

## 🔄 Ciclo Típico de Despliegue

```
1. Hacer cambios en código
   ↓
2. Commit y push a main
   ↓
3. GitHub Actions dispara automáticamente
   ↓
4. Workflows despliegan en orden (DB → Messaging → Servicios)
   ↓
5. Health checks verifican estado
   ↓
6. Notificaciones a Slack (opcional)
   ↓
7. Verificar dashboards en Grafana
   ↓
8. Listo para producción ✅
```

---

Para más información, revisar:
- `README.md` - Documentación completa
- `QUICK_START.md` - Guía rápida
- `DEPLOYMENT_MAP.md` - Mapa de workflows
