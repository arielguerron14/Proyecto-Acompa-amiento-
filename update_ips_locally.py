#!/usr/bin/env python3
"""
Script local para actualizar IPs desde AWS y sincronizar todas las configuraciones
Ejecutar: python update_ips_locally.py
"""

import json
import boto3
import os
import subprocess
import sys
from pathlib import Path

def get_aws_credentials():
    """Obtiene credenciales de AWS desde variables de entorno"""
    access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
    session_token = os.environ.get('AWS_SESSION_TOKEN')
    
    if not access_key or not secret_key:
        print("❌ Error: AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY no están configuradas")
        print("   Configúralas como variables de entorno")
        return None
    
    return access_key, secret_key, session_token

def fetch_instances_from_aws():
    """Obtiene las instancias EC2 desde AWS"""
    creds = get_aws_credentials()
    if not creds:
        return None
    
    access_key, secret_key, session_token = creds
    
    try:
        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=session_token,
            region_name='us-east-1'
        )
        
        ec2 = session.client('ec2')
        response = ec2.describe_instances(
            Filters=[{'Name': 'instance-state-name', 'Values': ['running']}]
        )
        
        instances = {}
        
        print("📋 Obteniendo instancias desde AWS...")
        for reservation in response.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instance_id = instance['InstanceId']
                instance_name = None
                
                # Obtener nombre desde tags
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
                    
                    print(f"  ✅ {instance_name}")
                    print(f"      ID: {instance_id}")
                    print(f"      IP Pública: {public_ip}")
                    print(f"      IP Privada: {private_ip}")
        
        return instances
        
    except Exception as e:
        print(f"❌ Error conectando a AWS: {e}")
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
        print("\n  1️⃣  Ejecutando sync-ips-to-config.py...")
        result = subprocess.run(['python3', 'sync-ips-to-config.py'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"     ⚠️  {result.stderr}")
        else:
            print("     ✅ sync-ips-to-config.py completado")
        
        print("\n  2️⃣  Ejecutando sync-ips-to-env.py...")
        result = subprocess.run(['python3', 'sync-ips-to-env.py'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"     ⚠️  {result.stderr}")
        else:
            print("     ✅ sync-ips-to-env.py completado")
        
        return True
        
    except Exception as e:
        print(f"❌ Error ejecutando sincronización: {e}")
        return False

def commit_and_push():
    """Hace commit y push de los cambios"""
    try:
        print("\n🔗 Haciendo commit y push...")
        
        subprocess.run(['git', 'add', 'config/', 'api-gateway/', 'micro-auth/', 
                       'micro-estudiantes/', 'micro-maestros/', 'micro-notificaciones/', 
                       'micro-messaging/', 'monitoring/', 'frontend-web/', '.env.generated', 
                       '.env.prod.frontend', 'docker-compose.frontend.yml'],
                      capture_output=True, timeout=10)
        
        result = subprocess.run(['git', 'commit', '-m', 'chore: Update instance IPs from AWS [local]'],
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
                print(f"  ⚠️  Error en push: {result.stderr}")
                return False
        else:
            print("  ℹ️  No hay cambios para commitar")
            return True
            
    except Exception as e:
        print(f"❌ Error en commit/push: {e}")
        return False

def main():
    print("=" * 70)
    print("🚀 ACTUALIZAR IPs DESDE AWS - LOCAL")
    print("=" * 70)
    print()
    
    # Obtener instancias desde AWS
    instances = fetch_instances_from_aws()
    if not instances:
        print("\n❌ No se pudieron obtener instancias de AWS")
        return 1
    
    # Actualizar archivo
    if not update_instance_ips_file(instances):
        print("\n❌ Error actualizando instance_ips.json")
        return 1
    
    # Sincronizar todas las configuraciones
    if not sync_all_configs():
        print("\n⚠️  Error en sincronización, continuando...")
    
    # Hacer commit y push
    if not commit_and_push():
        print("\n⚠️  Error en commit/push")
        return 1
    
    print("\n" + "=" * 70)
    print("✨ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE")
    print("=" * 70)
    print()
    print("📋 Resumen:")
    for name, info in instances.items():
        print(f"  {name}")
        print(f"    ID: {info['InstanceId']}")
        print(f"    IP Pública: {info['PublicIpAddress']}")
        print(f"    IP Privada: {info['PrivateIpAddress']}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
