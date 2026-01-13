# 🎯 VISUAL GUIDE: Sistema de Despliegue en Pasos

## Estado Actual vs Estado Deseado

### ANTES DE EJECUTAR
```
╔════════════════════════════════════════════╗
║  AWS US-EAST-1                             ║
║                                            ║
║  EC2 Instances: 0                          ║
║  ALB Targets:   0                          ║
║  Health Status: N/A                        ║
║                                            ║
╚════════════════════════════════════════════╝
```

### DESPUÉS DE EJECUTAR apply
```
╔════════════════════════════════════════════╗
║  AWS US-EAST-1                             ║
║                                            ║
║  EC2 Instances: 8                          ║
║  ├─ EC2-Bastion        (running)           ║
║  ├─ EC2-CORE           (running)           ║
║  ├─ EC2-Monitoring     (running)           ║
║  ├─ EC2-API-Gateway    (running)           ║
║  ├─ EC2-Frontend       (running)           ║
║  ├─ EC2-Notificaciones (running)           ║
║  ├─ EC2-Messaging      (running)           ║
║  └─ EC2-Reportes       (running)           ║
║                                            ║
║  ALB Targets: 8/8 healthy                  ║
║  Health Status: All Green ✅               ║
║                                            ║
║  URL: http://proyecto-acompanamiento-     ║
║       alb-xxx.us-east-1.elb.amazonaws.com ║
║                                            ║
╚════════════════════════════════════════════╝
```

---

## Flujo Paso a Paso

### PASO 1️⃣: Abrir PowerShell

```
┌─────────────────────────────────────────────┐
│ Windows Start Menu                          │
│                                             │
│ Escribir: PowerShell                        │
│ Click en: Windows PowerShell                │
│ (o mejor aún: Windows Terminal)             │
│                                             │
│ Abrirse PowerShell                          │
└─────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────┐
│ PowerShell 7.x.x                            │
│ PS C:\Users\ariel>                          │
│                                             │
│ ✅ Listo para comandos                      │
└─────────────────────────────────────────────┘
```

### PASO 2️⃣: Navegar a carpeta del proyecto

```
Ejecutar en PowerShell:

PS C:\Users\ariel> cd Escritorio/distri/Proyecto-Acompa-amiento-

PS C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-> 

✅ Estás en la carpeta correcta
```

### PASO 3️⃣: Ver estado actual

```
Ejecutar:

PS> .\deploy-idempotent.ps1 -Action status

Resultado esperado:

╔════════════════════════════════════════════╗
║     STATUS DEL DEPLOYMENT                  ║
╚════════════════════════════════════════════╝

Instancias EC2:
  ⚠️  No hay instancias creadas

Load Balancer:
  • Nombre: proyecto-acompanamiento-alb
  • Estado: active
  • DNS: proyecto-acompanamiento-alb-xxx.elb...
  • URL: http://proyecto-acompanamiento-alb-xxx.elb...

Target Group Health: 0/0 saludables
```

**Interpretación:** Infraestructura vacía, lista para crear.

### PASO 4️⃣: Ver cambios (Plan)

```
Ejecutar:

PS> .\deploy-idempotent.ps1 -Action plan

Resultado esperado:

═══════════════════════════════════════════════════════════
CAMBIOS DETECTADOS:
═══════════════════════════════════════════════════════════
⚠️  Se detectaron 8 cambios:
  • aws_instance.app["EC2-Bastion"]: create
  • aws_instance.app["EC2-CORE"]: create
  • aws_instance.app["EC2-Monitoring"]: create
  • aws_instance.app["EC2-API-Gateway"]: create
  • aws_instance.app["EC2-Frontend"]: create
  • aws_instance.app["EC2-Notificaciones"]: create
  • aws_instance.app["EC2-Messaging"]: create
  • aws_instance.app["EC2-Reportes"]: create
═══════════════════════════════════════════════════════════

Salidas de Terraform:
  • alb_dns: proyecto-acompanamiento-alb-xxx.elb...
```

**Interpretación:** Se crearán 8 instancias. Está todo bien.

### PASO 5️⃣: Aplicar cambios (Apply)

