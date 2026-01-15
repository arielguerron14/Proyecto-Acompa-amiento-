# 🚀 QUICK START CHECKLIST

## Pre-requisitos
- [ ] Tienes acceso a tu cuenta AWS
- [ ] Tienes credenciales AWS (Access Key + Secret Key)
- [ ] Tienes tu clave privada EC2 (.pem)
- [ ] Tienes permisos en tu repositorio GitHub para modificar Settings

---

## PASO 1: Preparar GitHub Secrets (5 minutos)

### Opción A: Usando Script Interactivo (Recomendado)

```bash
cd /ruta/a/tu/proyecto
python3 setup-github-secrets.py
```

El script te pedirá:
1. AWS Access Key ID
2. AWS Secret Access Key
3. AWS Session Token (opcional)
4. Path a tu clave SSH (.pem)

Output: Verás los valores listos para copiar

### Opción B: Manual

**Preparar la clave SSH:**

PowerShell:
```powershell
$keyContent = Get-Content -Path "C:\Users\ariel\tu-key.pem" -Raw
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($keyContent))
$encoded | Set-Clipboard
echo "SSH key copied to clipboard (base64)"
```

**Agregar Secrets a GitHub:**

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Agrega cada uno:

```
Name: AWS_ACCESS_KEY_ID
Value: [tu access key]

Name: AWS_SECRET_ACCESS_KEY
Value: [tu secret key]

Name: AWS_SESSION_TOKEN (si usas temp credentials)
Value: [tu session token]

Name: SSH_PRIVATE_KEY
Value: [el valor base64 de tu clave, pega con Ctrl+V]
```

Verifica que todos los secrets estén presentes:
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] AWS_SESSION_TOKEN (opcional)
- [ ] SSH_PRIVATE_KEY

---

## PASO 2: Etiquetar Instancias EC2 (2 minutos)

**Para CADA instancia EC2:**

1. Abre AWS Console → EC2 → Instances
2. Haz click en una instancia (ej: i-015e5f170f8d6f5a9)
3. Ve a la pestaña **Tags**
4. Click en **Manage tags**
5. Agrega una tag:
   - Key: `Name`
   - Value: `EC2-CORE` (o el nombre apropiado)
6. Click **Save**

**Nombres esperados:**
```
EC2-CORE          → para tu CORE instance
EC2-API-GATEWAY   → para API Gateway
EC2-DB            → para base de datos
EC2-FRONTEND      → para frontend
EC2-BASTION       → para bastion
EC2-MESSAGING     → para messaging
EC2-MONITORING    → para monitoring
```

Verifica:
- [ ] EC2-CORE tiene tag Name="EC2-CORE"
- [ ] EC2-API-GATEWAY tiene tag Name="EC2-API-GATEWAY"
- [ ] (Otras instancias según corresponda)

---

## PASO 3: Verificar Permisos IAM (3 minutos)

**Verifica que tu usuario AWS pueda hacer:**

```bash
aws ec2 describe-instances --region us-east-1
# Debe retornar tus instancias sin error
```

**Si da error "not authorized":**

Ve a AWS Console → IAM → Users → Tu usuario

Click en "Add permissions" → "Attach policies"

Busca y agrega:
- [ ] `AmazonEC2ReadOnlyAccess` (mínimo necesario)

O crea una política custom:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    }
  ]
}
```

- [ ] Usuario tiene permisos para `ec2:DescribeInstances`
- [ ] Usuario tiene permisos para `ec2:DescribeTags`

---

## PASO 4: Ejecutar Workflow (5 minutos)

1. Ve a tu repositorio en GitHub
2. Click en **Actions**
3. Busca **Deploy to EC2 (Dynamic IP Discovery)**
4. Click en **Run workflow**
5. Completa los parámetros:
   ```
   Instance to deploy: EC2_CORE
   Rebuild Docker images: true
   Where to build images: ec2
   Environment: prod
   ```
6. Click en **Run workflow**

Espera a que se complete (normalmente 10-15 minutos)

- [ ] Workflow ejecutado exitosamente
- [ ] Todas las etapas completadas (verde ✅)

---

## PASO 5: Verificar Despliegue (5 minutos)

**En GitHub Actions:**

Ve a la ejecución del workflow y revisa:
- [ ] "Get EC2 IPs (Dynamic Discovery)" → Encontró la instancia
- [ ] "Setup SSH" → Conexión establecida
- [ ] "Build Docker Images on EC2" → Imágenes construidas
- [ ] "Verify deployment" → Servicios corriendo

**Verificación Manual:**

```bash
# SSH a tu instancia
ssh -i "tu-key.pem" ubuntu@3.236.51.29

