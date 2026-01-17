#!/usr/bin/env python3
"""
Diagnostica qué está pasando con los contenedores en EC2-CORE
"""
import paramiko
import io
import os
import json
import sys

# Cargar configuración
with open('config/instance_ips.json', 'r') as f:
    instances = json.load(f)
    core_info = instances.get('EC2-CORE', {})

# Variables de entorno
ssh_key = os.environ.get("EC2_SSH_KEY", "")
target_host = os.environ.get("INSTANCE_IP", core_info.get('PublicIpAddress'))
user = os.environ.get("SSH_USER", "ubuntu")

if not ssh_key or not target_host:
    print("❌ ERROR: Missing SSH key or instance IP")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
    ssh.connect(target_host, username=user, pkey=key, timeout=30)
    print(f"✅ Conectado a EC2-CORE ({target_host})\n")
    
    # Comandos de diagnóstico
    diagnostics = [
        ("=== CONTENEDORES EN EJECUCIÓN ===", "docker ps"),
        ("=== TODOS LOS CONTENEDORES ===", "docker ps -a"),
        ("=== LOGS micro-auth ===", "docker logs --tail 30 micro-auth 2>&1 || echo 'No existe'"),
        ("=== LOGS micro-estudiantes ===", "docker logs --tail 30 micro-estudiantes 2>&1 || echo 'No existe'"),
        ("=== LOGS micro-maestros ===", "docker logs --tail 30 micro-maestros 2>&1 || echo 'No existe'"),
        ("=== REDES DISPONIBLES ===", "docker network ls"),
        ("=== INSPECCIONAR NETWORK core-net ===", "docker network inspect core-net 2>&1 || echo 'Network no existe'"),
        ("=== ESPACIO EN DISCO ===", "df -h /"),
        ("=== MEMORIA DISPONIBLE ===", "free -h"),
    ]
    
    for title, cmd in diagnostics:
        print(f"\n{title}")
        print("-" * 60)
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        if output:
            print(output)
        err = stderr.read().decode('utf-8', errors='ignore')
        if err and 'not found' not in err.lower():
            print(f"ERROR: {err}")
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