```
Ejecutar:

PS> .\deploy-idempotent.ps1 -Action apply

Primera pregunta:
ADVERTENCIA: Esto creará/modificará recursos en AWS
Continuar? (s/n): s

Proceso:
  1. Genera plan
  2. Aplica cambios
  3. Crea 8 instancias (tarda ~5 minutos)
  4. Espera 10 segundos estabilización
  5. Muestra estado final
```

**Ejemplo de salida (durante creación):**

```
ℹ️  INFO: Ejecutando terraform apply...
ℹ️  INFO: Aplicando cambios...

aws_instance.app["EC2-Bastion"]: Creating...
aws_instance.app["EC2-Bastion"]: Still creating... [10s elapsed]
aws_instance.app["EC2-Bastion"]: Creation complete after 15s [id=i-0abc123...]

aws_instance.app["EC2-CORE"]: Creating...
[... más instancias ...]

✅ Terraform apply completado

Salidas de Terraform:
  • alb_dns: proyecto-acompanamiento-alb-xxx.elb...
  • deployment_summary: {existing_count=0, newly_created=8...}
  • instances_created: [EC2-Bastion, EC2-CORE, ...]

ℹ️  INFO: Deploy completado. Esperando estabilización...

╔════════════════════════════════════════════╗
║           STATUS DEL DEPLOYMENT             ║
╚════════════════════════════════════════════╝

Instancias EC2:
  • EC2-Bastion: i-0abc123 [running] IP: 172.31.1.10
  • EC2-CORE: i-0def456 [running] IP: 172.31.1.11
  • EC2-Monitoring: i-0ghi789 [running] IP: 172.31.1.12
  • EC2-API-Gateway: i-0jkl012 [running] IP: 172.31.1.13
  • EC2-Frontend: i-0mno345 [running] IP: 172.31.1.14
  • EC2-Notificaciones: i-0pqr678 [running] IP: 172.31.1.15
  • EC2-Messaging: i-0stu901 [running] IP: 172.31.1.16
  • EC2-Reportes: i-0vwx234 [running] IP: 172.31.1.17

Load Balancer:
  • Nombre: proyecto-acompanamiento-alb
  • Estado: active
  • DNS: proyecto-acompanamiento-alb-xxx.elb.amazonaws.com
  • URL: http://proyecto-acompanamiento-alb-xxx.elb.amazonaws.com

Target Group Health: 0/8 saludables
(⚠️  Esperando health checks, pueden tardar 2-3 minutos)
```

**Interpretación:** ✅ Instancias creadas, esperando health checks.

### PASO 6️⃣: Verificar salud (después de 3 minutos)

```
Esperar 2-3 minutos, luego ejecutar:

PS> .\deploy-idempotent.ps1 -Action status

Resultado esperado:

╔════════════════════════════════════════════╗
║           STATUS DEL DEPLOYMENT             ║
╚════════════════════════════════════════════╝

Instancias EC2:
  • EC2-Bastion: i-0abc123 [running] IP: 172.31.1.10
  • EC2-CORE: i-0def456 [running] IP: 172.31.1.11
  ... (8 total)

Load Balancer:
  • Nombre: proyecto-acompanamiento-alb
  • Estado: active
  • DNS: proyecto-acompanamiento-alb-xxx.elb.amazonaws.com
  • URL: http://proyecto-acompanamiento-alb-xxx.elb.amazonaws.com

Target Group Health: 8/8 saludables ✅
```

**Interpretación:** ✅ Todo listo. Infrastructure deployed successfully.

### PASO 7️⃣: Validar Idempotencia (opcional)

```
Ejecutar:

PS> .\validate-idempotence.ps1

Resultado esperado:

════════════════════════════════════════════════
PRIMER DESPLIEGUE (creación de infraestructura)
════════════════════════════════════════════════

Resultados de Terraform Plan #1:
  • Total de recursos: 16
  • Cambios detectados: 8
⚠️  Se crearán recursos:
    • aws_instance.app: 8 create
    ... (más recursos)

Aplicando cambios...
✅ Apply #1 completado

Esperando estabilización (10 segundos)...

════════════════════════════════════════════════
SEGUNDO DESPLIEGUE (validación de idempotencia)
════════════════════════════════════════════════

Resultados de Terraform Plan #2:
  • Total de recursos: 16
  • Cambios detectados: 0
✅ IDEMPOTENCIA EXITOSA - No hay cambios

╔════════════════════════════════════════════╗
║          RESUMEN DE VALIDACIÓN             ║
╚════════════════════════════════════════════╝

Despliegue 1 (Creación):
  • Cambios: 8

Despliegue 2 (Validación):
  • Cambios: 0

✅ SISTEMA IDEMPOTENTE VALIDADO
   El despliegue puede ejecutarse múltiples veces
   sin crear recursos duplicados
```

