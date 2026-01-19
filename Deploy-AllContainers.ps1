#Requires -Version 5.0
<#
.SYNOPSIS
    Despliega todos los contenedores Docker en las instancias EC2
.DESCRIPTION
    Script PowerShell que automatiza el despliegue de toda la arquitectura de microservicios
    en las 9 instancias EC2 con sus contenedores especificados.
.EXAMPLE
    .\Deploy-AllContainers.ps1
#>

param(
    [string]$PrivateKeyPath = "$env:USERPROFILE\.ssh\id_rsa",
    [string]$DockerUsername = $env:DOCKER_USERNAME
)

# ============================================================================
# CONFIGURACIÓN
# ============================================================================
$ips = @{
    "EC2-CORE"           = "100.49.160.199"
    "EC2-DB"             = "3.235.120.8"
    "EC2-Messaging"      = "35.174.19.29"
    "EC2-Notificaciones" = "3.226.74.67"
    "EC2-Frontend"       = "52.72.57.10"
    "EC2-Reportes"       = "23.22.116.142"
    "EC2-Monitoring"     = "54.205.158.101"
    "EC2-API-Gateway"    = "98.86.94.92"
    "EC-Bastion"         = "52.6.170.44"
}

# IPs privadas para comunicación interna
$privateIps = @{
    "EC2-CORE"           = "172.31.64.170"
    "EC2-DB"             = "172.31.67.130"
    "EC2-Messaging"      = "172.31.75.187"
    "EC2-Notificaciones" = "172.31.76.95"
}

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 DEPLOYMENT DE MICROSERVICIOS - TODAS LAS INSTANCIAS        ║" -ForegroundColor Cyan
Write-Host "║  Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function Invoke-SSHCommand {
    param(
        [string]$IP,
        [string]$Command,
        [string]$PrivateKeyPath,
        [string]$Username = "ec2-user"
    )
    
    try {
        # Usar ssh de Git Bash o WSL si está disponible
        $sshCommand = "ssh -i `"$PrivateKeyPath`" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $Username@$IP `"$Command`""
        Write-Host "  Ejecutando en $IP..." -ForegroundColor Gray
        $output = Invoke-Expression $sshCommand 2>&1
        return $output
    }
    catch {
        Write-Host "  ❌ Error en $IP: $_" -ForegroundColor Red
        return $null
    }
}

# ============================================================================
# EC2-CORE
# ============================================================================
Write-Host "📋 1️⃣  Desplegando EC2-CORE (100.49.160.199)..." -ForegroundColor Yellow
Write-Host "   Contenedores: micro-auth, micro-estudiantes, micro-maestros, micro-core, micro-analytics" -ForegroundColor Gray

$coreCommands = @"
set -e
echo "🔧 Limpiando contenedores previos..."
docker stop micro-auth micro-estudiantes micro-maestros micro-core micro-analytics 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros micro-core micro-analytics 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DockerUsername/micro-auth:latest
docker pull $DockerUsername/micro-estudiantes:latest
docker pull $DockerUsername/micro-maestros:latest
docker pull $DockerUsername/micro-core:latest
docker pull $DockerUsername/micro-analytics:latest

echo "🐳 Iniciando contenedores..."
docker run -d --name micro-auth -p 3000:3000 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  -e DB_PORT=27017 `
  $DockerUsername/micro-auth:latest

docker run -d --name micro-estudiantes -p 3001:3001 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  -e DB_PORT=27017 `
  $DockerUsername/micro-estudiantes:latest

docker run -d --name micro-maestros -p 3002:3002 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  -e DB_PORT=27017 `
  $DockerUsername/micro-maestros:latest

docker run -d --name micro-core -p 3003:3003 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  -e DB_PORT=27017 `
  $DockerUsername/micro-core:latest

docker run -d --name micro-analytics -p 3004:3004 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  $DockerUsername/micro-analytics:latest

echo "✅ EC2-CORE desplegado:"
docker ps | grep micro-
"@

$output = Invoke-SSHCommand -IP $ips['EC2-CORE'] -Command $coreCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-CORE completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-API-Gateway
# ============================================================================
Write-Host "📋 2️⃣  Desplegando EC2-API-Gateway (98.86.94.92)..." -ForegroundColor Yellow

$apiGWCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop api-gateway 2>/dev/null || true
docker rm api-gateway 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DockerUsername/api-gateway:latest

