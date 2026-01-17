#!/usr/bin/env python3
"""
Repara MongoDB en EC2-DB
"""
import paramiko
import io
import os
import json
import sys

# Cargar config
with open('config/instance_ips.json', 'r') as f:
    instances = json.load(f)

db_info = instances.get('EC2-DB', {})

# Variables
ssh_key = os.environ.get("EC2_SSH_KEY", "")
target_host = db_info.get('PublicIpAddress')
user = "ubuntu"

if not ssh_key or not target_host:
    print("❌ ERROR: Missing SSH_KEY or DB instance IP")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
    ssh.connect(target_host, username=user, pkey=key, timeout=30)
    print(f"✅ Conectado a EC2-DB ({target_host})\n")
    
    # Detener MongoDB viejo
    print("📋 Deteniendo MongoDB anterior...")
    cmds = [
        "docker stop mongo 2>/dev/null || true",
        "docker rm mongo 2>/dev/null || true",
    ]
    
    for cmd in cmds:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        if output.strip():
            print(f"  {output.strip()}")
    
    # Levantar MongoDB con credenciales
    print("\n📋 Levantando MongoDB 6.0 con credenciales...")
    cmd = """docker run -d \\
      --name mongo \\
      -p 27017:27017 \\
      -e MONGO_INITDB_ROOT_USERNAME=root \\
      -e MONGO_INITDB_ROOT_PASSWORD=example \\
      -v mongo_data:/data/db \\
      mongo:6.0 \\
      --auth"""
    
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore').strip()
    print(f"✅ MongoDB iniciado: {output[:12]}...")
    
    # Esperar a que esté listo
    print("\n⏳ Esperando 5 segundos a que MongoDB esté listo...")
    import time
    time.sleep(5)
    
    # Verificar estado
    print("\n📋 Verificando estado...")
    cmd = "docker ps -a --filter 'name=mongo' --format='table {{.Names}}\t{{.Status}}'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    
    # Ver logs
    print("\n📋 Logs de MongoDB...")
    cmd = "docker logs --tail 20 mongo 2>&1"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    
    ssh.close()
    print("\n✅ MongoDB reparado")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
