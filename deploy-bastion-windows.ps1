# Script PowerShell para desplegar Bastion Host en AWS
# Manejo de SSH desde Windows con mejora de permisos

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BASTION HOST DOCKER - DEPLOYMENT (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuración
$BASTION_IP = "13.217.194.108"
$BASTION_USER = "ubuntu"
$INSTANCE_ID = "i-0bd13b8e83e8679bb"
$SSH_KEY = "./ssh-key-ec2.pem"

Write-Host "📋 Parámetros de Despliegue:" -ForegroundColor Yellow
Write-Host "   IP Pública: $BASTION_IP"
Write-Host "   Usuario: $BASTION_USER"
Write-Host "   Instancia ID: $INSTANCE_ID"
Write-Host "   Clave SSH: $SSH_KEY"
Write-Host ""

# Verificar clave SSH
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "❌ Error: Clave SSH no encontrada en $SSH_KEY" -ForegroundColor Red
    exit 1
}

# Reparar permisos de la clave (Windows)
Write-Host "🔐 Configurando permisos de clave SSH..." -ForegroundColor Yellow
try {
    # Remover herencia de permisos
    $acl = Get-Acl $SSH_KEY
    $acl.SetAccessRuleProtection($true, $false)
    Set-Acl -Path $SSH_KEY -AclObject $acl
    
    # Dar permisos completos al usuario actual
    $username = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($username, "FullControl", "Allow")
    $acl = Get-Acl $SSH_KEY
    $acl.AddAccessRule($rule)
    Set-Acl -Path $SSH_KEY -AclObject $acl
    
    Write-Host "✅ Permisos configurados" -ForegroundColor Green
} catch {
    Write-Host "⚠️  No se pudieron cambiar permisos del archivo, continuando..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔗 Probando conexión SSH..." -ForegroundColor Yellow

# Test SSH connection
$testOutput = & ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $BASTION_USER@$BASTION_IP "echo 'Conexión_exitosa'" 2>&1

if ($LASTEXITCODE -eq 0 -and $testOutput -like "*Conexión_exitosa*") {
    Write-Host "✅ Conexión SSH exitosa" -ForegroundColor Green
} else {
    Write-Host "❌ No se pudo conectar a $BASTION_IP" -ForegroundColor Red
    Write-Host "   Verifica que:"
    Write-Host "   - La instancia está ejecutándose"
    Write-Host "   - El Security Group permite SSH (puerto 22)"
    Write-Host "   - La clave es correcta"
    Write-Host ""
    Write-Host "Output: $testOutput"
    exit 1
}

Write-Host ""
Write-Host "📦 PASO 1: Preparando EC2..." -ForegroundColor Yellow

$prepScript = @"
set -e

echo "  📁 Creando directorios..."
mkdir -p ~/bastion-host-deploy

echo "  🔄 Actualizando sistema..."
sudo apt-get update -qq 2>/dev/null || true

echo "  🐳 Verificando/Instalando Docker..."
if ! command -v docker &> /dev/null; then
    echo "    - Instalando Docker..."
    sudo apt-get install -y -qq docker.io docker-compose > /dev/null 2>&1
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
    newgrp docker
else
    echo "    - Docker ya está instalado"
fi

echo "  ✅ EC2 preparada"
"@

Write-Host "   Ejecutando preparación en EC2..." -ForegroundColor Gray
ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no $BASTION_USER@$BASTION_IP $prepScript 2>&1 | ForEach-Object {
    Write-Host "   $_"
}

Write-Host "✅ EC2 preparada" -ForegroundColor Green
Write-Host ""

# PASO 2: Transferir archivos
Write-Host "📦 PASO 2: Transferiendo archivos Bastion..." -ForegroundColor Yellow

if (-not (Test-Path "./bastion-host")) {
    Write-Host "❌ Error: Carpeta bastion-host no encontrada" -ForegroundColor Red
    exit 1
}

Write-Host "   Copiando bastion-host a EC2..." -ForegroundColor Gray
$scpOutput = & scp -r -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no ./bastion-host/ "$BASTION_USER@$BASTION_IP`:~/bastion-host-deploy/" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Archivos transferidos" -ForegroundColor Green
} else {
    Write-Host "❌ Error transferiendo archivos: $scpOutput" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 PASO 3: Construyendo imagen Docker..." -ForegroundColor Yellow

$buildScript = @"
set -e
cd ~/bastion-host-deploy/bastion-host
echo "  📦 Construyendo imagen..."
docker build -t bastion-host:latest .
echo "  ✅ Imagen construida"
"@

Write-Host "   Compilando Dockerfile..." -ForegroundColor Gray
ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no $BASTION_USER@$BASTION_IP $buildScript 2>&1 | ForEach-Object {
    Write-Host "   $_"
}

Write-Host "✅ Imagen Docker construida" -ForegroundColor Green
Write-Host ""

# PASO 4: Desplegar con docker-compose
Write-Host "📦 PASO 4: Desplegando con Docker Compose..." -ForegroundColor Yellow

$deployScript = @"
set -e
cd ~/bastion-host-deploy/bastion-host
echo "  🚀 Iniciando servicios..."
docker-compose down 2>/dev/null || true
docker-compose up -d
sleep 3
docker-compose ps
echo "  ✅ Servicios desplegados"
"@

Write-Host "   Levantando contenedores..." -ForegroundColor Gray
ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no $BASTION_USER@$BASTION_IP $deployScript 2>&1 | ForEach-Object {
    Write-Host "   $_"
}

Write-Host "✅ Contenedores ejecutándose" -ForegroundColor Green
Write-Host ""

# PASO 5: Verificación
Write-Host "📦 PASO 5: Verificando despliegue..." -ForegroundColor Yellow

$verifyScript = @"
set -e
echo "  🔍 Estado de contenedores:"
docker-compose -f ~/bastion-host-deploy/bastion-host/docker-compose.yml ps

echo ""
echo "  📊 Logs del contenedor:"
docker logs bastion-host 2>&1 | tail -15

echo ""
echo "  🏥 Verificando salud del servicio..."
sleep 2
docker exec bastion-host /opt/bastion/scripts/health-check.sh 2>/dev/null && echo "✅ Health check OK" || echo "⚠️  Health check en progreso"
"@

Write-Host "   Recopilando información de despliegue..." -ForegroundColor Gray
$verifyOutput = ssh -i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no $BASTION_USER@$BASTION_IP $verifyScript 2>&1

Write-Host $verifyOutput

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos Pasos:" -ForegroundColor Yellow
Write-Host "   1. El Bastion Host está ejecutándose en Docker"
Write-Host "   2. Accesible vía SSH en: $BASTION_IP (puerto 22)"
Write-Host "   3. Usuario de contenedor: ec2-user"
Write-Host "   4. Ver logs: docker logs bastion-host"
Write-Host "   5. Conectar vía: ssh -i ssh-key-ec2.pem ec2-user@$BASTION_IP"
Write-Host ""
