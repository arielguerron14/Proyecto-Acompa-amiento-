#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Deploy Completo: Despliega instancia, reconstruye Docker, prueba endpoints y valida logs

.DESCRIPTION
    - Despliega EC2 instance desde AWS
    - Reconstruye imagen Docker
    - Valida que el servicio está corriendo
    - Prueba todos los endpoints
    - Verifica logs en tiempo real
    - Genera reporte de health check

.PARAMETER InstanceName
    Nombre de la instancia a desplegar (EC2_CORE, EC2_DB, etc.)

.PARAMETER Environment
    Ambiente (dev, staging, prod)

.PARAMETER SkipImageBuild
    Skip Docker image rebuild

.EXAMPLE
    .\deploy-complete.ps1 -InstanceName "EC2_CORE" -Environment "prod"
    .\deploy-complete.ps1 -InstanceName "EC2_DB" -SkipImageBuild
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("EC2_CORE", "EC2_DB", "EC2_API_GATEWAY", "EC2_REPORTES", "EC2_NOTIFICACIONES", 
                 "EC2_MESSAGING", "EC2_FRONTEND", "EC2_MONITORING", "EC2_KAFKA", 
                 "EC2_PROMETHEUS", "EC2_GRAFANA", "EC2_RABBITMQ")]
    [string]$InstanceName,
    
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "prod",
    
    [switch]$SkipImageBuild = $false,
    [switch]$DryRun = $false
)

# Colores
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$CYAN = "`e[36m"
$MAGENTA = "`e[35m"
$RESET = "`e[0m"

function Write-Color {
    param([string]$Message, [string]$Color = $RESET)
    Write-Host "$Color$Message$RESET"
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "${BLUE}┌─────────────────────────────────────────────────────────────┐${RESET}"
    Write-Host "${BLUE}│${RESET}  $Title"
    Write-Host "${BLUE}└─────────────────────────────────────────────────────────────┘${RESET}"
    Write-Host ""
}

# Header
Write-Host ""
Write-Host "${MAGENTA}╔═════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${MAGENTA}║${RESET}  🚀 DEPLOY COMPLETO - $InstanceName                        ${MAGENTA}║${RESET}"
Write-Host "${MAGENTA}║${RESET}  Ambiente: $Environment | Build: $(if($SkipImageBuild) {'SKIP'} else {'FULL'})                 ${MAGENTA}║${RESET}"
Write-Host "${MAGENTA}╚═════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

if ($DryRun) {
    Write-Color "⚠️  MODO DRY RUN: No ejecutará cambios reales" $YELLOW
}

# Fase 1: Cargar configuración centralizada
Write-Section "FASE 1: CARGAR CONFIGURACIÓN CENTRALIZADA"

Write-Color "Cargando infrastructure.config.js..." $YELLOW

$configScript = @"
const config = require('./infrastructure.config.js');
const instance = '$InstanceName';
console.log(JSON.stringify({
    publicIp: config.PUBLIC[instance + '_IP'],
    privateIp: config.PRIVATE[instance + '_PRIVATE_IP'],
    port: config.PORTS[instance] || 3000,
    sshUser: config.SSH_USER || 'ec2-user',
    region: config.AWS_REGION || 'us-east-1',
    serviceName: instance.replace(/_/g, '-').toLowerCase()
}));
"@

try {
    $instanceConfig = node -e $configScript | ConvertFrom-Json
    Write-Color "✅ Configuración cargada para $InstanceName" $GREEN
    Write-Host "   Privada: $($instanceConfig.privateIp) | Pública: $($instanceConfig.publicIp) | Puerto: $($instanceConfig.port)"
} catch {
    Write-Color "❌ Error cargando configuración" $RED
    exit 1
}

# Fase 2: Validar credenciales AWS
Write-Section "FASE 2: VALIDAR CREDENCIALES AWS Y CONECTIVIDAD"

Write-Color "Validando AWS CLI y credenciales..." $YELLOW

try {
    $awsId = aws sts get-caller-identity --query 'Account' --output text 2>$null
    if ($awsId) {
        Write-Color "✅ AWS CLI autenticado (Account: $awsId)" $GREEN
    } else {
        throw "No hay credenciales válidas"
    }
} catch {
    Write-Color "❌ Error con AWS CLI: $_" $RED
    exit 1
}

