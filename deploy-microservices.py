#!/usr/bin/env python3
"""
Deploy microservices to EC2-CORE
"""
import paramiko
import io
import json
import os
import sys
import time

# Load config
with open('config/instance_ips.json', 'r') as f:
    instances = json.load(f)

core_info = instances.get('EC2-CORE', {})
db_info = instances.get('EC2-DB', {})

# Variables
ssh_key = os.environ.get("EC2_SSH_KEY", "")
target_host = core_info.get('PublicIpAddress')
db_host = db_info.get('PrivateIpAddress')
user = "ubuntu"
docker_user = "caguerronp"

if not ssh_key or not target_host:
    print("❌ ERROR: Missing SSH_KEY or CORE instance IP")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
    ssh.connect(target_host, username=user, pkey=key, timeout=30)
    print(f"✅ Conectado a EC2-CORE ({target_host})\n")
    
    # Crear red Docker
    print("📋 Creando red Docker (core-net)...")
    stdin, stdout, stderr = ssh.exec_command("docker network create core-net 2>/dev/null || echo 'Ya existe'")
    print(f"  {stdout.read().decode('utf-8', errors='ignore').strip()}")
    
    # Microservicios a desplegar
    services = [
        {
            'name': 'micro-auth',
            'image': 'caguerronp/micro-auth:latest',
            'port': '3000:3000',
            'mongo_db': 'auth',
        },
        {
            'name': 'micro-estudiantes',
            'image': 'caguerronp/micro-estudiantes:latest',
            'port': '3001:3001',
            'mongo_db': 'estudiantes',
        },
        {
            'name': 'micro-maestros',
            'image': 'caguerronp/micro-maestros:latest',
            'port': '3002:3002',
            'mongo_db': 'maestros',
        },
    ]
    
    # Detener servicios viejos
    print("\n📋 Deteniendo servicios previos...")
    service_names = ' '.join([s['name'] for s in services])
    stdin, stdout, stderr = ssh.exec_command(f"docker stop {service_names} 2>/dev/null || true")
    print(f"  {stdout.read().decode('utf-8', errors='ignore').strip()}")
    
    stdin, stdout, stderr = ssh.exec_command(f"docker rm {service_names} 2>/dev/null || true")
    print(f"  {stdout.read().decode('utf-8', errors='ignore').strip()}")
    
    # Pull imágenes
    print("\n📋 Descargando imágenes...")
    for service in services:
        print(f"  → {service['name']}...")
        stdin, stdout, stderr = ssh.exec_command(f"docker pull {service['image']}")
        out = stdout.read().decode('utf-8', errors='ignore')
        if 'Downloaded' in out or 'Digest' in out:
            print(f"    ✓ Descargado")
    
    # Desplegar microservicios
    print("\n📋 Desplegando microservicios...")
    for service in services:
        mongo_uri = f"mongodb://root:example@{db_host}:27017/{service['mongo_db']}?authSource=admin"
        
        cmd = f"""docker run -d \\
          --name {service['name']} \\
          --network core-net \\
          -p {service['port']} \\
          -e MONGODB_URI="{mongo_uri}" \\
          -e NODE_ENV=production \\
          {service['image']}"""
        
        print(f"  → Desplegando {service['name']}...")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        container_id = stdout.read().decode('utf-8', errors='ignore').strip()
        if container_id:
            print(f"    ✓ Container: {container_id[:12]}")
        else:
            err = stderr.read().decode('utf-8', errors='ignore')
            print(f"    ✗ Error: {err}")
    
    # Esperar a que se estabilicen
    print("\n⏳ Esperando 10 segundos a que los servicios se estabilicen...")
    time.sleep(10)
    
    # Verificar estado
    print("\n📋 Verificando estado de servicios...")
    stdin, stdout, stderr = ssh.exec_command("docker ps --filter 'name=micro-' --format='table {{.Names}}\t{{.Status}}'")
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    # Verificar logs
    print("📋 Últimos logs de micro-auth...")
    stdin, stdout, stderr = ssh.exec_command("docker logs --tail 5 micro-auth 2>&1")
    logs = stdout.read().decode('utf-8', errors='ignore')
    for line in logs.split('\n')[-10:]:
        if line.strip():
            print(f"  {line}")
    
    ssh.close()
    print("\n✅ Microservicios desplegados")

except paramiko.AuthenticationException:
    print(f"❌ Error de autenticación: {target_host}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
