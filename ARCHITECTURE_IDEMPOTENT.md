# 🏗️ Arquitectura del Sistema de Despliegue Idempotente

## Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                                │
│  (Proyecto-Acompa-amiento-)                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼──────────┐
            │  LOCAL DEPLOY  │  │  GitHub Actions │
            │                │  │    (CI/CD)      │
            └────────────────┘  └──────────────────┘
                    │                    │
                    │                    │
      ┌─────────────┘                    └──────────────┐
      │                                                 │
      ▼                                                 ▼
┌──────────────────┐                         ┌──────────────────┐
│ AWS CREDENTIALS  │                         │ GitHub SECRETS   │
│ (Local ~/.aws/)  │                         │ (3 secrets)      │
│                  │                         │                  │
│ - Access Key ID  │                         │ - AWS_ACCESS_    │
│ - Secret Key     │                         │   KEY_ID         │
│ - (no token)     │                         │ - AWS_SECRET_    │
│                  │                         │   ACCESS_KEY     │
│                  │                         │ - AWS_SESSION_   │
│                  │                         │   TOKEN          │
└──────────────────┘                         └──────────────────┘
      │                                                 │
      └─────────────────┬───────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │         TERRAFORM DEPLOYMENT          │
        │  (terraform/main.tf)                  │
        │                                       │
        │ 1. Detect Existing Instances          │
        │    └─ data "aws_instances"            │
        │                                       │
        │ 2. Calculate Missing Instances        │
        │    └─ locals.instances_to_create      │
        │                                       │
        │ 3. Create Only Missing                │
        │    └─ resource "aws_instance"         │
        │       (for_each = to_create)          │
        │                                       │
        │ 4. Register ALL in ALB                │
        │    └─ resource "aws_lb_target_        │
        │       group_attachment"               │
        │       (for_each = all_instances)      │
        └───────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │         AWS US-EAST-1 REGION          │
        │                                       │
        │  VPC: vpc-0f8670efa9e394cf3           │
        │  (172.31.0.0/16)                      │
        │                                       │
        │  ┌─────────────────────────────────┐  │
        │  │     PUBLIC SUBNET 1a             │  │
        │  │ (subnet-003fd1f4046a6b641)       │  │
        │  │                                 │  │
        │  │  ┌─────────┐  ┌─────────┐      │  │
        │  │  │ Bastion │  │ CORE    │      │  │
        │  │  │  (t3)   │  │  (t3)   │      │  │
        │  │  └─────────┘  └─────────┘      │  │
        │  │  ┌─────────┐  ┌─────────┐      │  │
        │  │  │Monitoring│  │API-Gate │      │  │
        │  │  │  (t3)   │  │  (t3)   │      │  │
        │  │  └─────────┘  └─────────┘      │  │
        │  └─────────────────────────────────┘  │
        │                                       │
        │  ┌─────────────────────────────────┐  │
        │  │     PUBLIC SUBNET 1b             │  │
        │  │ (subnet-00865aa51057ed7b4)       │  │
        │  │                                 │  │
        │  │  ┌─────────┐  ┌─────────┐      │  │
        │  │  │Frontend │  │Notif    │      │  │
        │  │  │  (t3)   │  │  (t3)   │      │  │
        │  │  └─────────┘  └─────────┘      │  │
        │  │  ┌─────────┐  ┌─────────┐      │  │
        │  │  │Messaging│  │Reportes │      │  │
        │  │  │  (t3)   │  │  (t3)   │      │  │
        │  │  └─────────┘  └─────────┘      │  │
        │  └─────────────────────────────────┘  │
        │                                       │
        │  Security Group: sg-04f3d554d6dc9e304 │
        │  (Allows port 80 from ALB)            │
        │                                       │
        │  ┌──────────────────────────────────┐ │
        │  │  APPLICATION LOAD BALANCER       │ │
        │  │  (proyecto-acompanamiento-alb)   │ │
        │  │                                  │ │
        │  │  DNS: alb-xxx.us-east-1.        │ │
        │  │       elb.amazonaws.com          │ │
        │  │                                  │ │
        │  │  Target Group:                   │ │
        │  │  tg-acompanamiento (port 80)    │ │
        │  │                                  │ │
        │  │  Targets: 8 EC2 instances        │ │
        │  │  Health Check: HTTP/80           │ │
        │  └──────────────────────────────────┘ │
        │                                       │
        └───────────────────────────────────────┘