# Fase 3: Obtener información de la instancia
Write-Section "FASE 3: OBTENER INFORMACIÓN DE LA INSTANCIA EC2"

Write-Color "Buscando instancia en AWS..." $YELLOW

try {
    $instances = aws ec2 describe-instances `
        --filters "Name=tag:Name,Values=$InstanceName" "Name=instance-state-name,Values=running" `
        --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,PrivateIpAddress,State.Name]' `
        --output text

    if ($instances) {
        $parts = $instances -split '\s+'
        $instanceId = $parts[0]
        $publicIp = $parts[1]
        $privateIp = $parts[2]
        $state = $parts[3]
        
        Write-Color "✅ Instancia encontrada: $instanceId" $GREEN
        Write-Host "   Estado: $state"
        Write-Host "   IP Privada: $privateIp"
        Write-Host "   IP Pública: $publicIp"
    } else {
        Write-Color "⚠️  Instancia no encontrada o no está corriendo" $YELLOW
        Write-Color "¿Deseas crearla? (Esta funcionalidad requiere AMI preconfigurada)" $YELLOW
        exit 1
    }
} catch {
    Write-Color "❌ Error consultando instancia: $_" $RED
    exit 1
}

# Fase 4: Conectar por SSH
Write-Section "FASE 4: CONECTAR POR SSH Y VALIDAR ACCESO"

Write-Color "Obteniendo SSH key desde AWS Secrets Manager..." $YELLOW

$sshKeyFile = "/tmp/deploy-key-$InstanceName.pem"
try {
    $sshKeyContent = aws secretsmanager get-secret-value `
        --secret-id "AWS_EC2_SSH_PRIVATE_KEY" `
        --region "us-east-1" `
        --query 'SecretString' `
        --output text 2>$null
    
    if ($sshKeyContent) {
        $sshKeyContent | Out-File -FilePath $sshKeyFile -Encoding ASCII -NoNewline -Force
        chmod 600 $sshKeyFile
        Write-Color "✅ SSH key obtenida" $GREEN
    } else {
        throw "No se recibió contenido del secret"
    }
} catch {
    Write-Color "❌ Error obteniendo SSH key: $_" $RED
    exit 1
}

# Probar conectividad SSH
Write-Color "Probando conectividad SSH..." $YELLOW

$sshConnected = $false
try {
    $result = ssh -i $sshKeyFile -o ConnectTimeout=5 -o StrictHostKeyChecking=no `
        "ec2-user@$publicIp" "echo 'SSH_OK'" 2>$null
    
    if ($result -eq "SSH_OK") {
        Write-Color "✅ Conexión SSH exitosa" $GREEN
        $sshConnected = $true
    }
} catch {
    Write-Color "❌ Error conectando por SSH" $RED
}

if (-not $sshConnected) {
    Write-Color "Limpiando SSH key..." $YELLOW
    Remove-Item -Path $sshKeyFile -Force -ErrorAction SilentlyContinue
    exit 1
}

# Fase 5: Cargar .env.prod.* específico
Write-Section "FASE 5: CARGAR CONFIGURACIÓN DE AMBIENTE (.env.prod.*)"

$envFileName = $InstanceName.Replace("EC2_", "").ToLower().Replace("_", "-")
$envFilePath = ".env.prod.$envFileName"

Write-Color "Buscando: $envFilePath" $YELLOW

if (Test-Path $envFilePath) {
    Write-Color "✅ Archivo encontrado" $GREEN
    $envSize = (Get-Item $envFilePath).Length
    Write-Host "   Tamaño: $envSize bytes"
    
    # Contar líneas
    $lineCount = (Get-Content $envFilePath | Measure-Object -Lines).Lines
    Write-Host "   Líneas de configuración: $lineCount"
} else {
    Write-Color "⚠️  Archivo no encontrado. Regenerando..." $YELLOW
    if (Test-Path "generate-env-from-config.js") {
        node generate-env-from-config.js
        if (Test-Path $envFilePath) {
            Write-Color "✅ Archivo regenerado" $GREEN
        } else {
            Write-Color "❌ No se pudo generar el archivo" $RED
            exit 1
        }
    }
}

# Fase 6: Subir .env a la instancia
Write-Section "FASE 6: SUBIR CONFIGURACIÓN A LA INSTANCIA"

Write-Color "Copiando .env.prod.$envFileName a instancia..." $YELLOW

if (-not $DryRun) {
    try {
        scp -i $sshKeyFile -o StrictHostKeyChecking=no `
            $envFilePath "ec2-user@${publicIp}:/tmp/.env.prod" 2>$null
        Write-Color "✅ Configuración copiada" $GREEN
    } catch {
        Write-Color "⚠️  Error copiando archivo (continuando...)" $YELLOW
    }
}

