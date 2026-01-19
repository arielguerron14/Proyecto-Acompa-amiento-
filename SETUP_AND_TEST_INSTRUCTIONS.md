# 🚀 INSTRUCCIONES PARA LEVANTAR SERVICIOS Y EJECUTAR PRUEBAS

## ⚡ OPCIÓN 1: Rápida (Recomendada)

### Paso 1: Disparar Deployment
```bash
cd C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-

# Disparar el workflow de deployment
gh workflow run deploy-py-orchestrator.yml --ref main

# Esperar 2-5 minutos a que los servicios se levanten
```

### Paso 2: Verificar Servicios Disponibles
```bash
# Ejecutar este comando cada 30 segundos hasta que vea respuestas positivas
$api = "98.86.94.92:8080"
curl -s "http://$api/health"
```

### Paso 3: Ejecutar Pruebas
Una vez que el API Gateway responda, ejecutar:

```bash
. .\test-app-flows.ps1
```

---

## 📋 OPCIÓN 2: Manual (Si Opción 1 Falla)

### Paso 1: Verificar Instancias EC2
```bash
# Verificar estado de todas las instancias
aws ec2 describe-instances --region us-east-1 \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \
  --output table
```

Buscar que todos los `State` sean `running`.

### Paso 2: Verificar Bastion Específicamente
```bash
# El Bastion debe tener estado "running"
aws ec2 describe-instances --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1 \
  --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]'
```

Si el estado NO es `running`:
```bash
# Iniciar Bastion
aws ec2 start-instances --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1

# Esperar a que inicie
aws ec2 wait instance-running --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1

# Esperar 1 minuto adicional para que el SSH daemon inicie
Start-Sleep -Seconds 60
```

### Paso 3: Iniciar Resto de Instancias si es Necesario
```bash
# Iniciar todas las instancias (si están stopped)
aws ec2 start-instances --region us-east-1 --instance-ids \
  i-03ce33456b5a432c7 \
  i-0573caa61d3434773 \
  i-00ec97a11d97ec816 \
  i-051b99befe53d8653 \
  i-0b0de88edecb142fb \
  i-048232c6d4879895f \
  i-018e35ab30ab78c7e

# Esperar a que todas inicien
Start-Sleep -Seconds 120
```

### Paso 4: Disparar Deployment
```bash
gh workflow run deploy-py-orchestrator.yml --ref main

# Monitorear progreso
gh run list --workflow="deploy-py-orchestrator.yml" --limit 1
```

### Paso 5: Esperar y Probar
```bash
# Esperar 3-5 minutos
Start-Sleep -Seconds 300

# Probar conectividad
curl "http://98.86.94.92:8080/health"

# Si responde OK, ejecutar pruebas
. .\test-app-flows.ps1
```

---

## 🔧 OPCIÓN 3: Usar AWS Systems Manager (Si SSH No Funciona)

### Paso 1: Conectarse a EC2-Bastion vía SSM
```bash
# Usar Session Manager de AWS
aws ssm start-session --target i-0g7h8i9j0k1l2m3n --region us-east-1

# Desde la sesión, verificar docker
docker ps
docker-compose ps

# Si no hay contenedores, iniciarlos manualmente
docker-compose up -d
```

### Paso 2: Hacer lo Mismo con Otras Instancias
```bash
# Para cada instancia:
aws ssm start-session --target <INSTANCE_ID> --region us-east-1
```

---

## 🧪 VERIFICACIÓN RÁPIDA DE SERVICIOS

Sin esperar al deployment, verificar qué servicios podrían estar disponibles:

```bash
$services = @(
    @{name="API Gateway"; url="http://98.86.94.92:8080/health"},
    @{name="EC2-CORE"; url="http://3.236.99.88:3000/health"},
    @{name="Frontend"; url="http://52.72.57.10/"},
    @{name="Monitoring"; url="http://54.205.158.101:9090"},
)

foreach ($svc in $services) {
    try {
        $resp = Invoke-WebRequest -Uri $svc.url -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $($svc.name) - ONLINE" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($svc.name) - OFFLINE" -ForegroundColor Red
    }
}
```