```

## Flujo de Idempotencia

### Ciclo 1: Creación Inicial

```
START
  │
  ├─ Terraform Init
  │  └─ Descargar providers AWS
  │
  ├─ Data Source: aws_instances (buscar existentes)
  │  └─ Query: "¿Hay instancias con estos nombres?"
  │  └─ Respuesta: 0 encontradas
  │
  ├─ Locals: instances_to_create
  │  └─ Calcular: TODOS (8) faltan
  │
  ├─ Resource: aws_instance.app
  │  ├─ for_each = instances_to_create (8 items)
  │  ├─ CREATE EC2-Bastion (t3.medium)
  │  ├─ CREATE EC2-CORE (t3.medium)
  │  ├─ CREATE EC2-Monitoring (t3.medium)
  │  ├─ CREATE EC2-API-Gateway (t3.medium)
  │  ├─ CREATE EC2-Frontend (t3.medium)
  │  ├─ CREATE EC2-Notificaciones (t3.medium)
  │  ├─ CREATE EC2-Messaging (t3.medium)
  │  └─ CREATE EC2-Reportes (t3.medium)
  │
  ├─ Locals: all_instance_ids
  │  └─ Merge: all 8 newly created instances
  │
  ├─ Resource: aws_lb_target_group_attachment
  │  └─ for_each = all_instance_ids (8 items)
  │  └─ ATTACH cada instancia al ALB
  │
  ├─ Output: deployment_summary
  │  └─ existing_count: 0
  │  └─ newly_created: 8
  │  └─ instances_created: [all 8 names]
  │
  └─ END
  
  Resultado: ✅ 8 instancias creadas
```

### Ciclo 2: Validación de Idempotencia

```
START
  │
  ├─ Terraform Init
  │  └─ (reutiliza state)
  │
  ├─ Data Source: aws_instances (buscar existentes)
  │  └─ Query: "¿Hay instancias con estos nombres?"
  │  └─ Respuesta: 8 encontradas (EC2-Bastion, EC2-CORE, ...)
  │
  ├─ Locals: instances_to_create
  │  └─ Calcular: 8 ya existen, 0 faltan
  │
  ├─ Resource: aws_instance.app
  │  ├─ for_each = instances_to_create (0 items)
  │  └─ (nada que crear)
  │
  ├─ Locals: all_instance_ids
  │  └─ Merge: 8 existentes (sin nuevas)
  │
  ├─ Resource: aws_lb_target_group_attachment
  │  └─ for_each = all_instance_ids (8 items)
  │  └─ 8 ya estaban attachadas (no hay cambios)
  │
  ├─ Output: deployment_summary
  │  └─ existing_count: 8
  │  └─ newly_created: 0
  │  └─ instances_created: [] (lista vacía)
  │
  └─ END
  
  Resultado: ✅ NO HAY CAMBIOS (idempotencia confirmada)
```

## Componentes del Sistema

### 1. Local Development Loop

```
┌─────────────────────────────────────────┐
│ Developer Workstation                   │
│                                         │
│ PowerShell Console                      │
│ ├─ deploy-idempotent.ps1               │
│ │  ├─ Status: Ver estado actual        │
│ │  ├─ Plan: Ver cambios futuros        │
│ │  ├─ Apply: Ejecutar cambios          │
│ │  └─ Destroy: Eliminar todo           │
│ │                                      │
│ └─ validate-idempotence.ps1             │
│    ├─ RUN 1: Crea recursos             │
│    └─ RUN 2: Valida idempotencia       │
│                                         │
│ Terraform Directory                    │
│ ├─ main.tf (infraestructura)           │
│ ├─ variables.tf (configuración)        │
│ ├─ outputs.tf (salidas)                │
│ └─ .terraform/ (plugins)               │
│                                         │
│ AWS CLI                                 │
│ └─ ~/.aws/credentials (STS token)      │
└─────────────────────────────────────────┘
```

### 2. GitHub Actions CI/CD Loop

```
┌──────────────────────────────────────────────┐
│ GitHub Repository                            │
│ arielguerron14/Proyecto-Acompa-amiento-     │
│                                              │
│ .github/workflows/deploy-terraform.yml       │
│ ├─ Trigger: workflow_dispatch (manual)       │
│ │                                            │
│ ├─ Input selector:                           │
│ │  ├─ plan (generar plan, no aplicar)        │
│ │  ├─ apply (crear/actualizar)               │
│ │  ├─ destroy (eliminar todo)                │
│ │  └─ status (mostrar estado)                │
│ │                                            │
│ ├─ Jobs:                                     │
│ │  └─ deploy:                                │
│ │     ├─ runs-on: ubuntu-latest              │
│ │     ├─ steps: 15 pasos                     │
│ │     └─ outputs: resumen deployment        │
│ │                                            │
│ └─ Secrets (3):                             │
│    ├─ AWS_ACCESS_KEY_ID                     │
│    ├─ AWS_SECRET_ACCESS_KEY                 │
│    └─ AWS_SESSION_TOKEN                     │
└──────────────────────────────────────────────┘
```

### 3. Terraform State Management

```
┌────────────────────────────────────┐
│ Terraform State                    │
│ (terraform.tfstate)                │
│                                    │
│ Schema versioning:                 │
│ ├─ Format: JSON                    │
│ ├─ Version: 4                      │
│ └─ Locked: NO (for CI/CD)          │
│                                    │
│ Resources tracked:                 │
│ ├─ aws_instance[app]               │
│ │  └─ 8 instancias (0-7)           │
│ │                                  │
│ ├─ aws_lb_target_group_            │
│ │  attachment[app]                 │
│ │  └─ 8 attachments                │
│ │                                  │
│ └─ data sources (read-only):       │
│    ├─ aws_instances                │
│    ├─ aws_lb                       │
│    └─ aws_lb_target_group          │
└────────────────────────────────────┘
```

## Variables y Outputs

### Entrada (terraform/variables.tf)

```hcl
instance_names = [
  "EC2-Bastion",
  "EC2-CORE",
  "EC2-Monitoring",
  "EC2-API-Gateway",
  "EC2-Frontend",
  "EC2-Notificaciones",
  "EC2-Messaging",
  "EC2-Reportes"
]

