#!/usr/bin/env python3
"""
Sincroniza las IPs de instancias EC2 a archivos .env de los microservicios
Lee desde config/instance_ips.json y actualiza los .env files
"""

import json
import os

def load_instance_ips():
    """Carga el archivo de IPs de instancias"""
    config_file = 'config/instance_ips.json'
    if not os.path.exists(config_file):
        print(f"❌ Error: {config_file} not found")
        return {}
    
    with open(config_file, 'r') as f:
        return json.load(f)

def update_env_file(file_path, key, value):
    """Actualiza o agrega una variable en un archivo .env"""
    if not os.path.exists(file_path):
        # Crear archivo si no existe
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            f.write(f"{key}={value}\n")
        return
    
    # Leer archivo existente
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Buscar y reemplazar la clave
    found = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}\n")
            found = True
        else:
            new_lines.append(line)
    
    # Si no encontró la clave, agregarla
    if not found:
        new_lines.append(f"{key}={value}\n")
    
    # Escribir archivo actualizado
    with open(file_path, 'w') as f:
        f.writelines(new_lines)

def sync_ips():
    """Sincroniza IPs a todos los .env files"""
    instances = load_instance_ips()
    
    # Mapeo de servicios a archivos .env
    services_config = {
        'EC2-API-Gateway': {
            'env_files': [
                'api-gateway/.env',
                'api-gateway/.env.local'
            ],
            'vars': {
                'EC2_API_GATEWAY_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_API_GATEWAY_PUBLIC_IP': 'PublicIpAddress',
                'GATEWAY_HOST': 'PrivateIpAddress',
                'GATEWAY_PORT': '8080',
            }
        },
        'EC2-CORE': {
            'env_files': [
                'micro-auth/.env',
                'micro-estudiantes/.env',
                'micro-maestros/.env',
                'api-gateway/.env',
                'api-gateway/.env.local'
            ],
            'vars': {
                'EC2_CORE_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_CORE_PUBLIC_IP': 'PublicIpAddress',
                'CORE_HOST': 'PrivateIpAddress',
                'CORE_PORT': '3000',
                'MICRO_AUTH_HOST': 'PrivateIpAddress',
                'MICRO_ESTUDIANTES_HOST': 'PrivateIpAddress',
                'MICRO_MAESTROS_HOST': 'PrivateIpAddress',
            }
        },
        'EC2-DB': {
            'env_files': [
                'micro-auth/.env',
                'micro-estudiantes/.env',
                'micro-maestros/.env',
                'api-gateway/.env',
                'api-gateway/.env.local'
            ],
            'vars': {
                'EC2_DB_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_DB_PUBLIC_IP': 'PublicIpAddress',
                'MONGODB_HOST': 'PrivateIpAddress',
                'DB_HOST': 'PrivateIpAddress',
            }
        },
        'EC2-Frontend': {
            'env_files': [
                'frontend-web/.env',
                'frontend-web/.env.local'
            ],
            'vars': {
                'EC2_FRONTEND_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_FRONTEND_PUBLIC_IP': 'PublicIpAddress',
            }
        },
        'EC2-Reporting': {
            'env_files': [
                'reporting/.env',
                'reporting/.env.local'
            ],
            'vars': {
                'EC2_REPORTING_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_REPORTING_PUBLIC_IP': 'PublicIpAddress',
            }
        },
        'EC2-Notificaciones': {
            'env_files': [
                'micro-notificaciones/.env',
                'micro-notificaciones/.env.local'
            ],
            'vars': {
                'EC2_NOTIFICACIONES_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_NOTIFICACIONES_PUBLIC_IP': 'PublicIpAddress',
            }
        },
        'EC2-Messaging': {
            'env_files': [
                'micro-messaging/.env',
                'micro-messaging/.env.local'
            ],
            'vars': {
                'EC2_MESSAGING_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_MESSAGING_PUBLIC_IP': 'PublicIpAddress',
            }
        },
        'EC2-Monitoring': {
            'env_files': [
                'monitoring/.env',
                'monitoring/.env.local'
            ],
            'vars': {
                'EC2_MONITORING_PRIVATE_IP': 'PrivateIpAddress',
                'EC2_MONITORING_PUBLIC_IP': 'PublicIpAddress',
            }
        }
    }
    
    print("🔄 Syncing instance IPs to .env files...")
    print()
    
    for service_name, config in services_config.items():
        if service_name not in instances:
            print(f"⚠️  {service_name} not found in config")
            continue
        
        instance = instances[service_name]
        print(f"📝 {service_name}")
        
        for env_file in config['env_files']:
            # Crear directorio si no existe
            os.makedirs(os.path.dirname(env_file), exist_ok=True)
            
            # Actualizar variables
            for var_name, ip_type in config['vars'].items():
                if ip_type in ['PrivateIpAddress', 'PublicIpAddress']:
                    value = instance.get(ip_type, 'N/A')
                else:
                    value = ip_type  # Es un valor literal
                
                update_env_file(env_file, var_name, value)
                print(f"  ✅ {env_file}: {var_name}={value}")
        
        print()
    
    print("✅ IP synchronization complete!")

if __name__ == '__main__':
    sync_ips()