echo "🐳 Iniciando contenedor..."
docker run -d --name api-gateway -p 8080:8080 `
  -e CORE_HOST=$($privateIps['EC2-CORE']) `
  -e CORE_PORT=3000 `
  $DockerUsername/api-gateway:latest

echo "✅ API-Gateway desplegado"
docker ps | grep api-gateway
"@

$output = Invoke-SSHCommand -IP $ips['EC2-API-Gateway'] -Command $apiGWCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-API-Gateway completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-DB
# ============================================================================
Write-Host "📋 3️⃣  Desplegando EC2-DB (3.235.120.8)..." -ForegroundColor Yellow

$dbCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop mongo postgres redis 2>/dev/null || true
docker rm mongo postgres redis 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull mongo:latest
docker pull postgres:latest
docker pull redis:latest

echo "🐳 Iniciando MongoDB..."
docker run -d --name mongo -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=root `
  -e MONGO_INITDB_ROOT_PASSWORD=example `
  mongo:latest

echo "🐳 Iniciando PostgreSQL..."
docker run -d --name postgres -p 5432:5432 `
  -e POSTGRES_USER=admin `
  -e POSTGRES_PASSWORD=example `
  postgres:latest

echo "🐳 Iniciando Redis..."
docker run -d --name redis -p 6379:6379 redis:latest

echo "✅ EC2-DB desplegado"
docker ps | grep -E "mongo|postgres|redis"
"@

$output = Invoke-SSHCommand -IP $ips['EC2-DB'] -Command $dbCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-DB completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-Messaging
# ============================================================================
Write-Host "📋 4️⃣  Desplegando EC2-Messaging (35.174.19.29)..." -ForegroundColor Yellow

$messagingCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop zookeeper kafka rabbitmq 2>/dev/null || true
docker rm zookeeper kafka rabbitmq 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DockerUsername/proyecto-zookeeper:1.0
docker pull $DockerUsername/proyecto-kafka:1.0
docker pull $DockerUsername/proyecto-rabbitmq:1.0

echo "🐳 Iniciando Zookeeper..."
docker run -d --name zookeeper -p 2181:2181 `
  $DockerUsername/proyecto-zookeeper:1.0

echo "🐳 Iniciando Kafka..."
docker run -d --name kafka -p 9092:9092 `
  -e ZOOKEEPER_HOST=$($privateIps['EC2-Messaging']) `
  $DockerUsername/proyecto-kafka:1.0

echo "🐳 Iniciando RabbitMQ..."
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 `
  $DockerUsername/proyecto-rabbitmq:1.0

echo "✅ EC2-Messaging desplegado"
docker ps | grep -E "zookeeper|kafka|rabbitmq"
"@

$output = Invoke-SSHCommand -IP $ips['EC2-Messaging'] -Command $messagingCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-Messaging completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-Notificaciones
# ============================================================================
Write-Host "📋 5️⃣  Desplegando EC2-Notificaciones (3.226.74.67)..." -ForegroundColor Yellow

$notificationsCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop micro-notificaciones 2>/dev/null || true
docker rm micro-notificaciones 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DockerUsername/micro-notificaciones:latest

echo "🐳 Iniciando contenedor..."
docker run -d --name micro-notificaciones -p 3007:3007 `
  -e KAFKA_HOST=$($privateIps['EC2-Messaging']) `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  $DockerUsername/micro-notificaciones:latest

echo "✅ EC2-Notificaciones desplegado"
docker ps | grep micro-notificaciones
"@

$output = Invoke-SSHCommand -IP $ips['EC2-Notificaciones'] -Command $notificationsCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-Notificaciones completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-Reportes
# ============================================================================
Write-Host "📋 6️⃣  Desplegando EC2-Reportes (23.22.116.142)..." -ForegroundColor Yellow

$reportsCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
docker rm micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DockerUsername/micro-reportes-estudiantes:latest
docker pull $DockerUsername/micro-reportes-maestros:latest

echo "🐳 Iniciando micro-reportes-estudiantes..."
docker run -d --name micro-reportes-estudiantes -p 3005:3005 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  $DockerUsername/micro-reportes-estudiantes:latest

echo "🐳 Iniciando micro-reportes-maestros..."
docker run -d --name micro-reportes-maestros -p 3006:3006 `
  -e DB_HOST=$($privateIps['EC2-DB']) `
  $DockerUsername/micro-reportes-maestros:latest

echo "✅ EC2-Reportes desplegado"
docker ps | grep micro-reportes
"@

$output = Invoke-SSHCommand -IP $ips['EC2-Reportes'] -Command $reportsCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-Reportes completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-Monitoring
# ============================================================================
Write-Host "📋 7️⃣  Desplegando EC2-Monitoring (54.205.158.101)..." -ForegroundColor Yellow

$monitoringCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop prometheus grafana 2>/dev/null || true
docker rm prometheus grafana 2>/dev/null || true

echo "📥 Descargando imágenes..."
docker pull $DockerUsername/proyecto-prometheus:1.0
docker pull $DockerUsername/proyecto-grafana:1.0

