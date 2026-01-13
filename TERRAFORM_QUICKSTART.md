# 🚀 Terraform Infrastructure Deployment Workflow

## Quick Start

Este workflow automatiza el despliegue de tu infraestructura AWS usando Terraform.

### 1️⃣ Configurar GitHub Secrets

Ejecuta el script de setup para crear los IAM roles necesarios:

```bash
# En tu máquina local con acceso AWS
chmod +x scripts/setup-github-actions-iam.sh
./scripts/setup-github-actions-iam.sh

# Luego copia el AWS_ACCOUNT_ID a GitHub Secrets
# https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions
```

Crea estos secrets:
- `AWS_ACCOUNT_ID` - Tu ID de cuenta AWS

### 2️⃣ Ejecutar el Workflow

En GitHub:
1. Ve a **Actions** → **Deploy Infrastructure with Terraform**
2. Click en **Run workflow**
3. Selecciona la acción:
   - `plan` - Ver cambios (sin aplicar)
   - `apply` - Crear Load Balancer y desplegar Docker
   - `destroy` - Eliminar recursos

### 3️⃣ Verificar Deployment

Los outputs se mostrarán en:
- **Workflow Summary** - DNS del Load Balancer
- **Artifacts** - Outputs de Terraform en JSON
- **AWS Console** - EC2 → Load Balancers

## ¿Qué Hace el Workflow?

### 1. Terraform Plan/Apply
- Crea/verifica S3 bucket para estado
- Crea/verifica DynamoDB lock table
- Crea Application Load Balancer
- Registra todas las 9 instancias como targets
- Configura health checks (puerto 80)
- Configura sticky sessions

### 2. Docker Deployment (Paralelo)
- Ejecuta script de instalación en cada instancia
- Instala docker.io y docker-compose
- Habilita systemd services
- Verifica instalación

### 3. Communication Verification
- Obtiene IPs de todas las instancias
- Verifica Docker está corriendo
- Verifica security group rules

## Instancias Desplegadas

| Nombre | ID | IP | AZ |
|--------|----|----|-----|
| EC2-Messaging | i-0413c190dbf686769 | 54.146.164.8 | us-east-1b |
| EC2-Bastion | i-0bd13b8e83e8679bb | 3.87.155.74 | us-east-1b |
| EC2-Frontend | i-00a121b00e2e8aa55 | 54.85.92.175 | us-east-1f |
| EC2-API-Gateway | i-01fb14943445a6820 | 3.214.212.205 | us-east-1f |
| EC2-Reportes | i-0cbed7ea84129a7ca | 3.94.74.223 | us-east-1f |
| EC2-CORE | i-0cb7fc180ec736b7a | 3.234.198.34 | us-east-1f |
| EC2-Notificaciones | i-0e4141c9befb46701 | 18.232.53.140 | us-east-1f |
| EC2-Monitoring | i-02bd21ddcacaae221 | 34.203.175.72 | us-east-1f |
| EC2-DB | i-091730b9034fc8b71 | 98.81.16.245 | us-east-1f |

## Load Balancer

Después de `apply`, accede a tu aplicación en:

```
http://proyecto-acompanamiento-alb-xxxxx.us-east-1.elb.amazonaws.com
```

El DNS aparece en:
- Workflow Summary → Load Balancer DNS
- AWS Console → EC2 → Load Balancers

## Troubleshooting

### ❌ "Role not found"
```bash
# Crear roles nuevamente
./scripts/setup-github-actions-iam.sh arielguerron14 Proyecto-Acompa-amiento-
```

### ❌ "Instances are unhealthy"
```bash
# Verificar Docker está corriendo
aws ssm send-command \
  --instance-ids i-0413c190dbf686769 \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["docker ps", "systemctl status docker"]'
```

### ❌ "Backend bucket already exists"
Espera a que se complete la creación. El workflow maneja esto automáticamente.

## Más Detalles

Lee la documentación completa en `TERRAFORM_DEPLOYMENT_GUIDE.md`

## Estructura del Código

```
terraform/
├── main.tf                  # Configuración principal
├── variables.tf             # Variables
├── outputs.tf               # Outputs
├── backend.tf               # S3 backend
└── modules/
    └── load_balancer/       # Módulo ALB
        └── main.tf

.github/workflows/
└── deploy-terraform.yml     # Workflow principal
```

## Próximas Mejoras

- [ ] HTTPS con ACM certificates
- [ ] Auto-scaling groups
- [ ] WAF rules
- [ ] CloudFront distribution
- [ ] Route53 DNS

---

**Estado**: ✅ Listo para producción
