#!/usr/bin/env python3
"""
Ejecuta diagnóstico remoto en EC2-CORE sobre los contenedores
"""
import paramiko
import io
import os
import json
import sys

# Cargar config
with open('config/instance_ips.json', 'r') as f:
    instances = json.load(f)

core_info = instances.get('EC2-CORE', {})
db_info = instances.get('EC2-DB', {})

# Variables
ssh_key = os.environ.get("EC2_SSH_KEY", "")
target_host = core_info.get('PublicIpAddress')
user = "ubuntu"
db_private_ip = db_info.get('PrivateIpAddress', '172.31.65.122')

if not ssh_key or not target_host:
    print("❌ ERROR: Missing SSH_KEY or INSTANCE_IP env var")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
    ssh.connect(target_host, username=user, pkey=key, timeout=30)
    print(f"✅ Conectado a {target_host}\n")
    
    diagnostics = [
        ("CONTENEDORES ACTUALES", "docker ps -a"),
        ("LOGS micro-auth (últimas 30 líneas)", "docker logs --tail 30 micro-auth 2>&1"),
        ("LOGS micro-estudiantes (últimas 30 líneas)", "docker logs --tail 30 micro-estudiantes 2>&1"),
        ("LOGS micro-maestros (últimas 30 líneas)", "docker logs --tail 30 micro-maestros 2>&1"),
        ("NETWORKS", "docker network ls"),
        ("INSPECCIONANDO core-net", "docker network inspect core-net 2>&1 || echo 'No existe'"),
        ("PROCESOS EN LA INSTANCIA", "ps aux | grep -E 'node|mongo|docker' | head -10"),
    ]
    
    for title, cmd in diagnostics:
        print(f"\n{'='*60}")
        print(f"📋 {title}")
        print(f"{'='*60}")
        
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        print(output if output else "(sin output)")
        
        err = stderr.read().decode('utf-8', errors='ignore')
        if err and 'not found' not in err.lower():
            print(f"⚠️  STDERR: {err}")
    
    # Intentar un diagnóstico más profundo
    print(f"\n{'='*60}")
    print("🔍 DIAGNÓSTICO DE CONTENEDORES (inspect)")
    print(f"{'='*60}")
    
    for container in ['micro-auth', 'micro-estudiantes', 'micro-maestros']:
        cmd = f"docker inspect {container} --format='{{{{json .State}}}}' 2>/dev/null"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        if output:
            import json as j
            try:
                state = j.loads(output)
                print(f"\n{container}:")
                print(f"  Status: {state.get('Status')}")
                print(f"  ExitCode: {state.get('ExitCode')}")
                if state.get('Error'):
                    print(f"  Error: {state.get('Error')}")
            except:
                print(f"{container}: {output}")
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
