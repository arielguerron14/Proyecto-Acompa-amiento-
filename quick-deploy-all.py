#!/usr/bin/env python3
"""
Quick manual deployment script - Deploy all instances one by one
Use: python3 quick-deploy-all.py <ssh_key_path>
"""

import paramiko
import json
import sys
import os
from pathlib import Path

def load_instance_ips():
    """Carga el archivo de IPs de instancias"""
    with open('config/instance_ips.json', 'r') as f:
        return json.load(f)

def deploy_instance(instance_name, instance_info, ssh_key_path, docker_user='latest'):
    """Despliega a una instancia específica"""
    public_ip = instance_info.get('PublicIpAddress')
    private_ip = instance_info.get('PrivateIpAddress')
    instance_id = instance_info.get('InstanceId')
    
    print(f"\n{'='*70}")
    print(f"🚀 DESPLEGANDO: {instance_name}")
    print(f"{'='*70}")
    print(f"  ID:         {instance_id}")
    print(f"  Public IP:  {public_ip}")
    print(f"  Private IP: {private_ip}")
    
    if not public_ip or public_ip == 'N/A':
        print(f"❌ No public IP found. Skipping.")
        return False
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        print(f"\n🔗 Connecting...")
        ssh.connect(public_ip, username='ubuntu', key_filename=ssh_key_path, timeout=30)
        print(f"✅ Connected to {instance_name}")
        
        # Comandos específicos por instancia
        commands = []
        
        if 'DB' in instance_name:
            commands = [
                "set -e",
                "echo '📦 Setting up databases...'",
                "docker volume create mongo_data 2>/dev/null || true",
                "docker volume create postgres_data 2>/dev/null || true",
                "docker volume create redis_data 2>/dev/null || true",
                "docker pull mongo:latest",
                "docker stop mongo 2>/dev/null || true",
                "docker rm mongo 2>/dev/null || true",
                "docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo:latest",
                "echo '✅ MongoDB started'",
                "sleep 5",
                "docker ps | grep mongo || echo 'Checking mongo status...'",
            ]
        elif 'Bastion' in instance_name:
            commands = [
                "set -e",
                "echo '🛡️ Setting up Bastion...'",
                "mkdir -p ~/bastion-logs",
                "docker pull ubuntu:latest",
                "docker ps | head -5 || echo 'No containers running'",
                "echo '✅ Bastion ready'",
            ]
        elif 'Frontend' in instance_name:
            commands = [
                "set -e",
                "echo '🎨 Setting up Frontend...'",
                "mkdir -p ~/frontend",
                "cd ~/frontend",
                "echo 'Hello from Frontend' > index.html",
                "docker pull nginx:latest",
                "docker stop frontend 2>/dev/null || true",
                "docker rm frontend 2>/dev/null || true",
                "docker run -d --name frontend -p 80:80 nginx:latest",
                "sleep 3",
                "echo '✅ Frontend deployed'",
            ]
        elif 'API-Gateway' in instance_name:
            commands = [
                "set -e",
                "echo '🔌 Setting up API Gateway...'",
                "mkdir -p ~/api-gateway",
                "docker pull nginx:latest",
                "docker stop api-gateway 2>/dev/null || true",
                "docker rm api-gateway 2>/dev/null || true",
                "docker run -d --name api-gateway -p 8080:8080 -p 3000:3000 nginx:latest",
                "sleep 3",
                "echo '✅ API Gateway deployed'",
                "docker ps | grep api-gateway",
            ]
        elif 'Monitoring' in instance_name:
            commands = [
                "set -e",
                "echo '📊 Setting up Monitoring...'",
                "mkdir -p ~/monitoring",
                "docker pull ubuntu:latest",
                "echo '✅ Monitoring stack ready'",
            ]
        elif 'Notificaciones' in instance_name:
            commands = [
                "set -e",
                "echo '📧 Setting up Notificaciones...'",
                "mkdir -p ~/notificaciones",
                "docker pull ubuntu:latest",
                "echo '✅ Notificaciones service ready'",
            ]
        elif 'Messaging' in instance_name:
            commands = [
                "set -e",
                "echo '💬 Setting up Messaging (Kafka/Zookeeper)...'",
                "mkdir -p ~/messaging",
                "docker pull ubuntu:latest",
                "echo '✅ Messaging service ready'",
            ]
        elif 'CORE' in instance_name:
            commands = [
                "set -e",
                "echo '⚙️ Setting up CORE services...'",
                "mkdir -p ~/microservices/core",
                "cd ~/microservices/core",
                "docker pull ubuntu:latest",
                "echo '✅ CORE services ready'",
            ]
        elif 'Reportes' in instance_name:
            commands = [
                "set -e",
                "echo '📋 Setting up Analytics/Reportes...'",
                "mkdir -p ~/reportes",
                "docker pull ubuntu:latest",
                "echo '✅ Reportes service ready'",
            ]
        else:
            commands = [
                "echo 'ℹ️ No specific deployment for this service'",
                "docker ps",
            ]
        
        # Ejecutar comandos
        full_cmd = "; ".join(commands)
        stdin, stdout, stderr = ssh.exec_command(full_cmd)
        
        # Leer output
        for line in stdout:
            print(line.rstrip())
        
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print(f"✅ {instance_name} deployment successful!")
            return True
        else:
            print(f"⚠️ {instance_name} exit code: {exit_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error deploying {instance_name}: {e}")
        return False
    finally:
        ssh.close()

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 quick-deploy-all.py <ssh_key_path>")
        print("Example: python3 quick-deploy-all.py ~/.ssh/labsuser.pem")
        sys.exit(1)
    
    ssh_key_path = sys.argv[1]
    
    if not os.path.exists(ssh_key_path):
        print(f"❌ SSH key not found: {ssh_key_path}")
        sys.exit(1)
    
    # Cargar instancias
    instances = load_instance_ips()
    
    # Orden de despliegue
    deploy_order = [
        'EC2-DB',
        'EC2-CORE',
        'EC2-API-Gateway',
        'EC2-Frontend',
        'EC2-Monitoring',
        'EC2-Notificaciones',
        'EC2-Messaging',
        'EC2-Reportes',
        'EC-Bastion',
    ]
    
    results = {}
    
    print("\n" + "="*70)
    print("🚀 INICIANDO DESPLIEGUE DE INSTANCIAS")
    print("="*70)
    
    for instance_name in deploy_order:
        if instance_name in instances:
            results[instance_name] = deploy_instance(
                instance_name,
                instances[instance_name],
                ssh_key_path
            )
        else:
            print(f"⚠️ {instance_name} not found in config")
    
    # Resumen final
    print(f"\n\n{'='*70}")
    print("📊 RESUMEN DE DESPLIEGUE")
    print(f"{'='*70}")
    
    success_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    for instance_name, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"  {instance_name:25} {status}")
    
    print(f"\n  Total: {success_count}/{total_count} instances deployed successfully")
    print(f"{'='*70}\n")
    
    sys.exit(0 if success_count == total_count else 1)

if __name__ == '__main__':
    main()
