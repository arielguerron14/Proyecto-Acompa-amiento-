#!/usr/bin/env python3
"""
Verify deployment status of all EC2 instances
Shows container status and network connectivity
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

def check_instance(instance_name, instance_info, ssh_key_path):
    """Verifica el estado de una instancia"""
    public_ip = instance_info.get('PublicIpAddress')
    
    if not public_ip or public_ip == 'N/A':
        return {
            'instance': instance_name,
            'status': 'NO_IP',
            'containers': [],
            'error': 'No public IP'
        }
    
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(public_ip, username='ubuntu', key_filename=ssh_key_path, timeout=10)
        
        # Verificar containers
        stdin, stdout, stderr = ssh.exec_command('docker ps --format "{{.Names}}:{{.Status}}"')
        containers = [line.strip() for line in stdout if line.strip()]
        
        ssh.close()
        
        return {
            'instance': instance_name,
            'ip': public_ip,
            'status': 'RUNNING' if containers or 'No containers' else 'UP',
            'containers': containers,
            'error': None
        }
        
    except paramiko.AuthenticationException:
        return {
            'instance': instance_name,
            'ip': public_ip,
            'status': 'AUTH_FAILED',
            'containers': [],
            'error': 'Authentication failed'
        }
    except paramiko.SSHException as e:
        return {
            'instance': instance_name,
            'ip': public_ip,
            'status': 'SSH_ERROR',
            'containers': [],
            'error': str(e)
        }
    except Exception as e:
        return {
            'instance': instance_name,
            'ip': public_ip,
            'status': 'UNREACHABLE',
            'containers': [],
            'error': str(e)
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 check-deployment-status.py <ssh_key_path>")
        print("Example: python3 check-deployment-status.py ~/.ssh/labsuser.pem")
        sys.exit(1)
    
    ssh_key_path = sys.argv[1]
    
    if not os.path.exists(ssh_key_path):
        print(f"❌ SSH key not found: {ssh_key_path}")
        sys.exit(1)
    
    # Cargar instancias
    instances = load_instance_ips()
    
    print("\n" + "="*80)
    print("📊 VERIFICANDO ESTADO DE INSTANCIAS EC2")
    print("="*80 + "\n")
    
    results = {}
    for instance_name in sorted(instances.keys()):
        print(f"🔍 Checking {instance_name}...", end=' ', flush=True)
        result = check_instance(instance_name, instances[instance_name], ssh_key_path)
        results[instance_name] = result
        
        if result['status'] == 'RUNNING':
            print(f"✅ RUNNING")
        elif result['status'] == 'UP':
            print(f"✅ UP")
        elif result['status'] == 'NO_IP':
            print(f"⚠️  NO_IP")
        else:
            print(f"❌ {result['status']}")
    
    # Resumen detallado
    print("\n" + "="*80)
    print("📋 RESUMEN DETALLADO")
    print("="*80 + "\n")
    
    for instance_name, result in sorted(results.items()):
        print(f"📌 {instance_name}")
        print(f"   Status: {result['status']}")
        print(f"   IP: {result['ip']}")
        if result['error']:
            print(f"   Error: {result['error']}")
        if result['containers']:
            print(f"   Containers:")
            for container in result['containers']:
                print(f"     • {container}")
        print()
    
    # Estadísticas
    print("="*80)
    running = sum(1 for r in results.values() if r['status'] in ['RUNNING', 'UP'])
    total = len(results)
    print(f"✅ {running}/{total} instances responding\n")

if __name__ == '__main__':
    main()
