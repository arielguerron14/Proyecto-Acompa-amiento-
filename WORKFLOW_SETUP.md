# GitHub Actions Workflow Setup Guide

## Overview

El workflow ahora **detecta automáticamente las IPs de las instancias EC2** en tu cuenta AWS y se configura dinámicamente. Esto significa que **no necesitas actualizar IPs manualmente** cuando las instancias se reinician.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                      │
│                                                                 │
│  1. Configure AWS Credentials (from secrets)                   │
│  2. Query AWS EC2 API → Find running instances by name/tag     │
│  3. Extract Public IP (for SSH) & Private IP (for routing)     │
│  4. SSH via Public IP → Configure with Private IP             │
│  5. Build, Deploy, Verify                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Network Communication Strategy

```
PUBLIC INTERNET
     ↓
┌─────────────────┐                    ┌─────────────────┐
│  GitHub Actions │ ─(SSH via Public)─→│   EC2 Instance  │
│  Runner         │                    │   Public IP     │
└─────────────────┘                    └────────┬────────┘
                                                 │
                                       ┌─────────▼────────┐
                                       │  Docker Services │
                                       │  Listen on 0.0.0.0
                                       │  (Private IP)    │
                                       └──────────────────┘
```

### Within VPC (Inter-Instance Communication)

```
EC2-API-GATEWAY (Private IP: 172.31.79.241)
         │
         │ Uses PRIVATE IP of EC2-CORE
         │ (172.31.79.241 → microservices ports)
         ↓
EC2-CORE Services (Private IP: 172.31.79.241)
         │
         ├─ micro-auth:3000
         ├─ micro-estudiantes:3001
         ├─ micro-maestros:3002
         ├─ micro-reportes:5003-5004
         └─ MongoDB/PostgreSQL
```

## Required GitHub Secrets

Configure estos secretos en tu repositorio GitHub: **Settings → Secrets and variables → Actions**

### 1. AWS Credentials (Requerido)

```bash
AWS_ACCESS_KEY_ID
# Your AWS access key ID

AWS_SECRET_ACCESS_KEY
# Your AWS secret access key

AWS_SESSION_TOKEN
# (Optional) If using temporary credentials with session token
# Example from your message:
# IQoJb3JpZ2luX2VjEHEaCXVzLXdlc3QtMiJHMEUCIQDbvP...
```

**¿Cómo obtener estas credenciales?**

1. Ir a AWS Console → IAM → Users → Tu usuario
2. Crear una clave de acceso en "Access keys"
3. Copiar Access Key ID y Secret Access Key
4. (Opcional) Si usas credenciales temporales, copiar el Session Token

**IMPORTANTE**: Estas credenciales deben tener permisos para:
- `ec2:DescribeInstances`
- `ec2:DescribeTags`

### 2. SSH Private Key (Requerido)

```bash
SSH_PRIVATE_KEY
# Tu clave privada EC2 en formato BASE64
```

**¿Cómo preparar la clave?**

```bash
# En PowerShell (tu caso):
$keyContent = Get-Content -Path "C:\ruta\a\tu\key.pem" -Raw
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($keyContent))
$encoded | Set-Clipboard

# Luego pega en GitHub Secrets → SSH_PRIVATE_KEY
```

Alternativamente, desde WSL/Git Bash:
```bash
cat ~/path/to/your/key.pem | base64 -w 0 | xclip -selection clipboard
```

## How the Workflow Works

### Step 1: AWS Credentials Configuration
```yaml
- Configure AWS credentials
  → Sets up AWS CLI with your credentials from secrets
```

### Step 2: Dynamic IP Discovery
```yaml
- Get EC2 IPs (Dynamic Discovery)
  → Queries AWS EC2 API
  → Finds running instances matching instance type (by name/tag)
  → Extracts:
     • Public IP (172.31.79.241 in your example)
     • Private IP (172.31.79.241 in your example)
     • Instance ID
     • Instance Name
```

### Step 3: SSH Connection
```yaml
- Setup SSH
  → Uses public IP from Step 2
  → Authenticates with SSH key from secrets
  → Adds host to known_hosts
```

### Step 4: Configuration Update
```yaml
- Update Configuration with IPs
  → For API Gateway: Updates .env with CORE private IP
  → For CORE: Uses internal Docker network (localhost)
  → Replaces hardcoded IPs with dynamic values
```

### Step 5: Build & Deploy
```yaml
- Build Docker Images on EC2 (with Dynamic IP Configuration)
  → SSHs to EC2 via PUBLIC IP
  → Clones latest code from GitHub
  → Updates configs with PRIVATE IP
  → Builds Docker images
  → Starts services via docker-compose
```

### Step 6: Verification
```yaml
- Verify deployment
  → Checks docker-compose ps
  → Shows logs
  → Confirms all services are running
```

## Instance Naming/Tagging Strategy

El workflow busca instancias EC2 por nombre (tag: Name). Asegúrate de que tus instancias estén etiquetadas correctamente:

