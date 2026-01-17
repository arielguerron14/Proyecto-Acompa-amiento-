# 🚀 Automated Deployment Guide

## Overview

Este repositorio incluye una solución **completamente automatizada** para desplegar toda la aplicación en AWS. Solo necesitas:

1. Crear la infraestructura con Terraform
2. Hacer push a GitHub
3. Los workflows se encargan del resto

## Prerequisites

### Local Setup
```bash
# 1. Configure AWS credentials
aws configure

# 2. Create SSH key for EC2
aws ec2 create-key-pair --key-name proyecto-key --region us-east-1 --query 'KeyMaterial' --output text > proyecto-key.pem
chmod 600 proyecto-key.pem

# 3. Install Terraform
terraform --version  # Ensure >= 1.0
```

### GitHub Secrets Setup
Configure these secrets en GitHub: `Settings → Secrets and variables → Actions`

```bash
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_SESSION_TOKEN=<your-session-token>  # Si usas credenciales temporales
EC2_SSH_KEY=<contenido-completo-de-proyecto-key.pem>
DOCKER_USERNAME=<tu-username-dockerhub>
DOCKER_TOKEN=<tu-token-dockerhub>
```

> **⚠️ Important**: Para `EC2_SSH_KEY`, copia TODO el contenido del archivo `.pem` (incluyendo BEGIN/END lines)

## Step 1: Create Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review what will be created
terraform plan -var="ssh_key_name=proyecto-key"

# Create infrastructure
terraform apply -var="ssh_key_name=proyecto-key" -auto-approve
```

**Espera a que termine** (5-10 minutos). Esto crea:
- VPC y subnets
- 9 instancias EC2 (DB, CORE, API-Gateway, Frontend, etc.)
- Security groups
- Elastic IPs
- IAM roles

Una vez terminado, verás:
```
✅ Outputs:
vpc_id = "vpc-xxxxxxxx"
instances_summary = {
  "EC2-API-Gateway" = {
    public_ip = "35.168.216.132"
    private_ip = "10.0.1.XX"
    ...
  }
  ...
}
```

## Step 2: Commit Infrastructure Changes

```bash
# Terraform guarda config en config/instance_ips.json
git add config/instance_ips.json terraform/
git commit -m "Infrastructure deployed via Terraform"
git push origin main
```

## Step 3: Monitor Automated Deployment

El workflow `auto-deploy-all` se ejecuta **automáticamente** cuando detecta cambios.

### Ver progreso:
```bash
# Monitor en tiempo real
gh run list --workflow="auto-deploy-all.yml"

# Ver logs detallados
gh run view <run-id> --log

# O ver en GitHub UI: https://github.com/tu-repo/actions
```

### Phases ejecutadas automáticamente:

```
✅ Phase 1: Wait for instances (5-15 min)
   └─ Verifica que los 9 EC2 instances estén running

✅ Phase 2: Deploy Databases (2-3 min)
   └─ MongoDB 6.0
   └─ PostgreSQL 15
   └─ Redis 7

✅ Phase 3: Deploy Microservices (3-5 min)
   └─ micro-auth (puerto 3000)
   └─ micro-estudiantes (puerto 3001)
   └─ micro-maestros (puerto 3002)

✅ Phase 4: Deploy API Gateway (2-3 min)
   └─ API Gateway (puerto 8080)
   └─ Configura CORE_HOST automáticamente

✅ Phase 5: Verify Deployment (1-2 min)
   └─ Verifica que todos los servicios respondan
   └─ Prueba endpoints de health
```

**Tiempo total: 15-30 minutos**

## Step 4: Test the Deployment

Una vez que el workflow termine (deberías recibir email de GitHub con status ✅):

### 1. Obtén la IP pública del API Gateway
```bash
# Opción 1: Desde AWS Console
# EC2 → Instances → Busca EC2-API-Gateway → copia PublicIpAddress

# Opción 2: Desde GitHub Workflow logs (veras el output)

# Opción 3: Desde CLI
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-API-Gateway" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --region us-east-1
```

### 2. Test API Gateway Health
```bash
export API_GATEWAY=35.168.216.132  # Reemplaza con tu IP

curl http://$API_GATEWAY:8080/health
```

Esperado:
```json
{
  "status": "OK",
  "message": "API Gateway is running",
  "coreHost": "10.0.1.XX"
}
```

### 3. Test User Registration
```bash
curl -X POST http://$API_GATEWAY:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

Esperado:
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": { "email": "test@example.com", ... }
}
```

### 4. Test User Login
```bash
curl -X POST http://$API_GATEWAY:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Troubleshooting