**Interpretación:** ✅ Sistema idempotente confirmado.

---

## Matriz de Decisiones

### "¿Qué comando ejecutar?"

```
┌─ Quiero ver el estado actual
│  └─ Ejecutar: .\deploy-idempotent.ps1 -Action status
│
├─ Quiero ver qué haría terraform sin aplicar
│  └─ Ejecutar: .\deploy-idempotent.ps1 -Action plan
│
├─ Quiero crear/actualizar infraestructura
│  └─ Ejecutar: .\deploy-idempotent.ps1 -Action apply
│     (Se pide confirmación)
│
├─ Quiero eliminar TODO (⚠️ cuidado)
│  └─ Ejecutar: .\deploy-idempotent.ps1 -Action destroy
│     (Se pide confirmación)
│
└─ Quiero validar que el sistema es idempotente
   └─ Ejecutar: .\validate-idempotence.ps1
      (Crea + valida automáticamente)
```

---

## Estados Posibles de Instancias

```
Estado: pending → (1-2 min) → running → (1-2 min) → healthy ✅

┌──────────────────────────────────────────────────────┐
│ pending: Instancia se está inicializando             │
│ └─ Docker se está instalando                         │
│                                                      │
│ running: Instancia ya está en AWS                    │
│ └─ Docker se está configurando                       │
│                                                      │
│ healthy: Instancia lista en ALB                      │
│ └─ Health checks pasaron                             │
│ └─ Tráfico puede llegar                              │
│                                                      │
│ unhealthy: Instancia falla health checks             │
│ └─ Problema con Docker                               │
│ └─ O puerto 80 bloqueado                             │
│                                                      │
│ stopped: Instancia parada (no cuesta tanta)          │
│ └─ Puede reiniciarse                                 │
│                                                      │
│ terminated: Instancia eliminada                      │
│ └─ No se puede recuperar                             │
└──────────────────────────────────────────────────────┘
```

---

## Colores en PowerShell

```
✅ GREEN = Todo bien, acción exitosa
❌ RED = Error, algo falló
⚠️  YELLOW = Advertencia, precaución
ℹ️  CYAN = Información, solo avisar
🔍 GRAY = Debug, detalles técnicos
```

---

## Ejemplos de Salida

### Salida "Todo bien" (status después de apply)

```
✅ Autenticado como: arn:aws:iam::497189141139:user/...
ℹ️  Buscando instancias existentes...
✅ Encontradas 8 instancias existentes
ℹ️  Verificando salud del Target Group...
ℹ️  Target Group Health: 8/8 saludables
```

### Salida "Problema" (credenciales expiradas)

```
❌ ERROR: No se pueden obtener credenciales AWS
ℹ️  Configura credenciales con: aws configure --profile default
```

### Salida "Plan" (cambios a crear)

```
ℹ️  Ejecutando terraform plan...
⚠️  Se detectaron 8 cambios:
  • aws_instance.app["EC2-Bastion"]: create
  • aws_instance.app["EC2-CORE"]: create
  ... (6 más)
```

---

## Cuándo verificar con AWS Console

```
Paso 1: Después de .\deploy-idempotent.ps1 -Action apply
└─ Ir a: EC2 Dashboard
   └─ Verificar: 8 instancias en "running"
   └─ Copiar: DNS del ALB

Paso 2: Después de 3 minutos
└─ Ir a: EC2 Dashboard → Target Groups
   └─ Verificar: 8 targets en "healthy"

Paso 3: Testing
└─ Copiar URL: http://alb-dns-name
└─ Abrir en browser
└─ Debería responder (cuando apps estén desplegadas)
```

---

**Guía visual completa para navegación sin problemas**
**Actualizada**: 2024
**Nivel**: Principiante a Intermedio