```
Tag: Name = "EC2-CORE"         → Matched by filter "core"
Tag: Name = "EC2-API-GATEWAY"  → Matched by filter "api-gateway"
Tag: Name = "EC2-DB"           → Matched by filter "database|db"
Tag: Name = "EC2-FRONTEND"     → Matched by filter "frontend"
Tag: Name = "EC2-MESSAGING"    → Matched by filter "messaging"
Tag: Name = "EC2-MONITORING"   → Matched by filter "monitoring"
Tag: Name = "EC2-BASTION"      → Matched by filter "bastion"
```

**¿Cómo establecer tags en AWS?**

1. AWS Console → EC2 → Instances
2. Selecciona tu instancia
3. Tags tab → Add Tag
4. Key: `Name`
5. Value: `EC2-CORE` (o el nombre apropiado)

## Using the Workflow

### Option 1: Manual Trigger (GitHub Actions)

1. Ve a **GitHub → Actions → Deploy to EC2 (Dynamic IP Discovery)**
2. Click **"Run workflow"**
3. Selecciona:
   - **Instance to deploy**: `EC2_CORE`, `EC2_API_GATEWAY`, etc.
   - **Rebuild Docker images**: `true` o `false`
   - **Where to build**: `ec2` (recomendado)
   - **Environment**: `prod`, `staging`, `dev`
4. Click **Run workflow**

El workflow automáticamente:
- ✅ Detectará las IPs públicas y privadas
- ✅ Se conectará via SSH usando la IP pública
- ✅ Configurará servicios usando la IP privada
- ✅ Desplegará y verificará todo

### Option 2: Command Line (GitHub CLI)

```bash
gh workflow run deploy.yml \
  -f instance=EC2_CORE \
  -f rebuild_docker=true \
  -f build_location=ec2 \
  -f environment=prod
```

## Troubleshooting

### Error: "No running instance found matching filter"

**Causa**: La instancia no existe, está detenida, o no tiene el tag correcto.

**Solución**:
1. Verifica que la instancia esté **running** (estado verde en AWS Console)
2. Verifica que tenga el tag `Name` correcto
3. Revisa AWS Console → EC2 → Instances → Tags

### Error: "SSH setup failed"

**Causa**: La clave privada no está en formato BASE64, o está malformada.

**Solución**:
```bash
# Verifica que la clave esté correctamente encoded
# En PowerShell:
$key = Get-Content -Path "key.pem" -Raw
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($key))
# $encoded debe ser una cadena larga, sin saltos de línea
```

### Error: "AWS credentials not configured"

**Causa**: Los secretos no están correctamente configurados.

**Solución**:
1. Ve a GitHub → Settings → Secrets and variables → Actions
2. Verifica que existan:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `SSH_PRIVATE_KEY`
3. (Opcional) `AWS_SESSION_TOKEN` si usas credenciales temporales

### Services not starting on EC2

**Verifica en el workflow output**:
- ✅ Revisa los logs del workflow
- ✅ SSH a la instancia manualmente: `ssh -i key.pem ubuntu@PUBLIC_IP`
- ✅ Revisa docker-compose logs: `cd ~/app && docker-compose logs`

## Multi-Account Deployment

Para desplegar en diferentes cuentas AWS:

1. **Crea un repositorio / rama separada por cuenta**:
   ```
   main (production account)
   staging (staging account)
   dev (dev account)
   ```

2. **En cada rama, actualiza los secrets** para esa cuenta AWS:
   - GitHub → Settings → Environments → (create env) → Add secret
   - O usa el mismo repositorio pero diferente workflow por ambiente

3. **Ejecuta el workflow contra la rama correcta**

## Advanced: Custom Instance Filters

Si necesitas un filtro más específico, edita `.github/workflows/deploy.yml`:

```yaml
- name: Get EC2 IPs (Dynamic Discovery)
  id: get-ip
  run: |
    # Cambiar el case statement para tus filtros
    case "$INSTANCE" in
      EC2_CUSTOM)
        INSTANCE_FILTER="tu-filtro-customizado"
        ;;
      ...
```

## Security Best Practices

1. ✅ **Usa credenciales temporales** (Session Token) cuando sea posible
2. ✅ **Limita permisos de IAM** solo a `ec2:DescribeInstances` + necesarios
3. ✅ **Almacena claves SSH en GitHub Secrets**, nunca en el código
4. ✅ **Usa ramas separadas** por ambiente/cuenta
5. ✅ **Rota credenciales regularmente** (especialmente si son compartidas)
6. ✅ **Audita accesos** en AWS CloudTrail

## Next Steps

1. ✅ Configura los secrets en GitHub (AWS credentials + SSH key)
2. ✅ Etiqueta tus instancias EC2 con tags `Name` correctos
3. ✅ Ejecuta el workflow desde GitHub Actions
4. ✅ Verifica que los servicios estén corriendo
5. ✅ Prueba la comunicación entre instancias

El workflow está listo para **desplegar automáticamente en cualquier cuenta AWS** sin necesidad de actualizar IPs manualmente.
