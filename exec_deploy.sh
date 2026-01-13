#!/bin/bash
# Este archivo intenta ejecutar el despliegue directamente
# Si funciona, Bastion Host se desplegará en la instancia EC2

# Paso 1: Obtener script de despliegue
echo "[*] Descargando script de despliegue..."
SCRIPT=$(curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/DEPLOY_COPY_PASTE.sh 2>/dev/null)

if [ -z "$SCRIPT" ]; then
  echo "❌ Error: No se pudo descargar el script de GitHub"
  exit 1
fi

echo "✅ Script descargado correctamente"
echo ""
echo "Para ejecutar en la instancia EC2 (3.87.155.74):"
echo ""
echo "  ssh -i key-acompanamiento.pem ec2-user@3.87.155.74 'bash' << 'EOF'"
echo "$SCRIPT"
echo "EOF"
echo ""
echo "O simplemente copiar y pegar en AWS Console → EC2 Instance Connect"
