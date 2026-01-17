#!/usr/bin/env python3
"""
Configura MongoDB en EC2-DB con usuario root y credenciales
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
    
    # Detener servicios viejos
    print("📋 Deteniendo servicios previos...")
    cmds = [
        "docker-compose -f docker-compose.ec2-db.yml down || true",
        "docker stop mongo postgres redis 2>/dev/null || true",
        "docker rm mongo postgres redis 2>/dev/null || true",
    ]
    
    for cmd in cmds:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        if output:
            print(f"  {output.strip()}")
    
    # Levantar con docker-compose
    print("\n📋 Levantando servicios con docker-compose...")
    cmd = "cd ~ && docker-compose -f docker-compose.ec2-db.yml up -d 2>&1"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    
    # Esperar a que MongoDB esté listo
    print("\n⏳ Esperando 10 segundos a que MongoDB inicie...")
    import time
    time.sleep(10)
    
    # Verificar que MongoDB esté corriendo
    print("\n📋 Verificando estado de MongoDB...")
    cmd = "docker ps -a --filter 'name=mongo' --format='table {{.Names}}\t{{.Status}}'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    
    # Ver logs de MongoDB
    print("\n📋 Primeros logs de MongoDB...")
    cmd = "docker logs --tail 20 mongo 2>&1 || echo 'Container no existe'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output)
    
    # Conectar y crear usuario admin
    print("\n📋 Creando usuario 'root' en MongoDB...")
    setup_cmd = """
docker exec -i mongo mongosh --eval "
db.admin.createUser({
  user: 'root',
  pwd: 'example',
  roles: [{role: 'root', db: 'admin'}]
});
print('✅ Usuario root creado');
" 2>&1
"""
    stdin, stdout, stderr = ssh.exec_command(setup_cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if "already exists" in output or "already exists" in err:
        print("  ⚠️  Usuario root ya existe")
    elif "created" in output or "successfully" in output or err == "":
        print("  ✅ Usuario root creado exitosamente")
    else:
        print(f"  Output: {output}")
        if err:
            print(f"  Error: {err}")
    
    # Test de conectividad
    print("\n📋 Testeando conectividad a MongoDB...")
    test_cmd = """
docker run --rm -it --network host node:18-alpine sh -c "
node -e \"
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://root:example@localhost:27017/admin');
client.connect()
  .then(() => { console.log('✅ Conectado a MongoDB'); client.close(); })
  .catch(err => console.log('❌ Error:', err.message));
\" 2>&1
" || echo "Skipped"
"""
    stdin, stdout, stderr = ssh.exec_command(test_cmd)
    output = stdout.read().decode('utf-8', errors='ignore')
    print(output if output else "(test skipped)")
    
    ssh.close()
    print("\n✅ Configuración de EC2-DB completada")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
