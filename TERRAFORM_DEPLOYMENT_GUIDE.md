# Terraform Infrastructure Deployment Guide

## Overview

Este workflow automatiza el despliegue de la infraestructura usando Terraform. Gestiona:

- **Application Load Balancer (ALB)** - Distribuye tráfico a todas las instancias
- **Target Groups** - Agrupa las 9 instancias EC2
- **Health Checks** - Verifica estado de cada instancia
- **Docker Deployment** - Instala Docker en todas las instancias
- **Communication Verification** - Verifica conectividad entre instancias

## Requisitos Previos

### AWS Setup

1. **IAM Roles para GitHub Actions**:
   ```bash
   # Crear rol para Terraform
   aws iam create-role \
     --role-name github-actions-terraform-role \
     --assume-role-policy-document '{...OIDC Provider...}'
   
   # Crear rol para SSM
   aws iam create-role \
     --role-name github-actions-ssm-role \
     --assume-role-policy-document '{...OIDC Provider...}'
   ```

2. **Subnets necesarios**:
   - Al menos 2 subnets en diferentes AZs
   - En la VPC: `vpc-083e8d854f2c9fbfd`

3. **S3 Backend Bucket** (se crea automáticamente):
   - Nombre: `proyecto-acompanamiento-tfstate`
   - Versionado: Habilitado
   - Encriptación: Habilitada

### Local Setup (Opcional para testing)

```bash
# Instalar Terraform
brew install terraform  # macOS
# o descargarlo desde https://www.terraform.io/downloads.html

# Copiar archivo de variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Editar con valores locales
nano terraform/terraform.tfvars
```

## Estructura del Proyecto

```
terraform/
├── main.tf                          # Configuración principal
├── variables.tf                     # Variables de entrada
├── outputs.tf                       # Salidas
├── backend.tf                       # Configuración del backend
├── terraform.tfvars.example         # Ejemplo de variables
├── .gitignore
└── modules/
    └── load_balancer/
        └── main.tf                  # Módulo ALB
```

## Variables Principales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `aws_region` | Región AWS | us-east-1 |
| `project_name` | Nombre del proyecto | proyecto-acompanamiento |
| `environment` | Ambiente (prod/dev) | production |
| `vpc_id` | ID de la VPC | vpc-083e8d854f2c9fbfd |
| `security_group_id` | Security Group | sg-03af810d8f419b171 |
| `instance_ids` | Lista de instancias | 9 instancias predefinidas |
| `subnet_ids` | Subnets para ALB | 2 subnets en us-east-1 |

## Uso del Workflow

### 1. Ejecutar Plan (Sin cambios)

```
GitHub → Actions → Deploy Infrastructure with Terraform → Run workflow
  → action: "plan"
  → auto_approve: false
```

**Resultado**: Muestra qué cambios se harían sin aplicarlos.

### 2. Ejecutar Apply (Crear recursos)

```
GitHub → Actions → Deploy Infrastructure with Terraform → Run workflow
  → action: "apply"
  → auto_approve: true
```

**Resultado**: 
- Crea el Load Balancer
- Registra las 9 instancias
- Despliega Docker en cada una
- Verifica comunicación

### 3. Ejecutar Destroy (Eliminar recursos)

```
GitHub → Actions → Deploy Infrastructure with Terraform → Run workflow
  → action: "destroy"
  → auto_approve: true
```

⚠️ **CUIDADO**: Elimina el Load Balancer y todos los recursos gestionados.

## Workflow Steps

### Job 1: terraform

1. **Checkout** - Descarga código
2. **AWS Credentials** - Configura credenciales vía OIDC
3. **Setup Terraform** - Instala Terraform v1.6.0
4. **Create Backend** - Crea S3 bucket para estado
5. **Create DynamoDB** - Crea tabla para locks
6. **Format Check** - Valida formato del código
7. **Init** - Inicializa Terraform
8. **Validate** - Valida sintaxis
9. **Plan** - Genera plan de cambios
10. **Apply/Destroy** - Aplica o destruye según acción

### Job 2: deploy-docker (paralelo, máx 3)

Para cada una de las 9 instancias:
1. Verifica estado de la instancia
2. Envía script de Docker vía SSM Session Manager
3. Espera completación
4. Verifica salida

### Job 3: verify-communication

