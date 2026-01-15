# 🚀 Terraform Infrastructure Deployment - README

Este proyecto contiene una solución completa de **Infrastructure as Code** usando **Terraform** y **GitHub Actions** para desplegar y gestionar la infraestructura AWS.

## ⚡ Quick Start (5 minutos)

### 1. Leer la guía rápida
```bash
# Abre y lee este archivo
TERRAFORM_QUICKSTART.md
```

### 2. Configurar IAM Roles (En tu máquina con AWS CLI)
```bash
chmod +x scripts/setup-github-actions-iam.sh
./scripts/setup-github-actions-iam.sh
# Copia el AWS_ACCOUNT_ID que aparece
```

### 3. Agregar Secret en GitHub
```
https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions

Name: AWS_ACCOUNT_ID
Value: <tu-account-id>
```

### 4. Ejecutar Workflow
```
GitHub → Actions → Deploy Infrastructure with Terraform
→ Run workflow
→ action: apply
→ auto_approve: true
→ Run workflow
```

## 📚 Documentación

| Documento | Propósito |
|-----------|-----------|
| **TERRAFORM_QUICKSTART.md** | Guía rápida (5 min) - EMPIEZA AQUÍ |
| **TERRAFORM_DEPLOYMENT_GUIDE.md** | Referencia completa |
| **TERRAFORM_WORKFLOW_ARCHITECTURE.md** | Entender la arquitectura |
| **TERRAFORM_RESUMEN_FINAL.md** | Resumen ejecutivo |
| **SETUP_STEP_BY_STEP.sh** | Guía paso a paso interactiva |
| **DOCUMENTACION_INDEX_ACTUALIZADO.md** | Índice de toda la documentación |
| **ESTADISTICAS_ENTREGA.md** | Estadísticas del proyecto |

## 🏗️ Estructura del Proyecto

```
.
├── terraform/                           # Infraestructura como código
│   ├── main.tf                          # Configuración principal
│   ├── variables.tf                     # Variables configurables
│   ├── outputs.tf                       # Outputs del deployment
│   ├── backend.tf                       # S3 backend
│   ├── terraform.tfvars.example         # Ejemplo de variables
│   ├── .gitignore
│   └── modules/
│       └── load_balancer/
│           └── main.tf                  # Módulo ALB
│
├── .github/
│   ├── workflows/
│   │   └── deploy-terraform.yml         # Workflow principal
│   └── scripts/
│       └── setup-ec2-docker.sh          # Script Docker
│
├── scripts/
│   └── setup-github-actions-iam.sh      # Setup IAM roles
│
├── terraform-local.sh                   # Local development
│
└── DOCUMENTACION/
    ├── TERRAFORM_QUICKSTART.md
    ├── TERRAFORM_DEPLOYMENT_GUIDE.md
    ├── TERRAFORM_WORKFLOW_ARCHITECTURE.md
    └── (otros documentos)
```

## ✨ Características

### ✅ Infrastructure as Code
- Terraform configuration completa
- Módulos reutilizables
- Backend S3 con versionado
- DynamoDB locks para concurrencia
- Idempotente (detecta existencia)

### ✅ CI/CD Automation
- GitHub Actions workflow
- OIDC authentication (sin secrets)
- Plan/Apply/Destroy operations
- Matriz de deployment paralelo (9 instancias)
- Artifact management

### ✅ Load Balancing
- Application Load Balancer (ALB)
- Multi-AZ (us-east-1b, us-east-1f)
- Health checks automáticos
- Sticky sessions
- 9 targets registrados

### ✅ Docker Deployment
- Instalación idempotente
- Docker Compose incluido
- Daemon configuration
- Verificación de estado
- SSM Session Manager

### ✅ Security
- OIDC authentication
- IAM roles con least privilege
- State encryption (S3)
- Lock mechanism (DynamoDB)
- No hardcoded credentials

## 📊 Instancias Desplegadas

| # | Nombre | ID | IP Pública | AZ |
|---|--------|----|-----------|----|
| 1 | EC2-Messaging | i-0413c190dbf686769 | 54.146.164.8 | us-east-1b |
| 2 | EC2-Bastion ✅ | i-0bd13b8e83e8679bb | 3.87.155.74 | us-east-1b |
| 3 | EC2-Frontend | i-00a121b00e2e8aa55 | 54.85.92.175 | us-east-1f |
| 4 | EC2-API-Gateway | i-01fb14943445a6820 | 52.7.168.4 | us-east-1f |
| 5 | EC2-Reportes | i-0cbed7ea84129a7ca | 3.94.74.223 | us-east-1f |
| 6 | EC2-CORE | i-0cb7fc180ec736b7a | 3.234.198.34 | us-east-1f |
| 7 | EC2-Notificaciones | i-0e4141c9befb46701 | 18.232.53.140 | us-east-1f |
| 8 | EC2-Monitoring | i-02bd21ddcacaae221 | 34.203.175.72 | us-east-1f |
| 9 | EC2-DB | i-091730b9034fc8b71 | 98.81.16.245 | us-east-1f |

