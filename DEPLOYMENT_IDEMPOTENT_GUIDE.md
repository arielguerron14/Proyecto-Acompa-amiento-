# Guía de Despliegue Idempotente

## 🎯 Objetivo

Este sistema permite desplegar infraestructura en AWS de manera **idempotente**, es decir:
- Si las instancias ya existen → NO se recrean
- Si faltan instancias → Se crean SOLO las faltantes
- El ALB siempre registra todas las instancias

## 📋 Requisitos

### Local (desarrollo)
```powershell
# Instalar AWS CLI
winget install amazon.awscli

# Instalar Terraform
winget install hashicorp.terraform

# Verificar instalación
aws --version
terraform --version
```

### GitHub Actions (CI/CD)
Necesitas agregar 3 secretos en: **Settings → Secrets and Variables → Actions**

| Secreto | Valor |
|---------|-------|
| `AWS_ACCESS_KEY_ID` | Tu Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | Tu Secret Access Key |
| `AWS_SESSION_TOKEN` | Tu Session Token (temporal) |

⚠️ **IMPORTANTE**: Los STS tokens temporales expiran en ~1 hora. Obtén nuevos tokens antes de ejecutar el workflow.

## 🚀 Uso Local

### 1. Ver estado actual
```powershell
.\deploy-idempotent.ps1 -Action status -Profile default
```

Muestra:
- Instancias EC2 existentes y su estado
- Health del ALB
- Targets saludables vs totales
- URL del ALB para testing

### 2. Ver cambios que haría (plan)
```powershell
.\deploy-idempotent.ps1 -Action plan -Profile default
```

Muestra:
- Instancias que se crearían
- Instancias que se modificarían
- Instancias que se eliminarían
- **SIN hacer cambios reales**

### 3. Aplicar cambios (apply)
```powershell
.\deploy-idempotent.ps1 -Action apply -Profile default
```

Proceso:
1. Genera plan (como arriba)
2. Pide confirmación
3. Crea/modifica recursos
4. Espera 10 segundos estabilización
5. Muestra estado final

### 4. Destruir todo (⚠️ cuidado)
```powershell
.\deploy-idempotent.ps1 -Action destroy -Profile default
```

Necesita confirmación escribiendo "confirmar"

## 🤖 Uso en GitHub Actions

### Trigger manual (workflow_dispatch)

1. Ve a **Actions → Deploy Infrastructure**
2. Click en **Run workflow**
3. Selecciona acción:
   - `plan` - Ver cambios sin aplicar
   - `apply` - Crear/actualizar infraestructura
   - `destroy` - Eliminar todo

4. Click **Run workflow**

### Monitoreo

- Los logs aparecen en tiempo real
- Puedes ver detalles de cada paso
- Al final: resumen de cambios y status

## 📊 Arquitectura Idempotente

### Cómo funciona

```
Workflow → Terraform Plan → Detect Existing → Create Missing → Register All
                              Instances        Instances      in ALB
```

### Datos source (detect existing)
```hcl
data "aws_instances" "existing" {
  filters {
    name = "tag:Name"
    values = var.instance_names
  }
}
```

### Lógica de creación
```hcl
locals {
  existing_instance_names = {
    for inst in data.aws_instances.existing.ids : 
      inst.tags.Name => inst.id
  }
  
  instances_to_create = {
    for name in var.instance_names :
      name => name
      if !contains(keys(local.existing_instance_names), name)
  }
}

resource "aws_instance" "app" {
  for_each = local.instances_to_create
  # Solo crea las que no existen
}
```

### Registro en ALB
```hcl
locals {
  all_instance_ids = merge(
    data.aws_instances.existing.ids,     # Existentes
    {for k, v in aws_instance.app : v.tags.Name => v.id}  # Nuevas
  )
}

resource "aws_lb_target_group_attachment" "app" {
  for_each = local.all_instance_ids
  # Registra TODAS (existentes + nuevas)
}
```

## 🔄 Flujo de Ejecución

### Primera vez (sin instancias)

```
1. terraform plan
   └─ Detecta: 0 instancias existentes
   └─ Calcula: Crear 8 instancias

2. terraform apply
   └─ Crea: 8 instancias t3.medium
   └─ Instala: Docker en cada una
   └─ Registra: 8 targets en ALB

3. Status
   └─ Muestra: 8/8 corriendo
   └─ ALB: 8 targets (healthy después de ~2 min)
```

### Segunda vez (idempotencia)

```
1. terraform plan
   └─ Detecta: 8 instancias existentes
   └─ Calcula: Crear 0 instancias

2. terraform apply
   └─ Crea: 0 instancias
   └─ Modifica: 0 recursos
   └─ Elimina: 0 recursos
   └─ Resultado: "No changes"

3. Status
   └─ Muestra: 8/8 corriendo (sin cambios)
   └─ ALB: 8 targets (sin cambios)
```

## 🐛 Troubleshooting

### Error: "Credenciales expiradas"