instance_type = "t3.medium"
ami = "ami-0c02fb55956c7d316"  # Ubuntu 22.04
vpc_id = "vpc-0f8670efa9e394cf3"
subnets = [
  "subnet-003fd1f4046a6b641",  # us-east-1a
  "subnet-00865aa51057ed7b4"   # us-east-1b
]
security_group_id = "sg-04f3d554d6dc9e304"
```

### Salida (terraform/outputs.tf)

```hcl
deployment_summary {
  total_instances = 8
  existing_count = 0-8 (depends)
  newly_created = 0-8 (depends)
  instances_created = ["EC2-Bastion", ...]
  all_instances = [all 8 names]
}

instance_details {
  EC2-Bastion = {
    id = "i-0d12345678901234"
    ip = "172.31.x.x"
    state = "running"
    type = "t3.medium"
  }
  ... (7 más)
}

alb_information {
  dns_name = "proyecto-acompanamiento-alb-xxx.elb.amazonaws.com"
  url = "http://proyecto-acompanamiento-alb-xxx.elb.amazonaws.com"
  target_group_arn = "arn:aws:elasticloadbalancing:..."
  registered_targets = 8
}

idempotence_check {
  is_idempotent = true/false
  message = "✓ All instances exist..." OR "⚠ Creating X missing..."
}
```

## Ciclo Típico de Operación

### Día 1: Despliegue Inicial

```
Morning: DevOps Engineer
  1. Lee DEPLOYMENT_IDEMPOTENT_GUIDE.md
  2. Configura credenciales: aws configure
  3. Ejecuta: .\deploy-idempotent.ps1 -Action status
  4. Ejecuta: .\deploy-idempotent.ps1 -Action plan
  5. Revisa cambios (8 new instances)
  6. Ejecuta: .\deploy-idempotent.ps1 -Action apply
  7. Espera ~3 minutos
  8. Verifica en AWS Console: 8 instances running
  
Afternoon: Deployments started
  1. Docker imágenes se despliegan en instancias
  2. Health checks pasan: 8/8 healthy
  3. ALB recibe tráfico
```

### Día 2: Mantenimiento

```
Morning: Verificar estado
  1. Ejecuta: .\deploy-idempotent.ps1 -Action status
  2. Muestra: 8 instances running, 8/8 healthy
  3. Todo bien, no hay cambios requeridos

Midday: Agregar instancia
  1. Edita: terraform/variables.tf
  2. Agrega: "EC2-NewService" a instance_names
  3. Ejecuta: .\deploy-idempotent.ps1 -Action plan
  4. Muestra: 1 new instance to create
  5. Ejecuta: .\deploy-idempotent.ps1 -Action apply
  6. Crea SOLO la nueva (las otras no se tocan)
  7. Resultado: 9 instances, 9/9 healthy
```

### Día 3: Validación Regular

```
Morning: Ejecutar validación de idempotencia
  1. .\validate-idempotence.ps1
  2. RUN 1: Detiene cualquier cambio que debería existir
  3. RUN 2: Valida que NO hace cambios innecesarios
  4. Resultado: ✅ Sistema idempotente confirmado
```

---

**Diagrama actualizado**: 2024
**Sistema**: Totalmente idempotente
**Estado**: Listo para producción
