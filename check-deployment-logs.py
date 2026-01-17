#!/usr/bin/env python3
"""
Verifica los logs de los contenedores deployados en EC2-CORE
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
    print(f"   SSH_KEY: {'✓' if ssh_key else '✗'}")
    print(f"   INSTANCE_IP: {target_host}")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
    ssh.connect(target_host, username=user, pkey=key, timeout=30)
    print(f"✅ Conectado a EC2-CORE ({target_host})")
    print()
    
    # Verificar contenedores
    commands = [
        ("Estado de contenedores", "docker ps -a | grep -E 'micro-(auth|estudiantes|maestros)' || echo '⚠️  No hay contenedores'"),
        ("Logs micro-auth", "docker logs --tail 20 micro-auth 2>&1 || echo '⚠️  Contenedor no existe'"),
        ("Logs micro-estudiantes", "docker logs --tail 20 micro-estudiantes 2>&1 || echo '⚠️  Contenedor no existe'"),
        ("Logs micro-maestros", "docker logs --tail 20 micro-maestros 2>&1 || echo '⚠️  Contenedor no existe'"),
        ("Espacios disponibles", "df -h /"),
        ("Docker info", "docker info | grep -E 'Storage|Space'"),
    ]
    
    for title, cmd in commands:
        print(f"\n{'='*60}")
        print(f"📋 {title}")
        print(f"{'='*60}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        if output:
            print(output)
        else:
            err = stderr.read().decode('utf-8', errors='ignore')
            if err:
                print(f"❌ {err}")
    
    ssh.close()
    print(f"\n{'='*60}")
    print("✅ Diagnóstico completado")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
