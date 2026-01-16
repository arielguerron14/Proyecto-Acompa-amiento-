# 🔧 Setup Inicial - Configuración de Workflows

## ✅ Checklist de Configuración

### 1️⃣ GitHub Secrets (Requerido)

Ir a: **Repository Settings → Secrets and variables → Actions**

Agregar los siguientes secretos:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SLACK_WEBHOOK=https://hooks.slack.com/services/... (opcional)
```

### 2️⃣ Permisos IAM en AWS

La cuenta AWS necesita permisos para:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeTags",
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ssm:ListCommandInvocations"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3️⃣ Roles IAM en Instancias EC2

Cada instancia EC2 debe tener:

```
Rol IAM: EC2-Systems-Manager-Role
Permisos: AmazonSSMManagedInstanceCore
```

Verificar:
```bash
# En cada instancia
systemctl status amazon-ssm-agent
```

### 4️⃣ Tags en Instancias EC2

Cada instancia debe tener un tag `Name` exacto:

| Instancia | Tag `Name` |
|-----------|-----------|
| Bastion | `EC2-Bastion` |
| API Gateway | `EC2-API-Gateway` |
| Core Services | `EC2-CORE` |
| Reportes | `EC2-Reportes` |
| Notificaciones | `EC2-Notificaciones` |
| Messaging | `EC2-Messaging` |
| Database | `EC2-DB` |
| Analytics | `EC2-Analytics` |
| Monitoring | `EC2-Monitoring` |
| Frontend | `EC2-Frontend` |

Verificar tags:
```bash
aws ec2 describe-instances --query \
  'Reservations[].Instances[].[InstanceId, Tags[?Key==`Name`].Value[0]]' \
  --output table
```

## 📦 Estructura Creada

```
.github/workflows/
├── deploy-bastion.yml              (10 workflows creados)
├── deploy-api-gateway.yml
├── deploy-core.yml
├── deploy-reportes.yml
├── deploy-notificaciones.yml
├── deploy-messaging.yml
├── deploy-database.yml
├── deploy-analytics.yml
├── deploy-monitoring.yml
└── deploy-frontend.yml

deployment/
├── README.md                        (Documentación principal)
├── QUICK_START.md                   (Guía rápida)
├── DEPLOYMENT_MAP.md                (Mapa de workflows)
├── EXAMPLES.md                      (Casos de uso)
├── SETUP.md                         (Este archivo)
├── config.env                       (Configuración)
├── orchestrator.py                  (Orquestador Python)
└── scripts/
    ├── deploy-all-instances.sh      (Orquestador Bash)
    ├── deploy-bastion.sh
    ├── deploy-api-gateway.sh
    ├── deploy-core.sh
    ├── deploy-reportes.sh
    ├── deploy-notificaciones.sh
    ├── deploy-messaging.sh
    ├── deploy-database.sh
    ├── deploy-analytics.sh
    ├── deploy-monitoring.sh
    ├── deploy-frontend.sh
    ├── health-check.sh              (Verificar estado)
    └── rollback.sh                  (Deshacer despliegues)
```

## 🚀 Primer Despliegue

### Opción 1: GitHub Actions (Recomendado)

1. **Ve a tu repositorio en GitHub**
2. **Selecciona pestaña "Actions"**
3. **Busca "Deploy EC2-DB"** (desplegar BD primero)
4. **Click en el workflow**
5. **Click "Run workflow"**
6. **Selecciona environment: "dev"**
7. **Click "Run workflow"**
8. **Espera a que se complete** (puedes ver logs en vivo)

Repetir para otras instancias en este orden:
1. EC2-DB
2. EC2-Messaging
3. EC2-Bastion
4. EC2-CORE
5. EC2-API-Gateway
6. EC2-Reportes
7. EC2-Notificaciones
8. EC2-Analytics
9. EC2-Monitoring
10. EC2-Frontend

### Opción 2: Script Local

```bash
# Instalar dependencias
pip install boto3

# Configurar AWS
aws configure

# Hacer scripts ejecutables
chmod +x deployment/scripts/*.sh

# Desplegar bases de datos primero
./deployment/scripts/deploy-database.sh

# Desplegar todo (espera entre pasos)
./deployment/scripts/deploy-all-instances.sh dev
```

### Opción 3: Python Orchestrator

```bash
# Instalar boto3 si no está instalado
pip install boto3

# Desplegar todo en dev
python3 deployment/orchestrator.py deploy-all --environment dev

# Ver progreso
```

## 🔍 Verificar que Todo Funciona

```bash
# Verificar salud de servicios
./deployment/scripts/health-check.sh

# Verificar instancias específicas
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[InstanceId, Tags[0].Value]' \
  --output table

# Ver contenedores activos en una instancia
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids <INSTANCE_ID> \
  --parameters "commands=['docker ps']"
```

## 📚 Documentación Disponible

| Documento | Propósito |
|-----------|-----------|
| `QUICK_START.md` | ⚡ Inicio rápido (3 opciones) |
| `README.md` | 📖 Documentación completa |
| `DEPLOYMENT_MAP.md` | 🗺️ Mapa de todos los workflows |
| `EXAMPLES.md` | 💡 10+ casos de uso prácticos |
| `SETUP.md` | 🔧 Configuración inicial |

## 🎯 Próximos Pasos

1. ✅ **Completar configuración de secretos en GitHub**
2. ✅ **Verificar IAM roles en instancias EC2**
3. ✅ **Verificar tags correctos en instancias**
4. ✅ **Ejecutar primer despliegue en dev**
5. ✅ **Verificar health-check**
6. ✅ **Acceder a dashboards (Grafana, Prometheus)**
7. ✅ **Documentar cambios en el repo**

## 🆘 Troubleshooting Setup

### Error: "No credentials are configured"
```bash
aws configure
# Ingresa: AWS Access Key ID, Secret Access Key, Region, Output format
```

### Error: "Instance not found"
```bash
# Verificar tags en instancias
aws ec2 describe-instances \
  --query 'Reservations[].Instances[].Tags' \
  --output table
```

### Error: "SSM Agent not available"
```bash
# Conectar a instancia y ejecutar:
sudo systemctl start amazon-ssm-agent
sudo systemctl status amazon-ssm-agent
```

## 📞 Soporte

Si tienes problemas:

1. Revisar `README.md` (sección Troubleshooting)
2. Revisar `EXAMPLES.md` (casos específicos)
3. Chequear GitHub Actions logs
4. Chequear AWS Systems Manager Console
5. Verificar credenciales y permisos

---

**¡Listo para desplegar!** 🚀

Comienza con `QUICK_START.md` para tu primera ejecución.
