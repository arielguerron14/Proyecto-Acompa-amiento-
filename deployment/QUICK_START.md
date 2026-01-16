# Guía Rápida de Despliegue

## 🚀 Inicio Rápido

### Opción 1: Workflows de GitHub Actions (Recomendado)

1. **Ir a GitHub Actions** → Seleccionar workflow deseado
2. **Click en "Run workflow"** → Seleccionar environment (dev/staging/prod)
3. **Monitorear progreso** en la pestaña de Actions

### Opción 2: Scripts Locales (Requiere AWS CLI)

```bash
# Hacer ejecutables
chmod +x deployment/scripts/*.sh

# Desplegar una instancia
./deployment/scripts/deploy-bastion.sh

# Desplegar todas (orden óptimo)
./deployment/scripts/deploy-all-instances.sh dev
```

### Opción 3: Orquestador Python

```bash
# Desplegar todas las instancias
python3 deployment/orchestrator.py deploy-all --environment dev

# Desplegar instancia específica
python3 deployment/orchestrator.py deploy --instance EC2-Bastion

# Listar instancias disponibles
python3 deployment/orchestrator.py --list
```

## 📋 Instancias Disponibles

```
EC2-Bastion              → bastion-host:latest
EC2-API-Gateway          → api-gateway:latest
EC2-CORE                 → 4 microservicios (auth, estudiantes, maestros, core)
EC2-Reportes             → 2 servicios (reportes-estudiantes, reportes-maestros)
EC2-Notificaciones       → micro-notificaciones:latest
EC2-Messaging            → Zookeeper, Kafka, RabbitMQ
EC2-DB                   → MongoDB, PostgreSQL, Redis
EC2-Analytics            → micro-analytics:latest
EC2-Monitoring           → Prometheus, Grafana
EC2-Frontend             → frontend-web:latest
```

## ⚙️ Pre-requisitos

### Para Scripts Locales:
```bash
# Instalar AWS CLI
pip install boto3

# Configurar credenciales
aws configure
```

### Para Workflows de GitHub:
1. Ir a Settings → Secrets and variables → Actions
2. Agregar secretos:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `SLACK_WEBHOOK` (opcional)

## 🔍 Monitoreo

### Ver logs de despliegue:
```bash
# GitHub Actions - Ver en la UI
# O verificar comando SSM en AWS Console

# Logs locales en instancia
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids <INSTANCE_ID> \
  --parameters "commands=['docker logs <CONTAINER_NAME>']"
```

### Dashboards después de deploy:
- Grafana: `http://<EC2-Monitoring-IP>:3000`
- Prometheus: `http://<EC2-Monitoring-IP>:9090`
- RabbitMQ: `http://<EC2-Messaging-IP>:15672`

## 🔧 Troubleshooting

### Instancia no encontrada:
```bash
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].{Name: Tags[0].Value, ID: InstanceId}'
```

### Ver estado del contenedor:
```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids <INSTANCE_ID> \
  --parameters "commands=['docker ps']"
```

### Eliminar contenedor problemático:
```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids <INSTANCE_ID> \
  --parameters "commands=['docker rm -f <CONTAINER_NAME>']"
```

## 📚 Archivos Principales

```
.github/workflows/           # 10 workflows de GitHub Actions
deployment/
├── scripts/                 # 10+ scripts de despliegue
├── orchestrator.py          # Orquestador Python
├── config.env              # Configuración centralizada
└── README.md               # Documentación detallada
```

## 🔄 Ciclo de Despliegue Recomendado

1. **DB Layer** (EC2-DB) - Esperar ✓
2. **Messaging** (EC2-Messaging) - Esperar ✓
3. **Bastion** (EC2-Bastion)
4. **Core Services** (EC2-CORE)
5. **API Gateway** (EC2-API-Gateway)
6. **Reportes** (EC2-Reportes)
7. **Notificaciones** (EC2-Notificaciones)
8. **Analytics** (EC2-Analytics)
9. **Monitoring** (EC2-Monitoring) - Esperar ✓
10. **Frontend** (EC2-Frontend)

## 💡 Tips

- ✅ Todos los contenedores tienen `--restart always`
- ✅ Los volúmenes se crean automáticamente
- ✅ Usa AWS Systems Manager (no SSH directo)
- ✅ Chequea Slack para notificaciones (si configurado)
- ✅ Los workflows son idempotentes (seguro ejecutar múltiples veces)

---

Para más detalles, ver [README.md](README.md)
