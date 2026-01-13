# Workflow Architecture Overview

## 🏗️ Infraestructura Desplegada

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Actions Workflow                      │
│                  deploy-terraform.yml (Main)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐  ┌──────────┐  ┌───────────────┐
    │  PLAN   │  │  APPLY   │  │    DESTROY    │
    │ (ver)   │  │ (crear)  │  │   (eliminar)  │
    └─────────┘  └──────────┘  └───────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │    Terraform Backend Setup         │
        │  ✓ S3 Bucket (tfstate)            │
        │  ✓ DynamoDB Locks                 │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │    Terraform Modules               │
        │  ✓ ALB (Application Load Balancer) │
        │  ✓ Target Groups                   │
        │  ✓ Listeners                       │
        │  ✓ Health Checks                   │
        └────────────────┬───────────────────┘
                         │
        ┌────────────────┴──────────────────┐
        │                                   │
        ▼                                   ▼
   ┌─────────────┐              ┌──────────────────┐
   │ Docker      │              │ Communication    │
   │ Deployment  │              │ Verification     │
   │ (paralelo)  │              │ (serial)         │
   │ Max: 3      │              └──────────────────┘
   └─────────────┘
        │
     (9 jobs)
        │
    ┌───┬───┬───┬───┬───┬───┬───┬───┬───┐
    │   │   │   │   │   │   │   │   │   │
    ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼
   i-04 i-0b i-00 i-01 i-0c i-0c i-0e i-02 i-09
   Msg Bas  FE  API Rep CORE Not  Mon  DB

    ┌──────────────────────────────────────┐
    │     EC2 Instances (9)                │
    │  All with Docker + Docker-Compose    │
    │  Security Group: SG-ALL              │
    │  VPC: vpc-083e8d854f2c9fbfd         │
    └──────────────────────────────────────┘
        │
        │ Registrados en
        ▼
   ┌──────────────────────────────────────┐
   │  Application Load Balancer (ALB)     │
   │  ✓ DNS: xxx.us-east-1.elb.aws...    │
   │  ✓ Health Checks: HTTP 80            │
   │  ✓ Sticky Sessions: Enabled          │
   │  ✓ Multi-AZ: us-east-1b, us-east-1f │
   └──────────────────────────────────────┘
        │
        │ Escucha
        ▼
   ┌──────────────────────────────────────┐
   │  Listeners                           │
   │  ✓ HTTP:80 → Target Group            │
   │  ✓ HTTPS:443 (futuro)                │
   └──────────────────────────────────────┘
```

## 📊 Flujo del Workflow

### Fase 1: Terraform Setup
```
1. Checkout código
2. Configurar credenciales AWS (OIDC)
3. Instalar Terraform
4. Crear S3 backend (idempotente)
5. Crear DynamoDB locks (idempotente)
6. terraform init
7. terraform validate
8. terraform plan -out=tfplan
```

### Fase 2: Crear/Actualizar Infraestructura
```
Opción A (Plan):
- Mostrar cambios en output
- Guardar tfplan para review
- No aplicar cambios

Opción B (Apply):
- Crear/actualizar ALB
- Registrar 9 instancias
- Configurar health checks
- Mostrar outputs (DNS del ALB)

Opción C (Destroy):
- Eliminar ALB
- Eliminar target groups
- Eliminar listeners
```

### Fase 3: Desplegar Docker (Paralelo)
```
Para cada instancia (máx 3 en paralelo):
1. Verificar que está running
2. Enviar script setup-ec2-docker.sh vía SSM
3. Esperar completación
4. Verificar salida

