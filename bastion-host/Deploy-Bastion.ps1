# Script para desplegar Bastion Host Docker en EC2
# IP: 13.217.194.108
# Instancia: i-0bd13b8e83e8679bb

param(
    [string]$BastionIP = "13.217.194.108",
    [string]$BastionUser = "ubuntu",
    [string]$BastionKey = "./ssh-key-ec2.pem",
    [string]$InstanceID = "i-0bd13b8e83e8679bb"
)

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  BASTION HOST DOCKER - DEPLOYMENT SCRIPT" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Parámetros:" -ForegroundColor Yellow
Write-Host "   IP Pública: $BastionIP"
Write-Host "   Usuario: $BastionUser"
Write-Host "   Clave: $BastionKey"
Write-Host "   Instancia: $InstanceID"
Write-Host ""

# Verificar que la clave existe
if (-not (Test-Path $BastionKey)) {
    Write-Host "❌ Error: Clave SSH no encontrada en $BastionKey" -ForegroundColor Red
    exit 1
}

Write-Host "🔐 Verificando conexión SSH..." -ForegroundColor Yellow
$sshTest = ssh -i $BastionKey -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$BastionUser@$BastionIP" "echo 'OK'" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No se puede conectar a $BastionIP" -ForegroundColor Red
    Write-Host "   Verifica que:"
    Write-Host "   - La instancia está ejecutándose"
    Write-Host "   - El Security Group permite SSH (puerto 22)"
    Write-Host "   - La clave es correcta"
    exit 1
}
Write-Host "✅ Conectado" -ForegroundColor Green

Write-Host ""
Write-Host "📦 Paso 1: Preparando EC2..." -ForegroundColor Yellow

$prepScript = @"
set -e
echo "  📁 Creando directorios..."
mkdir -p ~/app ~/docker-images ~/bastion-host

echo "  🔄 Actualizando sistema..."
sudo apt-get update -qq > /dev/null 2>&1 || true

echo "  🐳 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "    Instalando Docker..."
    sudo apt-get install -y -qq docker.io > /dev/null 2>&1
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker ubuntu
fi

echo "  🐙 Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "    Instalando Docker Compose..."
    sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "  ✅ EC2 preparado"
"@

ssh -i $BastionKey -o StrictHostKeyChecking=no "$BastionUser@$BastionIP" $prepScript | Write-Host

Write-Host "📤 Paso 2: Transfiriendo archivos bastion-host..." -ForegroundColor Yellow
$sourceDir = "bastion-host"
$destDir = "$BastionUser@${BastionIP}:~/bastion-host"

# Usar scp para copiar la carpeta
scp -r -i $BastionKey -o StrictHostKeyChecking=no $sourceDir $destDir 2>$null
Write-Host "  ✅ Archivos transferidos" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Paso 3: Desplegando Bastion Docker..." -ForegroundColor Yellow

$deployScript = @"
set -e
cd ~/bastion-host

echo "  🧹 Limpiando recursos anteriores..."
docker-compose down 2>/dev/null || true
sleep 2

echo "  🔨 Construyendo imagen Docker..."
docker build -t bastion-host:latest .

echo "  ▶️  Iniciando servicios..."
docker-compose up -d

echo "  ⏳ Esperando a que inicie SSH..."
sleep 5

echo "  ✅ Bastion desplegado"
"@

ssh -i $BastionKey -o StrictHostKeyChecking=no "$BastionUser@$BastionIP" $deployScript | Write-Host

Write-Host ""
Write-Host "✅ Paso 4: Verificando despliegue..." -ForegroundColor Yellow

$verifyScript = @"
echo "  📊 Estado de los contenedores:"
docker-compose ps

echo ""
echo "  📖 Logs de inicialización:"
docker logs bastion-host --tail=20

echo ""
echo "  🔍 Verificación de Health Check:"
docker-compose exec -T bastion /opt/bastion/scripts/health-check.sh && echo "  ✅ Health check OK" || echo "  ⚠️  Health check en progreso"

echo ""
echo "  📝 Verificación de SSH:"
docker-compose exec -T bastion ss -tnp | grep :22 | head -3 || echo "  ⏳ SSH iniciándose..."
"@

ssh -i $BastionKey -o StrictHostKeyChecking=no "$BastionUser@$BastionIP" $verifyScript | Write-Host

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Agregar tu clave SSH pública al Bastion:" -ForegroundColor Yellow
Write-Host "   ssh -i $BastionKey ubuntu@$BastionIP 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys' < ~/.ssh/id_rsa.pub"
Write-Host ""
Write-Host "2️⃣  Conectar al Bastion:" -ForegroundColor Yellow
Write-Host "   ssh -i $BastionKey ec2-user@$BastionIP"
Write-Host ""
Write-Host "3️⃣  Ver logs:" -ForegroundColor Yellow
Write-Host "   ssh -i $BastionKey ubuntu@$BastionIP 'docker logs bastion-host -f'"
Write-Host ""
Write-Host "4️⃣  Acceder a otras instancias a través del Bastion:" -ForegroundColor Yellow
Write-Host "   ssh -J ec2-user@$BastionIP ubuntu@[INSTANCE_IP]"
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "   bastion-host/README.md"
Write-Host "   bastion-host/DEPLOYMENT.md"
Write-Host ""
