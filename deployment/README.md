# Docker Deployment Configuration

Este directorio contiene todos los workflows y scripts necesarios para desplegar imágenes Docker en las instancias EC2.

## 📋 Estructura

```
deployment/
├── scripts/
│   ├── deploy-all-instances.sh      # Orquestador de todos los despliegues
│   ├── deploy-bastion.sh             # Deploy EC2-Bastion
│   ├── deploy-api-gateway.sh         # Deploy EC2-API-Gateway
│   ├── deploy-core.sh                # Deploy EC2-CORE (múltiples microservicios)
│   ├── deploy-reportes.sh            # Deploy EC2-Reportes
│   ├── deploy-notificaciones.sh      # Deploy EC2-Notificaciones
│   ├── deploy-messaging.sh           # Deploy EC2-Messaging
│   ├── deploy-database.sh            # Deploy EC2-DB
│   ├── deploy-analytics.sh           # Deploy EC2-Analytics
│   ├── deploy-monitoring.sh          # Deploy EC2-Monitoring
│   └── deploy-frontend.sh            # Deploy EC2-Frontend
├── config.env                        # Configuración centralizada
└── README.md                         # Este archivo
```

## 🚀 Workflows de GitHub Actions

### Disponibles en `.github/workflows/`:
- `deploy-bastion.yml`
- `deploy-api-gateway.yml`
- `deploy-core.yml`
- `deploy-reportes.yml`
- `deploy-notificaciones.yml`
- `deploy-messaging.yml`
- `deploy-database.yml`
- `deploy-analytics.yml`
- `deploy-monitoring.yml`
- `deploy-frontend.yml`

## 📋 Instancias y Imágenes

### 1. EC2-Bastion
- **Imagen**: `bastion-host:latest`
- **Puerto**: 22 (SSH)

### 2. EC2-API-Gateway
- **Imagen**: `api-gateway:latest`
- **Puerto**: 8080

### 3. EC2-CORE
- **Imágenes**:
  - `micro-auth:latest` (Puerto: 3001)
  - `micro-estudiantes:latest` (Puerto: 3002)
  - `micro-maestros:latest` (Puerto: 3003)
  - `micro-core:latest` (Puerto: 3004)

### 4. EC2-Reportes
- **Imágenes**:
  - `micro-reportes-estudiantes:latest` (Puerto: 4001)
  - `micro-reportes-maestros:latest` (Puerto: 4002)

### 5. EC2-Notificaciones
- **Imagen**: `micro-notificaciones:latest`
- **Puerto**: 5000

### 6. EC2-Messaging
- **Imágenes**:
  - `proyecto-zookeeper:1.0` (Puerto: 2181)
  - `proyecto-kafka:1.0` (Puerto: 9092)
  - `proyecto-rabbitmq:1.0` (Puertos: 5672, 15672)

### 7. EC2-DB
- **Imágenes**:
  - `mongo:latest` (Puerto: 27017)
  - `postgres:latest` (Puerto: 5432)
  - `redis:latest` (Puerto: 6379)

### 8. EC2-Analytics
- **Imagen**: `micro-analytics:latest`
- **Puerto**: 6000

### 9. EC2-Monitoring
- **Imágenes**:
  - `proyecto-prometheus:1.0` (Puerto: 9090)
  - `proyecto-grafana:1.0` (Puerto: 3000)

### 10. EC2-Frontend
- **Imagen**: `frontend-web:latest`
- **Puertos**: 80 (HTTP), 443 (HTTPS)

## 🔧 Uso Local

### Desplegar una instancia específica:
```bash
# Hacer ejecutables los scripts
chmod +x deployment/scripts/*.sh

# Deploy EC2-Bastion
./deployment/scripts/deploy-bastion.sh

# Deploy EC2-API-Gateway
./deployment/scripts/deploy-api-gateway.sh

# Deploy EC2-CORE
./deployment/scripts/deploy-core.sh

# Deploy toda la base de datos
./deployment/scripts/deploy-database.sh
```

### Desplegar todas las instancias (ordenado):
```bash
./deployment/scripts/deploy-all-instances.sh [dev|staging|prod]
```

## 🔄 Uso con GitHub Actions

### Triggear workflow manualmente:
1. Ve a **GitHub Actions** → Selecciona el workflow
2. Click en **Run workflow** → Selecciona el environment (dev/staging/prod)
3. Click **Run workflow**

### Auto-trigger en commits:
Los workflows se activan automáticamente cuando hay cambios en:
- Los scripts de despliegue respectivos
- El archivo del workflow mismo

## 🔐 Secretos Requeridos

Configurar en GitHub Settings → Secrets and variables → Actions:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SLACK_WEBHOOK       (Opcional, para notificaciones)
```

## 📝 Variables de Entorno

### En las instancias EC2:
```bash
# Bases de datos
POSTGRES_PASSWORD=postgres
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# Services
API_GATEWAY_PORT=8080
CORE_SERVICES_START_PORT=3001
```

## ✅ Verificación de Despliegue

### Health Checks:
- **API-Gateway**: `curl http://localhost:8080/health`
- **Servicios Core**: Verifican puertos activos
- **Bases de datos**: Verifican volumenes y estados
- **Messaging**: Verifica Zookeeper, Kafka y RabbitMQ

### Logs:
```bash
# Ver logs de un contenedor
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids <INSTANCE_ID> \
  --parameters "commands=['docker logs <CONTAINER_NAME>']"
```

## 🚨 Troubleshooting

### Instancia no encontrada:
```bash
# Verificar instancias disponibles
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].{Name: Tags[0].Value, ID: InstanceId}'
```

### Contenedor no inicia:
```bash
# Ver logs del contenedor
docker logs <CONTAINER_NAME>

# Inspeccionar contenedor
docker inspect <CONTAINER_NAME>
```

### Errores de permisos SSM:
- Verificar que la instancia EC2 tiene rol IAM con permisos SSM
- Verificar que AWS Systems Manager Agent está ejecutándose

## 📊 Orden de Despliegue Recomendado

1. **EC2-DB** - Bases de datos (dependencia de otros servicios)
2. **EC2-Messaging** - Sistema de mensajes (dependencia de otros servicios)
3. **EC2-Bastion** - Host Bastion
4. **EC2-CORE** - Microservicios core
5. **EC2-API-Gateway** - API Gateway
6. **EC2-Reportes** - Reportes
7. **EC2-Notificaciones** - Notificaciones
8. **EC2-Analytics** - Analytics
9. **EC2-Monitoring** - Monitoring (Prometheus, Grafana)
10. **EC2-Frontend** - Frontend

## 📈 Monitoreo

Acceder a dashboards después del deploy:
- **Grafana**: `http://<EC2-Monitoring-IP>:3000`
- **Prometheus**: `http://<EC2-Monitoring-IP>:9090`
- **RabbitMQ**: `http://<EC2-Messaging-IP>:15672`

## 🔄 Actualizar Imágenes

1. Hacer push de nuevas imágenes al registry
2. Trigger del workflow o ejecutar script
3. Los containers se detienen, removenúltimos y se inician nuevos

## 📝 Notas

- Todos los containers tienen política de reinicio `--restart always`
- Los volúmenes se crean automáticamente si no existen
- Los scripts usan AWS Systems Manager para comunicación sin SSH directo
- Los workflows soportan ambientes: dev, staging, prod

---

**Última actualización**: 2026-01-16
