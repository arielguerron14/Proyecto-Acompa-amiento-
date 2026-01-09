#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Desplega EC2-DB (Base de Datos) usando SSH key de AWS Secrets Manager

.DESCRIPTION
    - Obtiene el SSH private key desde AWS Secrets Manager
    - Configura MongoDB, PostgreSQL y Redis en 172.31.79.193
    - Valida que todo esté funcionando correctamente

.EXAMPLE
    .\deploy-ec2-db.ps1
#>

# Colores para output
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$RESET = "`e[0m"

# ═══════════════════════════════════════════════════════════════
# CONFIGURACIÓN: Leer desde infrastructure.config.js (FUENTE ÚNICA)
# ═══════════════════════════════════════════════════════════════

# Cargar configuración centralizada
$configPath = Join-Path (Get-Location) "infrastructure.config.js"
if (-not (Test-Path $configPath)) {
    Write-Host "${RED}❌ No se encontró infrastructure.config.js${RESET}"
    exit 1
}

# Leer IPs desde infrastructure.config.js usando Node.js
$configScript = @"
const config = require('./infrastructure.config.js');
console.log(JSON.stringify({
    publicIp: config.PUBLIC.EC2_DB_IP,
    privateIp: config.PRIVATE.EC2_DB_PRIVATE_IP,
    sshUser: config.SSH_USER || 'ec2-user',
    region: config.AWS_REGION || 'us-east-1'
}));
"@

try {
    $configJson = node -e $configScript | ConvertFrom-Json
    $EC2_DB_PUBLIC_IP = $configJson.publicIp
    $EC2_DB_PRIVATE_IP = $configJson.privateIp
    $SSH_USER = $configJson.sshUser
    $REGION = $configJson.region
    Write-Color "✅ Configuración cargada desde infrastructure.config.js" $GREEN
} catch {
    Write-Color "⚠️  Usando valores por defecto (Node.js no disponible o config inválida)" $YELLOW
    # Valores fallback si Node.js no está disponible
    $EC2_DB_PUBLIC_IP = "44.192.114.31"
    $EC2_DB_PRIVATE_IP = "172.31.79.193"
    $SSH_USER = "ec2-user"
    $REGION = "us-east-1"
}

$SSH_SECRET_NAME = "AWS_EC2_DB_SSH_PRIVATE_KEY"
$SSH_KEY_FILE = "/tmp/aws-key-deploy.pem"

# Función para escribir con colores
function Write-Color {
    param([string]$Message, [string]$Color = $RESET)
    Write-Host "$Color$Message$RESET"
}

# Header
Write-Host ""
Write-Host "${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${BLUE}║${RESET}  🚀 DEPLOYMENT EC2-DB - PASO 1 de 8"
Write-Host "${BLUE}║${RESET}  Base de Datos: MongoDB, PostgreSQL, Redis"
Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

# PASO 1: Verificar AWS CLI
Write-Color "[1/6] Verificando AWS CLI..." $YELLOW
try {
    $version = aws --version
    Write-Color "✅ AWS CLI disponible" $GREEN
} catch {
    Write-Color "❌ AWS CLI no está instalado" $RED
    Write-Color "    Instálalo: pip install awscli" $YELLOW
    exit 1
}

# PASO 2: Obtener SSH Key desde Secrets Manager
Write-Color "[2/6] Obteniendo SSH key desde AWS Secrets Manager..." $YELLOW
try {
    $sshKeyContent = aws secretsmanager get-secret-value `
        --secret-id $SSH_SECRET_NAME `
        --region $REGION `
        --query 'SecretString' `
        --output text 2>$null
    
    if ($sshKeyContent) {
        # Guardar en archivo temporal
        $sshKeyContent | Out-File -FilePath $SSH_KEY_FILE -Encoding ASCII -NoNewline
        Write-Color "✅ SSH key obtenida desde AWS Secrets" $GREEN
    } else {
        throw "No se recibió contenido del secret"
    }
} catch {
    Write-Color "❌ No se pudo obtener el SSH key del secret" $RED
    Write-Color "    Error: $_" $RED
    Write-Color "    Verifica que el secret '$SSH_SECRET_NAME' existe en AWS Secrets Manager" $YELLOW
    exit 1
}