**Síntoma:**
```
Error: error refreshing state: NotAuthenticatedError
```

**Solución:**
```powershell
# Obtener nuevas credenciales en AWS Console
# Luego:
aws configure --profile default

# Actualizar GitHub Secrets con nuevos valores:
# AWS_ACCESS_KEY_ID
# AWS_SECRET_ACCESS_KEY
# AWS_SESSION_TOKEN
```

### Error: "No se encuentran instancias existentes"

**Síntoma:**
```
Plan: 8 to add, 0 to change, 0 to destroy
```

**Posibles causas:**
- Instancias se eliminaron manualmente
- Están en otra región
- Etiqueta "Project" no coincide

**Solución:**
```powershell
# Verificar
aws ec2 describe-instances --region us-east-1 --profile default

# Si necesitas limpiar antes de crear:
.\deploy-idempotent.ps1 -Action destroy -Profile default
.\deploy-idempotent.ps1 -Action apply -Profile default
```

### Error: "Target Group no saludable"

**Síntoma:**
```
Health: 0/8 saludables
Estado: unhealthy
Razón: Timeout
```

**Motivos comunes:**
- Instancias recién creadas (tarden ~2 min en arrancar)
- Docker no instaló correctamente
- Security Group bloquea puerto 80

**Solución:**
1. Espera 2-3 minutos después de crear
2. Verifica security group permite puerto 80:
   ```powershell
   aws ec2 describe-security-groups --region us-east-1 `
     --group-ids sg-04f3d554d6dc9e304 --profile default
   ```
3. Conecta a instancia y verifica Docker:
   ```bash
   ssh -i key.pem ec2-user@instance-ip
   docker ps
   sudo systemctl status docker
   ```

## 📈 Escalado

### Agregar más instancias

1. Edita `terraform/variables.tf`:
```hcl
variable "instance_names" {
  default = [
    "bastion-host",
    "micro-core",
    # ... agregar aquí ...
    "nueva-instancia"
  ]
}
```

2. Ejecuta:
```powershell
.\deploy-idempotent.ps1 -Action plan
.\deploy-idempotent.ps1 -Action apply
```

**Resultado**: Solo se crea la instancia nueva. Las existentes no se tocan.

## 🔐 Seguridad

### Credenciales temporales

- Los STS tokens **expiran en ~1 hora**
- Se usan para GitHub Actions
- **NUNCA** hardcodear en código

### Mejor práctica

```powershell
# 1. Obtener credenciales (AWS Console)
# 2. Guardar en GitHub Secrets (Settings → Secrets)
# 3. Usar en workflow/config

# Para desarrollo local:
aws configure --profile proyecto-acompanamiento

# Usar con:
.\deploy-idempotent.ps1 -Profile proyecto-acompanamiento
```

## 📚 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `terraform/main.tf` | Configuración idempotente de infraestructura |
| `terraform/variables.tf` | Variables (nombres, tipos, IPs) |
| `terraform/outputs.tf` | Salidas (IPs, DNS, IDs) |
| `.github/workflows/deploy-terraform.yml` | Workflow de GitHub Actions |
| `deploy-idempotent.ps1` | Script de deploy local |
| `deploy-idempotent-status.ps1` | Script de status (próximamente) |

## ✅ Checklist Completo

- [ ] AWS CLI instalado y configurado
- [ ] Terraform instalado
- [ ] Credenciales AWS configuradas localmente
- [ ] GitHub Secrets configurados (3 secretos)
- [ ] Archivo `terraform/main.tf` actualizado
- [ ] Archivo `terraform/variables.tf` correcto
- [ ] Workflow `.github/workflows/deploy-terraform.yml` actualizado
- [ ] Primer deploy ejecutado y exitoso
- [ ] Segunda ejecución confirmó idempotencia (0 cambios)
- [ ] Status muestra todas las instancias
- [ ] ALB muestra targets saludables

## 🎓 Próximos Pasos

1. **Desplegar aplicaciones**
   - Usar Docker en instancias
   - Montar servicios desde `docker-compose`
   - Configurar health checks

2. **Automatizar despliegue de apps**
   - GitHub workflow adicional
   - Despliega código en instancias
   - Ejecuta servicios automáticamente

3. **Monitoreo**
   - CloudWatch metrics
   - ALB access logs
   - Alertas en Slack/Email

4. **CI/CD completo**
   - Build Docker images
   - Push a ECR
   - Deploy automático en instancias

## 🆘 Soporte

Si algo no funciona:

1. Verifica logs:
   ```powershell
   .\deploy-idempotent.ps1 -Action status -Verbose
   ```

2. Revisa credenciales:
   ```powershell
   aws sts get-caller-identity --profile default
   ```

3. Limpia y redeploy:
   ```powershell
   .\deploy-idempotent.ps1 -Action destroy
   .\deploy-idempotent.ps1 -Action apply
   ```

---

**Última actualización**: $(Get-Date -Format 'dd/MM/yyyy HH:mm')
**Versión**: 1.0 (Idempotente)