### Workflow stuck en "Wait for instances"
```bash
# Verifica que instances estén running
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --region us-east-1 \
  --query "Reservations[].Instances[].{Name:Tags[0].Value,IP:PublicIpAddress,State:State.Name}"
```

Si una instance no está running:
```bash
# Inicia manualmente
aws ec2 start-instances --instance-ids i-xxxxxxxx --region us-east-1
```

### Databases no responden
```bash
# SSH a EC2-DB
ssh -i proyecto-key.pem ubuntu@<EC2-DB-PublicIP>

# Ver containers
docker ps -a

# Ver logs
docker logs mongo
docker logs postgres
docker logs redis
```

### Microservices no responden
```bash
# SSH a EC2-CORE
ssh -i proyecto-key.pem ubuntu@<EC2-CORE-PublicIP>

# Ver containers
docker ps -a

# Ver logs
docker logs micro-auth
docker logs micro-estudiantes
docker logs micro-maestros
```

### API Gateway no proxea correctamente
```bash
# SSH a EC2-API-Gateway
ssh -i proyecto-key.pem ubuntu@<EC2-API-Gateway-PublicIP>

# Ver container
docker ps -a

# Ver logs
docker logs api-gateway

# Verifica que tenga CORE_HOST correcto
docker inspect api-gateway | grep CORE_HOST
```

## Environment Variables

El workflow configura automáticamente:

```bash
# En EC2-CORE (microservices)
PORT=3000/3001/3002
MONGODB_URI=mongodb://root:example@<EC2-DB-PrivateIP>:27017/<db>?authSource=admin
NODE_ENV=production

# En EC2-API-Gateway
CORE_HOST=<EC2-CORE-PrivateIP>
NODE_ENV=production
```

## Cleaning Up

### Destruir todo
```bash
cd terraform
terraform destroy -auto-approve -var="ssh_key_name=proyecto-key"
```

### Borrar SSH key
```bash
aws ec2 delete-key-pair --key-name proyecto-key --region us-east-1
rm proyecto-key.pem
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Account (us-east-1)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  VPC: 10.0.0.0/16                                   │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Subnet: 10.0.1.0/24 (us-east-1a)           │    │   │
│  │  │                                              │    │   │
│  │  │  ┌──────────────────┐ ┌─────────────────┐  │    │   │
│  │  │  │ EC2-DB           │ │ EC2-CORE        │  │    │   │
│  │  │  │ t3.medium        │ │ t3.small        │  │    │   │
│  │  │  │ 10.0.1.10        │ │ 10.0.1.20       │  │    │   │
│  │  │  │ - MongoDB        │ │ - micro-auth    │  │    │   │
│  │  │  │ - PostgreSQL     │ │ - micro-estudt  │  │    │   │
│  │  │  │ - Redis          │ │ - micro-maestro │  │    │   │
│  │  │  └──────────────────┘ └─────────────────┘  │    │   │
│  │  │         ▲                      ▲             │    │   │
│  │  │         └──────────────────────┘             │    │   │
│  │  │                                              │    │   │
│  │  │  ┌──────────────────────────────────────┐   │    │   │
│  │  │  │ EC2-API-Gateway (port 8080)          │   │    │   │
│  │  │  │ 10.0.1.30 → EIP: 35.168.216.132     │   │    │   │
│  │  │  │ - Proxies to CORE_HOST               │   │    │   │
│  │  │  └──────────────────────────────────────┘   │    │   │
│  │  │              ▲                               │    │   │
│  │  │              │                               │    │   │
│  │  │  ┌──────────────────────────────────────┐   │    │   │
│  │  │  │ EC2-Frontend (port 5500)             │   │    │   │
│  │  │  │ 10.0.1.40 → EIP: 3.231.12.130      │   │    │   │
│  │  │  └──────────────────────────────────────┘   │    │   │
│  │  │                                              │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘

        ▼
   ┌─────────────────┐
   │  GitHub Actions │
   │  auto-deploy-   │
   │  all.yml        │
   └─────────────────┘
```

## Next Steps

1. **Monitoring**: Configura CloudWatch para monitorear instances
2. **Backups**: Habilita snapshots automáticos de volúmenes
3. **Logging**: Centraliza logs en CloudWatch
4. **Scaling**: Configura Auto Scaling Groups
5. **SSL/TLS**: Configura certificados para HTTPS
6. **CI/CD**: Integra deployments con push automáticos

## Support

Si algo falla:

1. Revisa los logs del workflow en GitHub Actions
2. SSH a las instancias y verifica los containers
3. Revisa los logs de Docker en cada instancia
4. Verifica que los GitHub Secrets estén correctos

---

**¡Tu aplicación debería estar completamente funcional en 15-30 minutos! 🎉**