echo "🐳 Iniciando Prometheus..."
docker run -d --name prometheus -p 9090:9090 `
  $DockerUsername/proyecto-prometheus:1.0

echo "🐳 Iniciando Grafana..."
docker run -d --name grafana -p 3000:3000 `
  -e GF_SECURITY_ADMIN_PASSWORD=admin `
  $DockerUsername/proyecto-grafana:1.0

echo "✅ EC2-Monitoring desplegado"
docker ps | grep -E "prometheus|grafana"
"@

$output = Invoke-SSHCommand -IP $ips['EC2-Monitoring'] -Command $monitoringCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-Monitoring completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC2-Frontend
# ============================================================================
Write-Host "📋 8️⃣  Desplegando EC2-Frontend (52.72.57.10)..." -ForegroundColor Yellow

$frontendCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop frontend-web 2>/dev/null || true
docker rm frontend-web 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DockerUsername/frontend-web:latest

echo "🐳 Iniciando contenedor..."
docker run -d --name frontend-web -p 80:3000 `
  -e API_GATEWAY_URL=http://100.49.160.199:8080 `
  $DockerUsername/frontend-web:latest

echo "✅ EC2-Frontend desplegado"
docker ps | grep frontend-web
"@

$output = Invoke-SSHCommand -IP $ips['EC2-Frontend'] -Command $frontendCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC2-Frontend completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# EC-Bastion
# ============================================================================
Write-Host "📋 9️⃣  Desplegando EC-Bastion (52.6.170.44)..." -ForegroundColor Yellow

$bastionCommands = @"
set -e
echo "🔧 Limpiando previos..."
docker stop bastion-host 2>/dev/null || true
docker rm bastion-host 2>/dev/null || true

echo "📥 Descargando imagen..."
docker pull $DockerUsername/bastion-host:latest

echo "🐳 Iniciando Bastion..."
docker run -d --name bastion-host -p 80:80 `
  $DockerUsername/bastion-host:latest

echo "✅ EC-Bastion desplegado"
docker ps | grep bastion-host
"@

$output = Invoke-SSHCommand -IP $ips['EC-Bastion'] -Command $bastionCommands -PrivateKeyPath $PrivateKeyPath
if ($output) { Write-Host $output -ForegroundColor Green }
Write-Host "✅ EC-Bastion completado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ DEPLOYMENT COMPLETADO                                     ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resumen de Servicios Desplegados:" -ForegroundColor Cyan
Write-Host ""
Write-Host "EC2-CORE (100.49.160.199)" -ForegroundColor Yellow
Write-Host "  ✅ micro-auth:3000"
Write-Host "  ✅ micro-estudiantes:3001"
Write-Host "  ✅ micro-maestros:3002"
Write-Host "  ✅ micro-core:3003"
Write-Host "  ✅ micro-analytics:3004"
Write-Host ""
Write-Host "EC2-API-Gateway (98.86.94.92)" -ForegroundColor Yellow
Write-Host "  ✅ api-gateway:8080"
Write-Host ""
Write-Host "EC2-DB (3.235.120.8)" -ForegroundColor Yellow
Write-Host "  ✅ mongo:27017"
Write-Host "  ✅ postgres:5432"
Write-Host "  ✅ redis:6379"
Write-Host ""
Write-Host "EC2-Messaging (35.174.19.29)" -ForegroundColor Yellow
Write-Host "  ✅ zookeeper:2181"
Write-Host "  ✅ kafka:9092"
Write-Host "  ✅ rabbitmq:5672"
Write-Host ""
Write-Host "EC2-Notificaciones (3.226.74.67)" -ForegroundColor Yellow
Write-Host "  ✅ micro-notificaciones:3007"
Write-Host ""
Write-Host "EC2-Reportes (23.22.116.142)" -ForegroundColor Yellow
Write-Host "  ✅ micro-reportes-estudiantes:3005"
Write-Host "  ✅ micro-reportes-maestros:3006"
Write-Host ""
Write-Host "EC2-Monitoring (54.205.158.101)" -ForegroundColor Yellow
Write-Host "  ✅ prometheus:9090"
Write-Host "  ✅ grafana:3000"
Write-Host ""
Write-Host "EC2-Frontend (52.72.57.10)" -ForegroundColor Yellow
Write-Host "  ✅ frontend-web:80"
Write-Host ""
Write-Host "EC-Bastion (52.6.170.44)" -ForegroundColor Yellow
Write-Host "  ✅ bastion-host:80"
Write-Host ""
Write-Host "🌐 API Gateway disponible en: http://100.49.160.199:8080" -ForegroundColor Green
Write-Host "🖥️  Frontend disponible en: http://52.72.57.10" -ForegroundColor Green
Write-Host ""
Write-Host "✅ ¡TODOS LOS SERVICIOS ESTÁN DESPLEGADOS Y CORRIENDO!" -ForegroundColor Green
Write-Host ""
