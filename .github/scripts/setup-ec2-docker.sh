#!/bin/bash
# EC2 Infrastructure Setup Script
# Instalación de Docker en todas las instancias EC2

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  EC2 INFRASTRUCTURE SETUP - Docker Installation              ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Variables
INSTANCE_NAME="${INSTANCE_NAME:-unknown}"
INSTANCE_ID="${INSTANCE_ID:-unknown}"
REGION="${AWS_REGION:-us-east-1}"
TAG="SETUP_DOCKER_$(date +%s)"

echo ""
echo "📋 Instancia: $INSTANCE_NAME ($INSTANCE_ID)"
echo "🌍 Región: $REGION"
echo "⏰ Timestamp: $(date)"
echo ""

# 1. Actualizar sistema
echo "[1/8] Actualizando sistema operativo..."
apt-get update -y > /dev/null 2>&1
apt-get upgrade -y > /dev/null 2>&1
echo "  ✅ Sistema actualizado"

# 2. Instalar dependencias
echo "[2/8] Instalando dependencias..."
apt-get install -y \
  docker.io \
  curl \
  wget \
  git \
  jq \
  awscli \
  net-tools \
  telnet \
  traceroute \
  > /dev/null 2>&1
echo "  ✅ Dependencias instaladas"

# 3. Instalar Docker Compose
echo "[3/8] Instalando Docker Compose..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K[^"]*')
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose 2>/dev/null
chmod +x /usr/local/bin/docker-compose
echo "  ✅ Docker Compose instalado (${COMPOSE_VERSION})"

# 4. Habilitar Docker
echo "[4/8] Habilitando Docker..."
systemctl enable docker > /dev/null 2>&1
systemctl start docker > /dev/null 2>&1
echo "  ✅ Docker habilitado y iniciado"

# 5. Configurar usuario
echo "[5/8] Configurando permisos de usuario..."
usermod -aG docker ubuntu > /dev/null 2>&1
usermod -aG docker ec2-user > /dev/null 2>&1
echo "  ✅ Usuario configurado para Docker"

# 6. Crear directorios
echo "[6/8] Creando directorios..."
mkdir -p /opt/docker-apps
mkdir -p /var/log/docker
mkdir -p /etc/docker
chmod 777 /opt/docker-apps
echo "  ✅ Directorios creados"

# 7. Crear archivo de configuración Docker
echo "[7/8] Configurando Docker daemon..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "insecure-registries": [],
  "registry-mirrors": []
}
EOF
systemctl restart docker > /dev/null 2>&1
echo "  ✅ Docker configurado"

# 8. Verificar instalación
echo "[8/8] Verificando instalación..."
DOCKER_VERSION=$(docker --version)
COMPOSE_VERSION=$(docker-compose --version)
echo "  ✅ Docker: $DOCKER_VERSION"
echo "  ✅ Docker Compose: $COMPOSE_VERSION"

# Verificar conectividad
echo ""
echo "🔍 Verificando conectividad de red..."
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
  echo "  ✅ Conectividad a internet: OK"
else
  echo "  ⚠️ Sin conectividad a internet"
fi

# Tag de instancia
echo ""
echo "📝 Etiquetando instancia en AWS..."
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
REGION=$(ec2-metadata --availability-zone | sed 's/[a-z]$//')

aws ec2 create-tags \
  --resources "$INSTANCE_ID" \
  --tags "Key=DockerSetup,Value=$TAG" "Key=SetupDate,Value=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --region "$REGION" \
  > /dev/null 2>&1

echo "  ✅ Instancia etiquetada"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ SETUP COMPLETADO EXITOSAMENTE                             ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Docker está listo para usar en esta instancia                ║"
echo "║  Puedes empezar a desplegar containers con docker-compose      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
