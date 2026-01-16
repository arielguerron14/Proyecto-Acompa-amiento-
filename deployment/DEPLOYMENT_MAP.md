# 📦 Estructura Completa de Workflows de Despliegue

## 📂 Arbol de Directorios

```
Proyecto-Acompa-amiento-/
│
├── .github/
│   └── workflows/
│       ├── deploy-bastion.yml                 ✓ Workflow para EC2-Bastion
│       ├── deploy-api-gateway.yml             ✓ Workflow para EC2-API-Gateway
│       ├── deploy-core.yml                    ✓ Workflow para EC2-CORE
│       ├── deploy-reportes.yml                ✓ Workflow para EC2-Reportes
│       ├── deploy-notificaciones.yml          ✓ Workflow para EC2-Notificaciones
│       ├── deploy-messaging.yml               ✓ Workflow para EC2-Messaging
│       ├── deploy-database.yml                ✓ Workflow para EC2-DB
│       ├── deploy-analytics.yml               ✓ Workflow para EC2-Analytics
│       ├── deploy-monitoring.yml              ✓ Workflow para EC2-Monitoring
│       ├── deploy-frontend.yml                ✓ Workflow para EC2-Frontend
│       └── terraform.yml                      (Existente)
│
└── deployment/
    ├── README.md                              📖 Documentación completa
    ├── QUICK_START.md                         ⚡ Guía rápida de inicio
    ├── config.env                             ⚙️  Configuración centralizada
    ├── orchestrator.py                        🐍 Orquestador Python
    │
    └── scripts/
        ├── deploy-all-instances.sh            🚀 Orquestador de shells
        ├── deploy-bastion.sh                  Deploy EC2-Bastion
        ├── deploy-api-gateway.sh              Deploy EC2-API-Gateway
        ├── deploy-core.sh                     Deploy EC2-CORE (4 microservicios)
        ├── deploy-reportes.sh                 Deploy EC2-Reportes
        ├── deploy-notificaciones.sh           Deploy EC2-Notificaciones
        ├── deploy-messaging.sh                Deploy EC2-Messaging (Kafka, Zookeeper, RabbitMQ)
        ├── deploy-database.sh                 Deploy EC2-DB (Mongo, Postgres, Redis)
        ├── deploy-analytics.sh                Deploy EC2-Analytics
        ├── deploy-monitoring.sh               Deploy EC2-Monitoring (Prometheus, Grafana)
        └── deploy-frontend.sh                 Deploy EC2-Frontend
```

## 📊 Resumen de Workflows

| Instancia | Workflow | Imagen(es) | Puertos | Estado |
|-----------|----------|-----------|---------|--------|
| **EC2-Bastion** | deploy-bastion.yml | bastion-host:latest | 22 | ✅ |
| **EC2-API-Gateway** | deploy-api-gateway.yml | api-gateway:latest | 8080 | ✅ |
| **EC2-CORE** | deploy-core.yml | micro-auth, micro-estudiantes, micro-maestros, micro-core | 3001-3004 | ✅ |
| **EC2-Reportes** | deploy-reportes.yml | micro-reportes-estudiantes, micro-reportes-maestros | 4001-4002 | ✅ |
| **EC2-Notificaciones** | deploy-notificaciones.yml | micro-notificaciones:latest | 5000 | ✅ |
| **EC2-Messaging** | deploy-messaging.yml | proyecto-zookeeper, proyecto-kafka, proyecto-rabbitmq | 2181, 9092, 5672 | ✅ |
| **EC2-DB** | deploy-database.yml | mongo, postgres, redis | 27017, 5432, 6379 | ✅ |
| **EC2-Analytics** | deploy-analytics.yml | micro-analytics:latest | 6000 | ✅ |
| **EC2-Monitoring** | deploy-monitoring.yml | proyecto-prometheus, proyecto-grafana | 9090, 3000 | ✅ |
| **EC2-Frontend** | deploy-frontend.yml | frontend-web:latest | 80, 443 | ✅ |

## 🎯 Características de los Workflows

### ✨ Cada Workflow Incluye:

1. **Triggers Automáticos**
   - Push a rama `main`
   - Trigger manual en GitHub Actions
   - Selector de environment (dev/staging/prod)

2. **Pasos de Despliegue**
   - Configuración de credenciales AWS
   - Obtención automática de ID de instancia
   - Pull de imágenes Docker
   - Detención/remoción de contenedores antiguos
   - Inicio de nuevos contenedores
   - Health checks y verificación
   - Notificaciones a Slack

3. **Manejo de Errores**
   - Fallos capturados y reportados
   - Notificaciones en caso de error
   - Logs disponibles en GitHub Actions

4. **Seguridad**
   - Credenciales en GitHub Secrets
   - IAM roles en instancias EC2
   - AWS Systems Manager (sin SSH directo)

## 🔐 Secretos Requeridos en GitHub

Configurar en: **Settings → Secrets and variables → Actions**