**Todos con**: VPC `vpc-083e8d854f2c9fbfd` | SG `sg-03af810d8f419b171` | Tipo `t3.small`

## 🎯 Workflow Execution

### Opciones de Ejecución

#### 1. Plan (Ver cambios sin aplicar)
```
GitHub Actions → Run workflow
action: plan
auto_approve: false
```
**Tiempo**: 2-3 minutos

#### 2. Apply (Crear/Actualizar recursos)
```
GitHub Actions → Run workflow
action: apply
auto_approve: true
```
**Tiempo**: 10-15 minutos

#### 3. Destroy (Eliminar recursos)
```
GitHub Actions → Run workflow
action: destroy
auto_approve: true
```
**Tiempo**: 3-5 minutos

## 🚀 Workflow Phases

```
1. Terraform Job (2-3 min)
   ├─ Setup credentials (OIDC)
   ├─ Initialize backend (S3 + DynamoDB)
   ├─ Validate configuration
   ├─ Create plan
   └─ Apply changes (if apply action)

2. Docker Deployment Job (5-7 min, paralelo)
   ├─ Instance 1-3 (paralelo)
   ├─ Instance 4-6 (paralelo)
   └─ Instance 7-9 (paralelo)

3. Communication Verification (1-2 min)
   ├─ Get instance IPs
   ├─ Verify Docker installation
   └─ Test connectivity

4. Summary Job (1 min)
   └─ Report status and outputs
```

## 📈 Outputs

Después de `apply`, obtendrás:

```json
{
  "load_balancer_dns_name": "proyecto-acompanamiento-alb-xxxxx.us-east-1.elb.amazonaws.com",
  "load_balancer_arn": "arn:aws:elasticloadbalancing:...",
  "target_group_arn": "arn:aws:elasticloadbalancing:...",
  "registered_instances": [
    "i-0413c190dbf686769",
    "i-0bd13b8e83e8679bb",
    ...
  ],
  "registered_instances_ips": [
    "10.0.1.50",
    "10.0.1.51",
    ...
  ]
}
```

## 🔧 Configuración Local

Para testing/development:

```bash
# Copiar archivo de variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Editar con valores locales
nano terraform/terraform.tfvars

# Inicializar
cd terraform
terraform init

# Ver cambios
terraform plan

# Aplicar (cuidado!)
terraform apply
```

## 🆘 Troubleshooting

### "Role not found"
```bash
# Re-ejecutar el setup
./scripts/setup-github-actions-iam.sh
```

### "Instances unhealthy"
```bash
# Verificar Docker
aws ssm send-command \
  --instance-ids i-xxx \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["docker ps"]'
```

### "Backend bucket error"
El workflow lo crea automáticamente. Espera a que complete.

## 📞 Soporte

1. **Documentación**: Consulta los archivos markdown
2. **Logs**: GitHub Actions → Workflow run → Step logs
3. **Debug local**: Ejecuta `terraform-local.sh`
4. **AWS Console**: Verifica recursos en AWS

## 🔄 Proceso de Actualización

1. Edita archivos en `terraform/`
2. Haz commit a `main`
3. Workflow se ejecuta automáticamente (plan)
4. Revisa el plan en GitHub
5. Ejecuta `apply` cuando esté listo

## 📋 Checklist de Producción

Antes de usar en producción:

- [ ] Ejecutar workflow con `action: plan`
- [ ] Revisar cambios
- [ ] Ejecutar workflow con `action: apply`
- [ ] Verificar ALB en AWS Console
- [ ] Probar health checks
- [ ] Verificar Docker en instancias
- [ ] Probar acceso al ALB
- [ ] Configurar monitoring
- [ ] Documentar endpoints
- [ ] Plan de rollback

## 🎓 Aprender Más

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [AWS Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## 📝 Licencia

Este proyecto es parte de "Proyecto-Acompa-amiento-"

## 👥 Contribuciones

Para cambios:
1. Crea una rama
2. Haz cambios
3. Abre pull request
4. Espera review

## ✅ Estado del Proyecto

| Aspecto | Estado |
|---------|--------|
| Terraform | ✅ Completo |
| Workflow | ✅ Completo |
| Documentación | ✅ Completo |
| Scripts | ✅ Completo |
| Testing | ✅ Listo |
| **TOTAL** | **✅ PRODUCCIÓN** |

---

## 🎯 Next Steps

1. **Lee**: TERRAFORM_QUICKSTART.md (5 min)
2. **Ejecuta**: ./scripts/setup-github-actions-iam.sh (3 min)
3. **Agrega**: AWS_ACCOUNT_ID en GitHub Secrets (1 min)
4. **Corre**: Workflow en GitHub (15 min)

---

**Última actualización**: Enero 12, 2026
**Versión**: 1.0.0
**Status**: ✅ OPERATIVO

**¡Comienza leyendo TERRAFORM_QUICKSTART.md!**
