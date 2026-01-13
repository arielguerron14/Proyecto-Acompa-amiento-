#!/usr/bin/env python3
"""
Ejecuta despliegue de Bastion Host en EC2 usando Systems Manager
Requiere: AWS CLI configurado + credenciales con permisos SSM
"""

import subprocess
import json
import sys

EC2_INSTANCE_ID = "i-0bd13b8e83e8679bb"
EC2_REGION = "us-east-1"

# Script de despliegue
DEPLOY_SCRIPT = """
set -e
echo "[1/7] Actualizando sistema..."
sudo yum update -y > /dev/null 2>&1 || true

echo "[2/7] Instalando Docker..."
sudo yum install docker git -y > /dev/null 2>&1
sudo systemctl start docker > /dev/null 2>&1
sudo systemctl enable docker > /dev/null 2>&1
sudo usermod -aG docker ec2-user > /dev/null 2>&1

echo "[3/7] Instalando Docker Compose..."
sudo bash -c 'curl -fsSL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-Linux-x86_64 -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose' 2>/dev/null

echo "[4/7] Clonando repositorio..."
[ -d ~/Proyecto-Acompa-amiento- ] || git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git > /dev/null 2>&1
cd ~/Proyecto-Acompa-amiento-
git pull > /dev/null 2>&1

echo "[5/7] Preparando despliegue..."
cd bastion-host
docker-compose down -v 2>/dev/null || true

echo "[6/7] Desplegando Bastion Host..."
docker-compose up -d > /dev/null 2>&1
sleep 3

echo "[7/7] Verificando despliegue..."
if docker ps | grep -q bastion-host; then
  echo "✅ DESPLIEGUE COMPLETADO EXITOSAMENTE"
  echo ""
  echo "Bastion Host está operativo:"
  docker ps | grep bastion-host
  echo ""
  echo "Puerto mapeado:"
  docker port bastion-host
else
  echo "❌ ERROR: Contenedor no está corriendo"
  docker logs bastion-host
  exit 1
fi
"""

def run_ssm_command():
    """Ejecuta comando en instancia EC2 via Systems Manager"""
    
    print("🚀 Iniciando despliegue de Bastion Host...")
    print(f"   Instancia: {EC2_INSTANCE_ID}")
    print(f"   Región: {EC2_REGION}")
    print()
    
    try:
        # Ejecutar comando via Systems Manager
        cmd = [
            "aws", "ssm", "send-command",
            "--instance-ids", EC2_INSTANCE_ID,
            "--document-name", "AWS-RunShellScript",
            "--parameters", f"commands={json.dumps([DEPLOY_SCRIPT])}",
            "--region", EC2_REGION,
            "--output", "json"
        ]
        
        print(f"Ejecutando: {' '.join(cmd[:5])} ...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"❌ Error: {result.stderr}")
            return False
        
        data = json.loads(result.stdout)
        command_id = data.get("Command", {}).get("CommandId")
        
        if not command_id:
            print("❌ No se obtuvo Command ID")
            return False
        
        print(f"✅ Comando enviado exitosamente")
        print(f"   Command ID: {command_id}")
        print()
        print("Monitoreando ejecución (espera 2-3 minutos)...")
        print()
        
        # Monitorear estado
        import time
        for i in range(18):  # 3 minutos máximo
            time.sleep(10)
            
            check_cmd = [
                "aws", "ssm", "get-command-invocation",
                "--command-id", command_id,
                "--instance-id", EC2_INSTANCE_ID,
                "--region", EC2_REGION,
                "--output", "json"
            ]
            
            check_result = subprocess.run(check_cmd, capture_output=True, text=True)
            
            if check_result.returncode == 0:
                invocation = json.loads(check_result.stdout)
                status = invocation.get("Status")
                
                if status == "Success":
                    print("✅ DESPLIEGUE COMPLETADO EXITOSAMENTE")
                    print()
                    print("Output:")
                    print(invocation.get("StandardOutputContent", ""))
                    return True
                elif status == "Failed":
                    print("❌ DESPLIEGUE FALLÓ")
                    print()
                    print("Error:")
                    print(invocation.get("StandardErrorContent", ""))
                    return False
                elif status in ["InProgress", "Pending"]:
                    print(f"[{i+1}/18] Status: {status}...", end="\r")
        
        print()
        print("⏱️ Timeout. Verifica el estado en AWS Console")
        return False
        
    except subprocess.TimeoutExpired:
        print("❌ Timeout al ejecutar comando")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = run_ssm_command()
    sys.exit(0 if success else 1)