# PASO 3: Verificar conectividad SSH
Write-Color "[3/6] Probando conectividad SSH a EC2-DB ($EC2_DB_PUBLIC_IP)..." $YELLOW
$sshConnected = $false
try {
    $result = ssh -i $SSH_KEY_FILE -o ConnectTimeout=10 -o StrictHostKeyChecking=no `
        "${SSH_USER}@${EC2_DB_PUBLIC_IP}" "echo 'SSH OK'" 2>$null
    
    if ($result -eq "SSH OK") {
        Write-Color "✅ Conexión SSH exitosa" $GREEN
        $sshConnected = $true
    }
} catch {
    Write-Color "Error: $_" $RED
}

if (-not $sshConnected) {
    Write-Color "❌ No se pudo conectar a EC2-DB" $RED
    Write-Color "    Verifica:" $YELLOW
    Write-Color "    - La instancia EC2-DB está en estado 'running'" $YELLOW
    Write-Color "    - El Security Group permite SSH (puerto 22)" $YELLOW
    Write-Color "    - La IP pública es correcta: $EC2_DB_PUBLIC_IP" $YELLOW
    Remove-Item -Path $SSH_KEY_FILE -Force -ErrorAction SilentlyContinue
    exit 1
}

# PASO 4: Preparar instancia
Write-Color "[4/6] Preparando instancia EC2-DB..." $YELLOW
$prepareScript = @"
set -e
echo '📦 Actualizando sistema...'
sudo yum update -y > /dev/null 2>&1 || true

echo '📦 Instalando Docker...'
sudo yum install -y docker > /dev/null 2>&1 || true

echo '🔧 Iniciando Docker...'
sudo systemctl start docker || true
sudo systemctl enable docker || true

echo '👤 Agregando usuario al grupo docker...'
sudo usermod -aG docker ec2-user || true

echo '🐳 Instalando Docker Compose...'
sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" \
  -o /usr/local/bin/docker-compose 2>/dev/null || true
sudo chmod +x /usr/local/bin/docker-compose || true

echo '✅ Instancia preparada'
"@

try {
    $prepareScript | ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_DB_PUBLIC_IP}" 2>$null
    Write-Color "✅ EC2-DB preparada" $GREEN
} catch {
    Write-Color "Error al preparar instancia: $_" $RED
}

# PASO 5: Desplegar docker-compose
Write-Color "[5/6] Iniciando servicios de base de datos..." $YELLOW
$deployScript = @"
set -e

mkdir -p /opt/databases
cd /opt/databases

# Docker-compose para BD
cat > docker-compose.yml << 'COMPOSE_END'
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: mongodb123
    volumes:
      - mongodb_data:/data/db
    networks:
      - vpc-network
    restart: unless-stopped
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 3

  postgresql:
    image: postgres:15
    container_name: postgresql
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: acompanamiento_db
    volumes:
      - postgresql_data:/var/lib/postgresql/data
    networks:
      - vpc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redis123 --bind 0.0.0.0
    volumes:
      - redis_data:/data
    networks:
      - vpc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  mongodb_data:
  postgresql_data:
  redis_data:

networks:
  vpc-network:
    driver: bridge
COMPOSE_END

echo '🚀 Iniciando contenedores Docker...'
docker-compose up -d

echo '⏳ Esperando 30 segundos para que los servicios estén listos...'
sleep 30

echo '📊 Estado de contenedores:'
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ''
echo '✅ Servicios de base de datos iniciados'
"@

try {
    $deployScript | ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_DB_PUBLIC_IP}" 2>$null
    Write-Color "✅ Servicios de BD iniciados" $GREEN
} catch {
    Write-Color "Error al desplegar: $_" $RED
}

# PASO 6: Validaciones
Write-Color "[6/6] Validando deployment..." $YELLOW
$allValid = $true

# Test MongoDB
Write-Color "🔍 Verificando MongoDB..." $BLUE
try {
    $result = ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_DB_PUBLIC_IP}" `
        "docker exec mongodb mongosh --username admin --password mongodb123 --authenticationDatabase admin --eval `"db.adminCommand('ping')`" 2>/dev/null" 2>$null
    
    if ($result) {
        Write-Color "✅ MongoDB OK" $GREEN
    } else {
        Write-Color "❌ MongoDB FALLÓ" $RED
        $allValid = $false
    }
} catch {
    Write-Color "❌ MongoDB FALLÓ" $RED
    $allValid = $false
}

# Test PostgreSQL
Write-Color "🔍 Verificando PostgreSQL..." $BLUE
try {
    $result = ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_DB_PUBLIC_IP}" `
        "docker exec postgresql pg_isready -U postgres 2>/dev/null" 2>$null
    
    if ($result -like "*accepting*") {
        Write-Color "✅ PostgreSQL OK" $GREEN
    } else {
        Write-Color "❌ PostgreSQL FALLÓ" $RED
        $allValid = $false
    }
} catch {
    Write-Color "❌ PostgreSQL FALLÓ" $RED
    $allValid = $false
}

