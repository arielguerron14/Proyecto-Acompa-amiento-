#!/bin/bash
# BASTION HOST DEPLOYMENT - INSTANCIA: i-0bd13b8e83e8679bb
# IP: 3.87.155.74 | KEY: key-acompanamiento | USER: ec2-user
#
# INSTRUCCIONES:
# 1. Abre AWS Console → EC2 → Instancias
# 2. Selecciona: i-0bd13b8e83e8679bb
# 3. Click "Connect" → Tab "EC2 Instance Connect"
# 4. Abre terminal en navegador
# 5. Copia y pega TODO el contenido de este archivo (sin esta línea de comentario)
# 6. Presiona ENTER y espera a que termine
#
# ════════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🚀 BASTION HOST DEPLOYMENT INICIADO"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 1. ACTUALIZAR SISTEMA
echo "[1/7] Actualizando sistema..."
sudo yum update -y > /dev/null 2>&1 || true
echo "  ✓ Sistema actualizado"

# 2. INSTALAR DOCKER
echo "[2/7] Instalando Docker..."
sudo yum install docker git -y > /dev/null 2>&1
sudo systemctl start docker > /dev/null 2>&1
sudo systemctl enable docker > /dev/null 2>&1
sudo usermod -aG docker ec2-user > /dev/null 2>&1
echo "  ✓ Docker instalado"

# 3. INSTALAR DOCKER COMPOSE
echo "[3/7] Instalando Docker Compose..."
sudo bash -c 'curl -fsSL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-Linux-x86_64 -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose' 2>/dev/null
echo "  ✓ Docker Compose instalado"

# 4. CLONAR REPOSITORIO
echo "[4/7] Clonando repositorio..."
if [ ! -d "$HOME/Proyecto-Acompa-amiento-" ]; then
  git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git > /dev/null 2>&1
  echo "  ✓ Repositorio clonado (nuevo)"
else
  cd "$HOME/Proyecto-Acompa-amiento-"
  git pull > /dev/null 2>&1
  echo "  ✓ Repositorio actualizado"
fi

# 5. NAVEGAR A BASTION
echo "[5/7] Preparando despliegue..."
cd "$HOME/Proyecto-Acompa-amiento-/bastion-host"
docker-compose down -v 2>/dev/null || true
echo "  ✓ Ambiente limpiado"

# 6. DESPLEGAR BASTION HOST
echo "[6/7] Desplegando Bastion Host..."
docker-compose up -d > /dev/null 2>&1
sleep 3
echo "  ✓ Contenedor desplegado"

# 7. VERIFICAR
echo "[7/7] Verificando despliegue..."
if docker ps | grep -q bastion-host; then
  echo "  ✓ Contenedor está corriendo"
else
  echo "  ✗ ERROR: Contenedor no está corriendo"
  echo ""
  echo "LOGS DE ERROR:"
  docker logs bastion-host
  exit 1
fi

# RESUMEN FINAL
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ DESPLIEGUE COMPLETADO EXITOSAMENTE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🎯 BASTION HOST ESTÁ OPERATIVO"
echo ""
echo "Información de conexión:"
echo "  ├─ IP Pública: 3.87.155.74"
echo "  ├─ Puerto SSH: 2222"
echo "  ├─ Usuario: root"
echo "  └─ Autenticación: Public Key (bastion-key.pem)"
echo ""
echo "Para conectar desde tu máquina local:"
echo "  ssh -p 2222 -i bastion-key.pem root@3.87.155.74"
echo ""
echo "Para ver logs en tiempo real:"
echo "  docker logs -f bastion-host"
echo ""
echo "Estado del contenedor:"
docker ps | grep bastion-host
echo ""
echo "Puerto mapeado:"
docker port bastion-host
echo ""
echo "════════════════════════════════════════════════════════════════"
