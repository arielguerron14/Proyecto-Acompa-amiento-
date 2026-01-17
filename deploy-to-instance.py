#!/usr/bin/env python3
"""
Universal deployment script for all EC2 instances
Reads IPs from config/instance_ips.json and handles SSH deployment
"""

import paramiko
import io
import json
import sys
import os

def load_instance_ips():
    """Carga el archivo de IPs de instancias"""
    config_file = 'config/instance_ips.json'
    if not os.path.exists(config_file):
        print(f"❌ Error: {config_file} not found")
        sys.exit(1)
    
    with open(config_file, 'r') as f:
        return json.load(f)

def get_instance_info(instance_name, instances):
    """Obtiene la información de una instancia"""
    # Buscar por nombre exacto
    if instance_name in instances:
        return instances[instance_name]
    
    # Buscar variaciones
    for key, value in instances.items():
        if key.lower() == instance_name.lower() or value.get('Name', '').lower() == instance_name.lower():
            return value
    
    raise ValueError(f"Instance '{instance_name}' not found in config")

def deploy_to_instance(instance_name, ssh_key, deployment_commands):
    """
    Despliega a una instancia EC2
    
    Args:
        instance_name: Nombre de la instancia (ej: 'EC2-CORE')
        ssh_key: Contenido de la clave SSH privada
        deployment_commands: Lista de comandos a ejecutar en la instancia
    """
    instances = load_instance_ips()
    instance_info = get_instance_info(instance_name, instances)
    
    public_ip = instance_info.get('PublicIpAddress')
    private_ip = instance_info.get('PrivateIpAddress')
    
    if not public_ip or public_ip == 'N/A':
        print(f"❌ No public IP found for {instance_name}")
        sys.exit(1)
    
    ssh_user = 'ubuntu'
    
    print(f"🚀 Deploying to {instance_name}")
    print(f"  Public IP:  {public_ip}")
    print(f"  Private IP: {private_ip}")
    print(f"  User: {ssh_user}")
    print()
    
    # Conectar por SSH
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"🔗 Connecting to {public_ip}...")
        key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
        ssh.connect(public_ip, username=ssh_user, pkey=key, timeout=30)
        print(f"✅ Connected to {instance_name}")
        print()
        
        # Ejecutar comandos
        full_command = "; ".join(deployment_commands)
        
        print(f"📝 Executing deployment commands...")
        stdin, stdout, stderr = ssh.exec_command(full_command)
        
        # Leer output en tiempo real
        for line in stdout:
            print(line.rstrip())
        
        # Verificar errores
        error_output = stderr.read().decode()
        if error_output:
            print(f"⚠️  Stderr output:")
            print(error_output)
        
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print()
            print(f"✅ Deployment successful to {instance_name}!")
        else:
            print()
            print(f"❌ Deployment failed with exit code {exit_code}")
            sys.exit(1)
        
        ssh.close()
        
    except paramiko.AuthenticationException:
        print(f"❌ Authentication failed")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"❌ SSH error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: deploy-to-instance.py <instance_name> <ssh_key_env_var> [commands...]")
        print("Example: deploy-to-instance.py EC2-CORE EC2_SSH_KEY 'docker ps'")
        sys.exit(1)
    
    instance_name = sys.argv[1]
    ssh_key_var = sys.argv[2]
    commands = sys.argv[3:] if len(sys.argv) > 3 else []
    
    ssh_key = os.environ.get(ssh_key_var, '')
    if not ssh_key:
        print(f"❌ ERROR: {ssh_key_var} environment variable not set")
        sys.exit(1)
    
    deploy_to_instance(instance_name, ssh_key, commands)