```
AWS_ACCESS_KEY_ID          (Requerido)
AWS_SECRET_ACCESS_KEY      (Requerido)
SLACK_WEBHOOK              (Opcional)
```

## 🛠️ Scripts Bash Incluidos

### 1. `deploy-all-instances.sh`
**Uso**: Dispara todos los workflows en orden
```bash
./deployment/scripts/deploy-all-instances.sh [dev|staging|prod]
```

### 2. `deploy-*.sh` (10 scripts específicos)
**Uso**: Despliegue individual de cada instancia
```bash
./deployment/scripts/deploy-bastion.sh
./deployment/scripts/deploy-database.sh
# ... etc
```

## 🐍 Orquestador Python

**Archivo**: `deployment/orchestrator.py`

### Usos:

```bash
# Desplegar todas las instancias
python3 deployment/orchestrator.py deploy-all --environment dev

# Desplegar instancia específica
python3 deployment/orchestrator.py deploy --instance EC2-Bastion

# Listar instancias disponibles
python3 deployment/orchestrator.py --list

# Desplegar sin esperar
python3 deployment/orchestrator.py deploy --instance EC2-API-Gateway --no-wait
```

### Características:
- ✅ Despliegue secuencial inteligente
- ✅ Respeta dependencias (DB → Messaging → Servicios)
- ✅ Monitoreo en tiempo real
- ✅ Resumen de resultados
- ✅ Manejo de errores

## 📈 Orden de Despliegue Recomendado

```
1. EC2-DB           (MongoDB, PostgreSQL, Redis)
2. EC2-Messaging    (Zookeeper, Kafka, RabbitMQ)
3. EC2-Bastion      (Host Bastion)
4. EC2-CORE         (Microservicios core)
5. EC2-API-Gateway  (API Gateway)
6. EC2-Reportes     (Reportes)
7. EC2-Notificaciones (Notificaciones)
8. EC2-Analytics    (Analytics)
9. EC2-Monitoring   (Prometheus, Grafana)
10. EC2-Frontend    (Frontend web)
```

## 📝 Archivos de Documentación

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Documentación completa y detallada |
| `QUICK_START.md` | Guía rápida de inicio |
| `config.env` | Configuración centralizada |
| `DEPLOYMENT_MAP.md` | Este archivo (mapa de despliegue) |

## 🔄 Flujo de Trabajo Típico

### Opción 1: GitHub Actions (Recomendado)
```
1. Push a main
   ↓
2. GitHub Actions dispara workflows automáticamente
   ↓
3. Workflows ejecutan despliegues en orden
   ↓
4. Notificaciones a Slack
   ↓
5. Verificación en dashboards
```

### Opción 2: Scripts Locales
```
1. chmod +x deployment/scripts/*.sh
   ↓
2. ./deployment/scripts/deploy-all-instances.sh dev
   ↓
3. Monitorear en AWS Systems Manager Console
   ↓
4. Verificar en dashboards
```

### Opción 3: Python Orchestrator
```
1. pip install boto3
   ↓
2. aws configure
   ↓
3. python3 deployment/orchestrator.py deploy-all --environment dev
   ↓
4. Ver resultado final con resumen
```

## 💾 Variables de Configuración

Ver `deployment/config.env` para:
- Tags de instancias EC2
- Imágenes Docker
- Puertos de servicios
- Volúmenes Docker
- Configuración de ambientes

## 🚨 Troubleshooting

### Instancia no encontrada
```bash
# Verificar instancias en ejecución
aws ec2 describe-instances --filters "Name=instance-state-name,Values=running"
```

### Contenedor falla al iniciar
```bash
# Ver logs del contenedor
docker logs <CONTAINER_NAME>

# Reintentar despliegue
python3 deployment/orchestrator.py deploy --instance EC2-CORE
```

### Permisos SSM insuficientes
```bash
# Verificar rol IAM de la instancia
aws iam get-role --role-name <INSTANCE_ROLE>

# Verificar Systems Manager Agent
systemctl status amazon-ssm-agent
```

## 📊 Monitoreo Post-Despliegue

### Dashboards Accesibles
- **Grafana**: `http://<EC2-Monitoring-IP>:3000`
- **Prometheus**: `http://<EC2-Monitoring-IP>:9090`
- **RabbitMQ**: `http://<EC2-Messaging-IP>:15672`

### Verificar Servicios
```bash
# En cualquier instancia
docker ps                    # Ver contenedores activos
docker logs <container>      # Ver logs
docker inspect <container>   # Ver detalles
```

## 📞 Soporte

Para más información:
1. Revisar `deployment/README.md` (documentación detallada)
2. Revisar `deployment/QUICK_START.md` (guía rápida)
3. Ver logs en GitHub Actions o AWS Systems Manager Console
4. Revisar notificaciones en Slack (si configurado)

---

**Última actualización**: 2026-01-16
**Versión**: 1.0
**Estado**: ✅ Completo y funcional
