#!/bin/bash
# Bastion Host - EC2 Auto-Deploy Script
# Ejecutar en: ec2-user@3.87.155.74 (instancia t3.small us-east-1b)

set -e

echo "=========================================="
echo "Bastion Host - EC2 Deployment Script"
echo "=========================================="
echo "Instancia: i-0bd13b8e83e8679bb"
echo "IP: 3.87.155.74"
echo "Usuario: ec2-user"
echo ""

# 1. Instalar dependencias
echo "[STEP 1] Instalando Docker y Docker Compose..."
sudo yum update -y > /dev/null 2>&1
sudo yum install docker git -y > /dev/null 2>&1

# Docker Compose
echo "  -> Descargando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose

# Docker daemon
echo "  -> Iniciando Docker..."
sudo systemctl start docker > /dev/null 2>&1
sudo systemctl enable docker > /dev/null 2>&1

# Usuario para docker
echo "  -> Configurando permisos de Docker..."
sudo usermod -aG docker ec2-user > /dev/null 2>&1

echo "  ✓ Docker instalado y configurado"
echo ""

# 2. Clonar repositorio
echo "[STEP 2] Clonando repositorio..."
cd ~
if [ ! -d "Proyecto-Acompa-amiento-" ]; then
  git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git > /dev/null 2>&1
  echo "  ✓ Repositorio clonado"
else
  echo "  ✓ Repositorio ya existe, actualizando..."
  cd Proyecto-Acompa-amiento-
  git pull > /dev/null 2>&1
  cd ~
fi
echo ""

# 3. Desplegar Bastion Host
echo "[STEP 3] Desplegando Bastion Host..."
cd ~/Proyecto-Acompa-amiento-/bastion-host

echo "  -> Deteniendo contenedores previos..."
docker-compose down -v 2>/dev/null || true

echo "  -> Construyendo e iniciando contenedor..."
docker-compose up -d > /dev/null 2>&1

# Esperar a que inicie
sleep 3

echo "  ✓ Bastion Host desplegado"
echo ""

# 4. Verificaciones
echo "[STEP 4] Verificando despliegue..."
echo ""

# Verificar contenedor
if docker ps | grep -q bastion-host; then
  echo "  ✓ Contenedor está corriendo"
else
  echo "  ✗ ERROR: Contenedor no está corriendo"
  echo "    Ver logs con: docker logs bastion-host"
  exit 1
fi

# Ver puerto
PORT_MAPPING=$(docker port bastion-host)
echo "  ✓ Puerto mapeado: $PORT_MAPPING"

# Verificar SSH
echo "  -> Verificando SSH..."
if docker logs bastion-host | grep -q "Configuración SSH válida"; then
  echo "  ✓ SSH configurado correctamente"
else
  echo "  ⚠ Advertencia: Revisar SSH config"
  docker logs bastion-host | tail -5
fi

echo ""
echo "=========================================="
echo "✅ Despliegue completado exitosamente"
echo "=========================================="
echo ""
echo "Bastion Host disponible en:"
echo "  - IP: 3.87.155.74"
echo "  - Puerto: 2222"
echo "  - Usuario: root"
echo ""
echo "Para conectar:"
echo "  ssh -p 2222 -i bastion-key.pem root@3.87.155.74"
echo ""
echo "Ver logs:"
echo "  docker logs bastion-host -f"
echo ""
