#!/usr/bin/env python3
"""
Script de deployment robusto para EC2-CORE
Maneja errores y proporciona diagnósticos detallados
"""
import paramiko
import io
import os
import json
import sys
import time

# Cargar configuración
with open('config/instance_ips.json', 'r') as f:
    instances = json.load(f)

core_info = instances.get('EC2-CORE', {})
db_info = instances.get('EC2-DB', {})

# Obtener variables
ssh_key = os.environ.get("EC2_SSH_KEY", "")
target_host = os.environ.get("INSTANCE_IP", core_info.get('PublicIpAddress'))
user = os.environ.get("SSH_USER", "ubuntu")
docker_user = os.environ.get("DOCKER_USERNAME_VAR", "")
db_private_ip = db_info.get('PrivateIpAddress', '172.31.65.122')

if not ssh_key or not target_host or not docker_user:
    print("❌ ERROR: Missing required env vars")
    print(f"  SSH_KEY: {'✓' if ssh_key else '✗'}")
    print(f"  INSTANCE_IP: {target_host}")
    print(f"  DOCKER_USERNAME: {'✓' if docker_user else '✗'}")
    sys.exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

def run_ssh(cmd, description=""):
    """Ejecuta un comando SSH y retorna (success, output)"""
    if description:
        print(f"\n📋 {description}")
    try:
        stdin, stdout, stderr = ssh.exec_command(cmd)
        output = stdout.read().decode('utf-8', errors='ignore')
        error = stderr.read().decode('utf-8', errors='ignore')
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            if output:
                print(f"✅ {output.strip()}")
            return True, output
        else:
            if error:
                print(f"⚠️  {error.strip()}")
            if output:
                print(f"Output: {output.strip()}")
            return False, output + error
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, str(e)

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
    ssh.connect(target_host, username=user, pkey=key, timeout=30)
    print(f"✅ Conectado a EC2-CORE ({target_host})")
    
    # 1. Crear red
    run_ssh("docker network create core-net 2>/dev/null || echo 'Network already exists'", 
            "Creando/verificando network core-net")
    
    # 2. Descargar imágenes
    images = ['micro-auth', 'micro-estudiantes', 'micro-maestros']
    for img in images:
        run_ssh(f"docker pull {docker_user}/{img}:latest",
                f"Descargando {img}")
    
    # 3. Parar/remover contenedores viejos
    print("\n📋 Limpiando contenedores antiguos...")
    run_ssh(f"docker stop {' '.join(images)} 2>/dev/null || true")
    run_ssh(f"docker rm {' '.join(images)} 2>/dev/null || true")
    
    # 4. Iniciar contenedores
    print("\n📋 Iniciando contenedores...")
    
    containers = [
        ("micro-auth", "3000", "auth"),
        ("micro-estudiantes", "3001", "estudiantes"),
        ("micro-maestros", "3002", "maestros"),
    ]
    
    for container, port, db_name in containers:
        cmd = f"""docker run -d \\
            --name {container} \\
            --network core-net \\
            -p {port}:{port} \\
            -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/{db_name}?authSource=admin' \\
            {docker_user}/{container}:latest"""
        
        success, output = run_ssh(cmd, f"Iniciando {container}")
        if success:
            container_id = output.strip()
            print(f"  Container ID: {container_id[:12]}...")
        time.sleep(2)
    
    # 5. Verificar estado
    print("\n📋 Verificando estado de los contenedores...")
    success, output = run_ssh("docker ps -a --filter 'name=micro-'", "Estado actual")
    print(output)
    
    # 6. Ver logs
    print("\n📋 Primeros logs de cada contenedor...")
    for container in images:
        print(f"\n--- {container} ---")
        run_ssh(f"docker logs --tail 10 {container} 2>&1 || echo 'No existe'")
    
    ssh.close()
    print("\n✅ Deployment completado")
    
except Exception as e:
    print(f"❌ Error fatal: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