# Ver servicios corriendo
docker-compose ps
# Output:
# NAME                   STATUS
# mongo                  Up X seconds
# postgres               Up X seconds
# micro-auth             Up X seconds
# micro-estudiantes      Up X seconds
# micro-maestros         Up X seconds
# micro-reportes-est     Up X seconds
# micro-reportes-maest   Up X seconds

# Ver logs
docker-compose logs --tail 50
```

- [ ] Todos los contenedores están "Up"
- [ ] No hay errores en los logs
- [ ] Ports están expuestos correctamente

---

## PASO 6: Probar Comunicación (5 minutos)

**Dentro de EC2-CORE:**

```bash
# SSH a EC2-CORE
ssh -i "tu-key.pem" ubuntu@3.236.51.29

# Probar micro-auth localmente
curl http://localhost:3000/health
# Output: {"status":"OK"} o similar

# Probar via Private IP (como lo haría API-GATEWAY)
curl http://172.31.79.241:3000/health
# Output: {"status":"OK"}
```

**Desde EC2-API-GATEWAY:**

```bash
# SSH a API-GATEWAY
ssh -i "tu-key.pem" ubuntu@52.7.168.4

# Probar conectividad a CORE via Private IP
curl http://172.31.79.241:3000/health
# Output: {"status":"OK"}

# Si usas API-GATEWAY container:
curl http://localhost:8080/health
# Output: {"status":"OK"}
```

- [ ] Micro-servicios responden en CORE
- [ ] API-GATEWAY puede alcanzar CORE via IP privada
- [ ] Todos los endpoints retornan 200 OK

---

## PASO 7: Desplegar API-GATEWAY (si es necesario)

Repite el workflow pero esta vez:
```
Instance to deploy: EC2_API_GATEWAY
```

- [ ] API-GATEWAY deployed y corriendo
- [ ] Conecta a CORE services correctamente

---

## STEP 8: Documentación (Para después)

Lee estos archivos para entender mejor:

- [ ] `SOLUTION_SUMMARY.md` - Resumen de qué se hizo
- [ ] `WORKFLOW_SETUP.md` - Guía completa de setup
- [ ] `IP_ROUTING_STRATEGY.md` - Teoría de routing IP

---

## ✅ CHECKLIST FINAL

- [ ] Secrets configurados en GitHub
- [ ] Instancias etiquetadas con tags Name
- [ ] IAM user tiene permisos necesarios
- [ ] Workflow ejecutado sin errores
- [ ] Contenedores están corriendo
- [ ] Pruebas de conectividad pasaron
- [ ] API Gateway comunicándose con CORE
- [ ] Documentación leída y entendida

---

## 🆘 Si algo falla...

### Error: "No running instance found matching filter"

```bash
# Verifica que tu instancia:
1. Esté en estado "running" (verde en AWS Console)
2. Tenga el tag Name configurado correctamente
3. Esté en la región correcta (us-east-1)

aws ec2 describe-instances \
  --region us-east-1 \
  --query 'Reservations[].Instances[].{Name:Tags[?Key==`Name`].Value|[0],State:State.Name}'
```

### Error: "SSH access denied" o "Permission denied"

```bash
# Verifica que SSH_PRIVATE_KEY está bien encode en base64
# El archivo .pem debe estar en base64 sin saltos de línea

# Si usas PowerShell, verifica que está todo en una línea:
[Convert]::ToBase64String(...) | Set-Clipboard
```

### Error: "AWS credentials not configured"

```bash
# Verifica secrets en GitHub:
# Settings → Secrets and variables → Actions

# Debe haber:
✓ AWS_ACCESS_KEY_ID
✓ AWS_SECRET_ACCESS_KEY
```

### Servicios en "Exited" state

```bash
# SSH a la instancia y revisa logs:
ssh ubuntu@3.236.51.29

docker-compose logs [service-name]
# Busca el error específico

# Reinicia servicios:
docker-compose down
docker-compose up -d
```

---

## 📞 Próximos pasos después de esto

Una vez todo funcione:

1. Integra con tu CI/CD (automatic deploys on push)
2. Configura alertas en CloudWatch
3. Establece backups automáticos
4. Documenta procesos de mantenimiento

---

**¿Preguntas?** Revisa los archivos de documentación:
- WORKFLOW_SETUP.md - Configuración
- IP_ROUTING_STRATEGY.md - Teoría de red
- .github/workflows/deploy.yml - Código del workflow

**¡Listo para comenzar!** 🚀