1. Obtiene IPs de todas las instancias
2. Verifica Docker en cada una
3. Prueba conectividad entre instancias

## Outputs

Después de `terraform apply`, los outputs incluyen:

```json
{
  "load_balancer_dns_name": "proyecto-acompanamiento-alb-xxxxx.us-east-1.elb.amazonaws.com",
  "load_balancer_arn": "arn:aws:elasticloadbalancing:us-east-1:...",
  "target_group_arn": "arn:aws:elasticloadbalancing:us-east-1:...",
  "registered_instances": ["i-0413c190dbf686769", ...],
  "registered_instances_ips": ["10.0.1.50", ...]
}
```

## Instancias Gestionadas

| Nombre | ID | IP Pública | Tipo |
|--------|----|-----------|----|
| EC2-Messaging | i-0413c190dbf686769 | 54.146.164.8 | t3.small |
| EC2-Bastion | i-0bd13b8e83e8679bb | 3.87.155.74 | t3.small |
| EC2-Frontend | i-00a121b00e2e8aa55 | 54.85.92.175 | t3.small |
| EC2-API-Gateway | i-01fb14943445a6820 | 3.214.212.205 | t3.small |
| EC2-Reportes | i-0cbed7ea84129a7ca | 3.94.74.223 | t3.small |
| EC2-CORE | i-0cb7fc180ec736b7a | 3.234.198.34 | t3.small |
| EC2-Notificaciones | i-0e4141c9befb46701 | 18.232.53.140 | t3.small |
| EC2-Monitoring | i-02bd21ddcacaae221 | 34.203.175.72 | t3.small |
| EC2-DB | i-091730b9034fc8b71 | 98.81.16.245 | t3.small |

## Security Group

**SG-ACOMPANAMIENTO-ALL** (sg-03af810d8f419b171)

Inbound Rules:
- HTTP (80) - 0.0.0.0/0
- HTTPS (443) - 0.0.0.0/0
- SSH (22) - 0.0.0.0/0
- All TCP (0-65535) - 0.0.0.0/0

Outbound Rules:
- All traffic allowed

## Health Checks

El Load Balancer realiza health checks cada 30 segundos:
- **Path**: `/`
- **Port**: 80
- **Protocol**: HTTP
- **Healthy threshold**: 2 respuestas positivas
- **Unhealthy threshold**: 2 fallos
- **Timeout**: 5 segundos
- **Success codes**: 200-299

## Troubleshooting

### Error: "InvalidSubnetID.NotFound"

```bash
# Verificar subnets disponibles
aws ec2 describe-subnets --region us-east-1 --query 'Subnets[].SubnetId'
```

Actualizar `terraform/variables.tf` con IDs correctos.

### Error: "InstanceLimit.Exceeded"

Ya tienes 9 instancias. El ALB está registrando todas ellas.

### Instances unhealthy

1. Verificar Docker está corriendo:
   ```bash
   aws ssm send-command --instance-ids i-xxx --document-name AWS-RunShellScript \
     --parameters 'commands=["docker ps", "systemctl status docker"]'
   ```

2. Verificar Security Group:
   ```bash
   aws ec2 describe-security-groups --group-ids sg-03af810d8f419b171
   ```

3. Verificar network ACLs:
   ```bash
   aws ec2 describe-network-acls --filters "Name=association.subnet-id,Values=subnet-xxx"
   ```

### State Lock Issues

Si Terraform está "stuck":

```bash
# Listar locks
aws dynamodb scan --table-name terraform-locks

# Eliminar lock (cuidado!)
aws dynamodb delete-item --table-name terraform-locks \
  --key '{"LockID":{"S":"proyecto-acompanamiento-tfstate/infrastructure/terraform.tfstate"}}'
```

## Monitoreo

### CloudWatch Metrics

El ALB publica métricas automáticamente:
- `TargetResponseTime`
- `RequestCount`
- `HealthyHostCount`
- `UnHealthyHostCount`

### AWS Console

1. Ir a **EC2 → Load Balancers**
2. Seleccionar ALB
3. Ver pestaña **Targets** para estado de instancias

## Próximos Pasos

1. ✅ Crear workflow Terraform
2. ✅ Configurar backend S3
3. ✅ Desplegar Load Balancer
4. ⏳ Agregar listeners HTTPS
5. ⏳ Configurar auto-scaling
6. ⏳ Agregar WAF rules

## Referencias

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
