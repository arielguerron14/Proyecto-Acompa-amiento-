#!/usr/bin/env python3
"""
Script para obtener IPs de instancias EC2 desde config/instance_ips.json
Uso: python3 get_instance_ip.py <instance_name>
Ejemplo: python3 get_instance_ip.py api-gateway
"""

import json
import sys
import os

# Mapeo de nombres de servicio a nombres de instancia
SERVICE_MAPPING = {
    'api-gateway': 'EC2-API-Gateway',
    'EC2-API-Gateway': 'EC2-API-Gateway',
    'bastion': 'EC-Bastion',
    'EC-Bastion': 'EC-Bastion',
    'core': 'EC2-CORE',
    'EC2-CORE': 'EC2-CORE',
    'database': 'EC2-DB',
    'db': 'EC2-DB',
    'EC2-DB': 'EC2-DB',
    'analytics': 'EC2-Reportes',
    'EC2-Reportes': 'EC2-Reportes',
    'monitoring': 'EC2-Monitoring',
    'EC2-Monitoring': 'EC2-Monitoring',
    'notificaciones': 'EC2-Notificaciones',
    'EC2-Notificaciones': 'EC2-Notificaciones',
    'messaging': 'EC2-Messaging',
    'EC2-Messaging': 'EC2-Messaging',
    'frontend': 'EC2-Frontend',
    'EC2-Frontend': 'EC2-Frontend',
    'reportes': 'EC2-Reportes',
}

def get_instance_ip(service_name):
    """Obtiene la IP pública de una instancia desde config/instance_ips.json"""
    
    config_file = 'config/instance_ips.json'
    
    if not os.path.exists(config_file):
        print(f"Error: {config_file} not found. Run update_instance_ips.py first.", file=sys.stderr)
        sys.exit(1)
    
    try:
        with open(config_file, 'r') as f:
            instances = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {config_file}", file=sys.stderr)
        sys.exit(1)
    
    # Mapear nombre del servicio al nombre de la instancia
    instance_name = SERVICE_MAPPING.get(service_name, service_name)
    
    # Buscar la instancia
    if instance_name in instances:
        ip = instances[instance_name].get('PublicIpAddress')
        if ip and ip != 'N/A':
            return ip
    
    # Si no encontró por nombre exacto, buscar por patrón
    for name, info in instances.items():
        if instance_name.lower() in name.lower() or name.lower() in instance_name.lower():
            ip = info.get('PublicIpAddress')
            if ip and ip != 'N/A':
                return ip
    
    print(f"Error: Instance '{service_name}' not found in {config_file}", file=sys.stderr)
    print(f"Available instances: {list(instances.keys())}", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 get_instance_ip.py <service_name>", file=sys.stderr)
        print("Example: python3 get_instance_ip.py api-gateway", file=sys.stderr)
        sys.exit(1)
    
    service_name = sys.argv[1]
    ip = get_instance_ip(service_name)
    print(ip)