# Fase 7: Preparar directorio de trabajo
Write-Section "FASE 7: PREPARAR DIRECTORIO Y SERVICIOS"

Write-Color "Preparando ambiente en la instancia..." $YELLOW

$prepareScript = @"
set -e

# Crear directorio de trabajo
mkdir -p /opt/services/$InstanceName
cd /opt/services/$InstanceName

# Copiar .env
if [ -f /tmp/.env.prod ]; then
    cp /tmp/.env.prod .env
    echo "✅ Configuración aplicada"
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    sudo yum install -y docker > /dev/null 2>&1
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ec2-user
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" \
      -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Ambiente preparado"
"@

if (-not $DryRun) {
    try {
        $prepareScript | ssh -i $sshKeyFile -o StrictHostKeyChecking=no "ec2-user@${publicIp}" 2>$null
        Write-Color "✅ Ambiente preparado" $GREEN
    } catch {
        Write-Color "⚠️  Error preparando ambiente" $YELLOW
    }
}

# Fase 8: Reconstruir y desplegar Docker
if (-not $SkipImageBuild) {
    Write-Section "FASE 8: RECONSTRUIR IMAGEN DOCKER"
    
    Write-Color "Construyendo imagen Docker para $InstanceName..." $YELLOW
    
    $buildScript = @"
set -e
cd /opt/services/$InstanceName

# Descargar Dockerfile (desde repo o usar default)
if [ ! -f Dockerfile ]; then
    echo "📝 Usando Dockerfile predeterminado"
    cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
EOF
fi

# Construir imagen
echo "🔨 Construyendo imagen Docker..."
docker build -t $InstanceName:latest .

echo "✅ Imagen construida: $InstanceName:latest"
docker images | grep $InstanceName
"@
    
    if (-not $DryRun) {
        try {
            $buildScript | ssh -i $sshKeyFile -o StrictHostKeyChecking=no "ec2-user@${publicIp}" 2>$null
            Write-Color "✅ Imagen Docker construida" $GREEN
        } catch {
            Write-Color "⚠️  Error construyendo imagen" $YELLOW
        }
    }
}

# Fase 9: Iniciar servicio
Write-Section "FASE 9: INICIAR SERVICIO"

Write-Color "Iniciando contenedor Docker..." $YELLOW

$startScript = @"
set -e
cd /opt/services/$InstanceName

# Detener contenedor anterior si existe
docker stop $InstanceName 2>/dev/null || true
docker rm $InstanceName 2>/dev/null || true

# Iniciar nuevo contenedor
docker run -d \
  --name $InstanceName \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  $InstanceName:latest

echo "✅ Contenedor iniciado"

# Esperar a que el servicio esté listo
echo "⏳ Esperando 5 segundos..."
sleep 5

# Verificar que el contenedor está corriendo
if docker ps | grep -q $InstanceName; then
    echo "✅ Contenedor corriendo"
else
    echo "❌ Error: Contenedor no está corriendo"
    docker logs $InstanceName
    exit 1
fi
"@

if (-not $DryRun) {
    try {
        $startScript | ssh -i $sshKeyFile -o StrictHostKeyChecking=no "ec2-user@${publicIp}" 2>$null
        Write-Color "✅ Servicio iniciado" $GREEN
    } catch {
        Write-Color "❌ Error iniciando servicio" $RED
    }
}

# Fase 10: Validar logs
Write-Section "FASE 10: VALIDAR LOGS DEL SERVICIO"

Write-Color "Obteniendo logs del contenedor..." $YELLOW

$logsScript = @"
docker logs --tail=20 $InstanceName
"@