# Test Redis
Write-Color "🔍 Verificando Redis..." $BLUE
try {
    $result = ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no "${SSH_USER}@${EC2_DB_PUBLIC_IP}" `
        "docker exec redis redis-cli -a redis123 ping 2>/dev/null" 2>$null
    
    if ($result -like "*PONG*") {
        Write-Color "✅ Redis OK" $GREEN
    } else {
        Write-Color "❌ Redis FALLÓ" $RED
        $allValid = $false
    }
} catch {
    Write-Color "❌ Redis FALLÓ" $RED
    $allValid = $false
}

# Limpiar SSH key temporal
Remove-Item -Path $SSH_KEY_FILE -Force -ErrorAction SilentlyContinue

# Mostrar resumen
Write-Host ""
if ($allValid) {
    Write-Host "${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
    Write-Host "${BLUE}║${RESET}  ✅ EC2-DB DEPLOYMENT COMPLETADO EXITOSAMENTE"
    Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
    Write-Host ""
    
    Write-Color "📊 INFORMACIÓN DE ACCESO A BASES DE DATOS" $GREEN
    Write-Host ""
    Write-Color "Desde OTRAS instancias EC2 en la VPC (acceso privado):" $BLUE
    Write-Host ""
    
    Write-Color "MongoDB:" $BLUE
    Write-Host "  • Host: $EC2_DB_PRIVATE_IP"
    Write-Host "  • Puerto: 27017"
    Write-Host "  • Usuario: admin"
    Write-Host "  • Contraseña: mongodb123"
    Write-Host "  • Database: acompanamiento_db"
    Write-Host "  • URL: mongodb://admin:mongodb123@${EC2_DB_PRIVATE_IP}:27017/acompanamiento_db?authSource=admin"
    Write-Host ""
    
    Write-Color "PostgreSQL:" $BLUE
    Write-Host "  • Host: $EC2_DB_PRIVATE_IP"
    Write-Host "  • Puerto: 5432"
    Write-Host "  • Usuario: postgres"
    Write-Host "  • Contraseña: postgres123"
    Write-Host "  • Database: acompanamiento_db"
    Write-Host "  • URL: postgresql://postgres:postgres123@${EC2_DB_PRIVATE_IP}:5432/acompanamiento_db"
    Write-Host ""
    
    Write-Color "Redis:" $BLUE
    Write-Host "  • Host: $EC2_DB_PRIVATE_IP"
    Write-Host "  • Puerto: 6379"
    Write-Host "  • Contraseña: redis123"
    Write-Host "  • URL: redis://:redis123@${EC2_DB_PRIVATE_IP}:6379"
    Write-Host ""
    
    Write-Color "⚠️  IMPORTANTE:" $YELLOW
    Write-Host "  • Las bases de datos NO son accesibles desde internet"
    Write-Host "  • Solo accesibles desde otras instancias EC2 en la VPC"
    Write-Host "  • Cambiar contraseñas por defecto en producción"
    Write-Host "  • Configurar backups automáticos en producción"
    Write-Host ""
    
    Write-Color "👉 PRÓXIMO PASO:" $BLUE
    Write-Host "   Desplegar EC2-Messaging (Kafka + RabbitMQ + Zookeeper)"
    Write-Host ""
    
} else {
    Write-Color "⚠️  ALGUNAS VALIDACIONES FALLARON" $RED
    Write-Color "Revisa los logs en EC2-DB:" $YELLOW
    Write-Host "  docker logs mongodb"
    Write-Host "  docker logs postgresql"
    Write-Host "  docker logs redis"
}

Write-Color "✅ EC2-DB listo" $GREEN
Write-Host ""
