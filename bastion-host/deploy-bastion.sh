#!/bin/bash

# Script para desplegar Bastion Host Docker en EC2
# IP: 13.217.194.108
# Instancia: i-0bd13b8e83e8679bb

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  BASTION HOST DOCKER - DEPLOYMENT SCRIPT"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Variables
BASTION_IP="13.217.194.108"
BASTION_USER="ubuntu"
BASTION_KEY="${BASTION_KEY:-./ssh-key-ec2.pem}"
INSTANCE_ID="i-0bd13b8e83e8679bb"

echo "📋 Parámetros:"
echo "   IP Pública: $BASTION_IP"
echo "   Usuario: $BASTION_USER"
echo "   Clave: $BASTION_KEY"
echo "   Instancia: $INSTANCE_ID"
echo ""

# Verificar que la clave existe
if [ ! -f "$BASTION_KEY" ]; then
    echo "❌ Error: Clave SSH no encontrada en $BASTION_KEY"
    exit 1
fi

echo "🔐 Verificando conexión SSH..."
if ! ssh -i "$BASTION_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$BASTION_USER@$BASTION_IP" "echo '✅ Conectado'" 2>/dev/null; then
    echo "❌ No se puede conectar a $BASTION_IP"
    echo "   Verifica que:"
    echo "   - La instancia está ejecutándose"
    echo "   - El Security Group permite SSH (puerto 22)"
    echo "   - La clave es correcta"
    exit 1
fi

echo ""
echo "📦 Paso 1: Preparando EC2..."
ssh -i "$BASTION_KEY" -o StrictHostKeyChecking=no "$BASTION_USER@$BASTION_IP" << 'PREP_EC2'
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
    sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "  ✅ EC2 preparado"
PREP_EC2

echo "📤 Paso 2: Transfiriendo archivos bastion-host..."
scp -r -i "$BASTION_KEY" -o StrictHostKeyChecking=no ./bastion-host "$BASTION_USER@$BASTION_IP:~/bastion-host" 2>/dev/null
echo "  ✅ Archivos transferidos"

echo ""
echo "🚀 Paso 3: Desplegando Bastion Docker..."
ssh -i "$BASTION_KEY" -o StrictHostKeyChecking=no "$BASTION_USER@$BASTION_IP" << 'DEPLOY'
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
DEPLOY

echo ""
echo "✅ Paso 4: Verificando despliegue..."
ssh -i "$BASTION_KEY" -o StrictHostKeyChecking=no "$BASTION_USER@$BASTION_IP" << 'VERIFY'
echo "  📊 Estado de los contenedores:"
docker-compose ps

echo ""
echo "  📖 Logs de inicialización:"
docker logs bastion-host --tail=20

echo ""
echo "  🔍 Verificación de Health Check:"
docker-compose exec -T bastion /opt/bastion/scripts/health-check.sh && echo "  ✅ Health check OK" || echo "  ⚠️  Health check en progreso"

echo ""
echo "  📝 Logs de auditoría:"
if [ -f "/var/lib/docker/volumes/$(docker volume ls -q | grep bastion-logs)/_data/startup.log" ]; then
    docker-compose exec -T bastion cat /var/log/bastion/startup.log || true
fi
VERIFY

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ DESPLIEGUE COMPLETADO"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Próximos pasos:"
echo ""
echo "1️⃣  Agregar tu clave SSH pública al Bastion:"
echo "   cat ~/.ssh/id_rsa.pub | ssh -i $BASTION_KEY ubuntu@$BASTION_IP 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'"
echo ""
echo "2️⃣  Conectar al Bastion:"
echo "   ssh -i $BASTION_KEY ec2-user@$BASTION_IP"
echo ""
echo "3️⃣  Ver logs:"
echo "   ssh -i $BASTION_KEY ubuntu@$BASTION_IP 'docker logs bastion-host -f'"
echo ""
echo "4️⃣  Acceder a otras instancias a través del Bastion:"
echo "   ssh -J ec2-user@$BASTION_IP ubuntu@[INSTANCE_IP]"
echo ""
echo "📚 Documentación:"
echo "   bastion-host/README.md"
echo "   bastion-host/DEPLOYMENT.md"
echo ""