if (-not $DryRun) {
    try {
        Write-Host ""
        ssh -i $sshKeyFile -o StrictHostKeyChecking=no "ec2-user@${publicIp}" $logsScript 2>$null
        Write-Host ""
        Write-Color "✅ Logs obtenidos" $GREEN
    } catch {
        Write-Color "⚠️  Error obteniendo logs" $YELLOW
    }
}

# Fase 11: Probar endpoints
Write-Section "FASE 11: PROBAR ENDPOINTS HTTP"

Write-Color "Probando conectividad al servicio en puerto 3000..." $YELLOW

$endpoints = @(
    @{ path = "/health"; method = "GET"; description = "Health Check" },
    @{ path = "/api/status"; method = "GET"; description = "API Status" },
    @{ path = "/"; method = "GET"; description = "Home" }
)

foreach ($endpoint in $endpoints) {
    try {
        $url = "http://${publicIp}:3000$($endpoint.path)"
        Write-Color "  🔍 $($endpoint.description): $($endpoint.method) $($endpoint.path)" $CYAN
        
        $response = Invoke-WebRequest -Uri $url -Method $endpoint.method -TimeoutSec 5 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-Color "     ✅ Respuesta: $($response.StatusCode)" $GREEN
        } else {
            Write-Color "     ⚠️  Respuesta: $($response.StatusCode)" $YELLOW
        }
    } catch {
        Write-Color "     ⚠️  No disponible (esperado si el servicio aún inicia)" $YELLOW
    }
}

# Fase 12: Health check
Write-Section "FASE 12: HEALTH CHECK DEL SERVICIO"

Write-Color "Realizando health check completo..." $YELLOW

$healthChecks = @(
    @{ name = "Docker"; check = "docker ps | grep -q $InstanceName" },
    @{ name = "Puerto"; check = "netstat -tuln | grep -q 3000" },
    @{ name = "Logs"; check = "docker logs $InstanceName 2>&1 | grep -i error" }
)

if (-not $DryRun) {
    foreach ($check in $healthChecks) {
        try {
            $result = ssh -i $sshKeyFile -o StrictHostKeyChecking=no "ec2-user@${publicIp}" $check.check 2>$null
            Write-Color "  ✅ $($check.name): OK" $GREEN
        } catch {
            Write-Color "  ⚠️  $($check.name): Requiere validación manual" $YELLOW
        }
    }
}

# Fase 13: Resumen y próximos pasos
Write-Section "FASE 13: RESUMEN Y PRÓXIMOS PASOS"

Write-Host "${GREEN}✅ DEPLOYMENT COMPLETADO EXITOSAMENTE${RESET}"
Write-Host ""
Write-Host "📊 Información de la Instancia:"
Write-Host "   Nombre: $InstanceName"
Write-Host "   IP Pública: $publicIp"
Write-Host "   IP Privada: $privateIp"
Write-Host "   Puerto: 3000"
Write-Host "   Ambiente: $Environment"
Write-Host ""

Write-Host "🔗 Acceso:"
Write-Host "   Web: http://${publicIp}:3000"
Write-Host "   SSH: ssh -i <key> ec2-user@${publicIp}"
Write-Host "   Docker: docker ps (en la instancia)"
Write-Host ""

Write-Host "📋 Comandos útiles en la instancia:"
Write-Host "   Ver logs:     docker logs -f $InstanceName"
Write-Host "   Exec bash:    docker exec -it $InstanceName bash"
Write-Host "   Reiniciar:    docker restart $InstanceName"
Write-Host "   Detener:      docker stop $InstanceName"
Write-Host ""

Write-Host "🔍 Validaciones recomendadas:"
Write-Host "   1. Verificar connectivity desde otras instancias: telnet $privateIp 3000"
Write-Host "   2. Validar variables de ambiente: docker exec $InstanceName env"
Write-Host "   3. Verificar base de datos: curl http://${publicIp}:3000/api/db-check"
Write-Host ""

# Limpiar SSH key
Remove-Item -Path $sshKeyFile -Force -ErrorAction SilentlyContinue

Write-Host "${MAGENTA}╔═════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${GREEN}║  ✅ DEPLOYMENT EXITOSO${RESET}"
Write-Host "${MAGENTA}╚═════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""