---

## 📊 TIMELINE ESPERADO

| Paso | Tiempo | Acción |
|------|--------|--------|
| 0:00 | Inmediato | `gh workflow run deploy-py-orchestrator.yml` |
| 0:30 | - | Workflow inicia en GitHub Actions |
| 1:00 | - | SSH conecta a Bastion |
| 1:30 | - | Docker-compose inicia en cada instancia |
| 2:00 | - | Contenedores iniciando |
| 2:30 | - | Servicios levantándose |
| 3:00 | - | Primeros servicios respondiendo |
| 4:00 | - | Todos los servicios deberían estar UP |
| 4:30 | ✅ Ejecutar | `. .\test-app-flows.ps1` |

---

## 🚨 TROUBLESHOOTING

### Si el Deployment Falla con "Connection timed out"

**Problema**: `Error: Connection timed out during banner exchange`

**Solución**:
1. Verificar Bastion está corriendo: `aws ec2 describe-instances --instance-ids i-0g7h8i9j0k1l2m3n`
2. Si NO está `running`, iniciar: `aws ec2 start-instances --instance-ids i-0g7h8i9j0k1l2m3n`
3. Esperar 2 minutos
4. Reintentar deployment

### Si el API Gateway No Responde

**Problema**: `curl: Connection refused`

**Solución**:
1. Verificar instancia EC2-API-Gateway está corriendo
2. SSH a la instancia (vía Bastion)
3. Ejecutar: `docker ps`
4. Si no hay contenedores: `docker-compose up -d`

### Si Las Pruebas Fallan por Timeout

**Problema**: `Connection timed out after 30 seconds`

**Solución**:
1. Aumentar timeout en `test-app-flows.ps1`
2. Cambiar línea: `TimeoutSec = 30` → `TimeoutSec = 60`
3. Reintentar

---

## 📝 CHECKLIST COMPLETO

Antes de ejecutar pruebas, asegurar:

- [ ] AWS CLI configurado (`aws configure`)
- [ ] GitHub CLI configurado (`gh auth login`)
- [ ] Acceso a repositorio GitHub (`gh repo list`)
- [ ] Todas las instancias EC2 en estado `running`
- [ ] Bastion accesible (verificado con `aws ssm`)
- [ ] SSH key disponible en GitHub Secrets (`gh secret list`)
- [ ] Workflow disponible (`gh workflow list`)
- [ ] Network tiene conectividad a AWS (probado con ping a S3)

---

## 🎯 COMANDOS RÁPIDOS

```bash
# Ver todas las instancias
aws ec2 describe-instances --region us-east-1 \
  --filters "Name=tag:Name,Values=EC2-*" \
  --query 'Reservations[*].Instances[*].[Tags[0].Value,State.Name]' \
  --output table

# Iniciar TODAS las instancias
aws ec2 start-instances --region us-east-1 \
  --instance-ids i-03ce33456b5a432c7 i-0573caa61d3434773 i-00ec97a11d97ec816 \
  i-051b99befe53d8653 i-0b0de88edecb142fb i-048232c6d4879895f \
  i-018e35ab30ab78c7e i-0g7h8i9j0k1l2m3n

# Disparar deployment
gh workflow run deploy-py-orchestrator.yml

# Monitorear progreso
watch 'gh run list --workflow="deploy-py-orchestrator.yml" --limit 1'

# Ejecutar pruebas (cuando esté listo)
. .\test-app-flows.ps1

# Ver logs del deployment
gh run list --workflow="deploy-py-orchestrator.yml" --limit 1 | awk '{print $1}' | \
  xargs -I {} gh run view {} --log
```

---

## ✅ CUÁNDO ESTÁ LISTO

Los servicios están listos cuando:

1. ✅ `gh run list` muestra `conclusion: success` para el workflow
2. ✅ `curl http://98.86.94.92:8080/health` retorna `200 OK`
3. ✅ Todos los servicios responden en sus puertos
4. ✅ El script `test-app-flows.ps1` ejecuta sin errores

---

**Tiempo estimado total**: 5-10 minutos desde el `gh workflow run`

¡Listo para probar!