Instancias:
- i-0413c190dbf686769 (EC2-Messaging)
- i-0bd13b8e83e8679bb (EC2-Bastion)
- i-00a121b00e2e8aa55 (EC2-Frontend)
- i-01fb14943445a6820 (EC2-API-Gateway)
- i-0cbed7ea84129a7ca (EC2-Reportes)
- i-0cb7fc180ec736b7a (EC2-CORE)
- i-0e4141c9befb46701 (EC2-Notificaciones)
- i-02bd21ddcacaae221 (EC2-Monitoring)
- i-091730b9034fc8b71 (EC2-DB)
```

### Fase 4: Verificar Comunicación
```
1. Obtener IPs de todas las instancias
2. Mostrar tabla de instancias
3. Verificar Docker en cada una
4. Verificar security group rules
5. Mostrar reporte de conectividad
```

## 🔐 Seguridad & IAM

```
GitHub Actions
    │
    └─► OIDC Provider
           │
           ├─► Terraform Role
           │   ├── EC2FullAccess
           │   ├── ElasticLoadBalancingFullAccess
           │   ├── S3FullAccess
           │   ├── DynamoDBFullAccess
           │   └── VPCFullAccess
           │
           └─► SSM Role
               ├── AmazonSSMManagedInstanceCore
               ├── EC2ReadOnlyAccess
               └── S3FullAccess
```

## 📈 Jobs & Dependencies

```
├── terraform (mandatory)
│   ├── checkout
│   ├── aws-credentials (OIDC)
│   ├── setup-terraform
│   ├── create-s3-backend
│   ├── create-dynamodb
│   ├── terraform init/validate/plan/apply
│   └── outputs
│
├── deploy-docker (needs: terraform)
│   ├── for each instance (parallel max 3)
│   │   ├── check-status
│   │   ├── send-docker-script (SSM)
│   │   ├── wait-for-completion
│   │   └── verify-output
│   └── [9 matrices]
│
├── verify-communication (needs: deploy-docker)
│   ├── get-instance-ips
│   ├── verify-docker
│   └── test-connectivity
│
└── create-summary (needs: all)
    └── report-status
```

## 🎯 Características Principales

### ✅ Idempotente
- ALB se crea solo si no existe
- Target groups se registran correctamente
- Backend S3/DynamoDB se crean una sola vez
- Script docker es idempotente

### ✅ Paralelo
- Docker deployment en 3 instancias máximo
- Acelera el tiempo de despliegue
- Fail-fast: false (continúa si alguna falla)

### ✅ Seguro
- OIDC para credenciales (sin secrets en repo)
- State encryption en S3
- DynamoDB locks para concurrencia
- IAM roles con permisos mínimos

### ✅ Observable
- Outputs en GitHub Summary
- Artifacts descargables
- Logs de SSM en S3
- Comentarios en PRs (si aplica)

## 🚀 Triggers

```
Manual (workflow_dispatch):
  - Inputs:
    - action: plan | apply | destroy
    - auto_approve: true | false

Automático (push):
  - Rama: main
  - Paths: terraform/** o .github/workflows/deploy-terraform.yml
```

## 📤 Salidas

```
Terraform Outputs:
├── load_balancer_dns_name
├── load_balancer_arn
├── target_group_arn
├── registered_instances (IDs)
└── registered_instances_ips (privadas)

GitHub Artifacts:
├── terraform-plan (tfplan)
└── terraform-outputs (JSON)

AWS Console:
├── EC2 → Load Balancers
├── EC2 → Target Groups
├── EC2 → Instances (con Docker)
└── CloudWatch → Load Balancer Metrics
```

## ⏱️ Tiempos Estimados

```
Plan:         2-3 minutos
Apply:        8-10 minutos (incluye Docker deploy)
Destroy:      3-5 minutos
```

## 🔧 Configuración Requerida

1. **AWS Account ID** (Secret en GitHub)
2. **OIDC Provider** (creado por script)
3. **IAM Roles** (creados por script)
4. **VPC & Security Group** (ya existen)
5. **EC2 Instances** (ya existen - 9 instancias)
6. **SSM Agent** (ya instalado en AMI)

## 📚 Archivos Clave

```
.github/workflows/deploy-terraform.yml   # Main workflow (500+ líneas)
terraform/
├── main.tf                              # Config principal
├── variables.tf                         # Variables
├── outputs.tf                           # Outputs
├── backend.tf                           # S3 backend
└── modules/load_balancer/main.tf        # Módulo ALB

.github/scripts/setup-ec2-docker.sh      # Docker installation script
scripts/setup-github-actions-iam.sh      # IAM setup script

TERRAFORM_DEPLOYMENT_GUIDE.md            # Documentación completa
TERRAFORM_QUICKSTART.md                  # Quick start
terraform-local.sh                       # Local development
```

---

**Estado**: ✅ COMPLETO Y LISTO PARA USAR
