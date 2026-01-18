#!/usr/bin/env python3
"""
Script local para actualizar IPs desde AWS usando AWS CLI
Uso: python update_ips_locally.py
"""

import json
import subprocess
import sys
from pathlib import Path

def fetch_instances_from_aws_cli():
    """Obtiene instancias desde AWS usando AWS CLI"""
    try:
        print("📋 Obteniendo instancias desde AWS usando AWS CLI...\n")
        
        result = subprocess.run([
            'aws', 'ec2', 'describe-instances',
            '--filters', 'Name=instance-state-name,Values=running',
            '--region', 'us-east-1',
            '--output', 'json'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"❌ Error en AWS CLI: {result.stderr}")
            return None
        
        data = json.loads(result.stdout)
        instances = {}
        
        for reservation in data.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instance_id = instance['InstanceId']
                instance_name = None
                
                for tag in instance.get('Tags', []):
                    if tag['Key'] == 'Name':
                        instance_name = tag['Value']
                        break
                
                if instance_name:
                    public_ip = instance.get('PublicIpAddress', 'N/A')
                    private_ip = instance.get('PrivateIpAddress', 'N/A')
                    instance_type = instance.get('InstanceType', 'unknown')
                    
                    instances[instance_name] = {
                        'InstanceId': instance_id,
                        'Name': instance_name,
                        'PublicIpAddress': public_ip,
                        'PrivateIpAddress': private_ip,
                        'Type': instance_type
                    }
                    
                    print(f"  ✅ {instance_name}: ID={instance_id}, Public={public_ip}, Private={private_ip}")
        
        return instances if instances else None
        
    except FileNotFoundError:
        print("❌ AWS CLI no está instalado")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def update_instance_ips_file(instances):
    """Actualiza config/instance_ips.json"""
    config_path = Path('config/instance_ips.json')
    with open(config_path, 'w') as f:
        json.dump(instances, f, indent=4)
    print(f"\n✅ Actualizado config/instance_ips.json con {len(instances)} instancias")
    return True

def sync_all_configs():
    """Ejecuta los scripts de sincronización"""
    print("\n🔄 Sincronizando configuraciones...")
    
    try:
        print("  1️⃣  Ejecutando sync-ips-to-config.py...")
        result = subprocess.run(['python', 'sync-ips-to-config.py'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("     ✅ Completado")
        
        print("  2️⃣  Ejecutando sync-ips-to-env.py...")
        result = subprocess.run(['python', 'sync-ips-to-env.py'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("     ✅ Completado")
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def commit_and_push():
    """Hace commit y push"""
    try:
        print("\n🔗 Haciendo commit y push...")
        
        subprocess.run(['git', 'add', '-A'], capture_output=True, timeout=10)
        
        result = subprocess.run(['git', 'commit', '-m', 'chore: Update instance IPs from AWS [automated]'],
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            print("  ✅ Cambios commiteados")
            
            subprocess.run(['git', 'pull', 'origin', 'main', '--rebase'],
                         capture_output=True, timeout=30)
            
            result = subprocess.run(['git', 'push', 'origin', 'main'],
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                print("  ✅ Cambios pusheados a GitHub")
                return True
        else:
            print("  ℹ️  No hay cambios nuevos")
            return True
            
    except Exception as e:
        print(f"⚠️  Error en git: {e}")
        return False

def main():
    print("=" * 70)
    print("🚀 ACTUALIZAR IPs DESDE AWS")
    print("=" * 70)
    print()
    
    instances = fetch_instances_from_aws_cli()
    if not instances:
        print("\n❌ No se pudieron obtener instancias")
        return 1
    
    if not update_instance_ips_file(instances):
        return 1
    
    sync_all_configs()
    commit_and_push()
    
    print("\n" + "=" * 70)
    print("✨ ACTUALIZACIÓN COMPLETADA")
    print("=" * 70)
    return 0

if __name__ == '__main__':
    sys.exit(main())
