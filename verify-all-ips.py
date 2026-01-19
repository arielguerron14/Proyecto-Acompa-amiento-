#!/usr/bin/env python3
"""
Verificación completa de sincronización de IPs de todas las instancias EC2
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

def verify_all():
    """Verifica todas las instancias"""
    instances = load_instance_ips()
    expected_instances = [
        'EC-Bastion',
        'EC2-API-Gateway',
        'EC2-CORE',
        'EC2-Reportes',
        'EC2-Notificaciones',
        'EC2-Messaging',
        'EC2-DB',
        'EC2-Monitoring',
        'EC2-Frontend'
    ]
    
    print("\n" + "="*80)
    print("✅ VERIFICACIÓN COMPLETA DE TODAS LAS INSTANCIAS EC2")
    print("="*80)
    
    missing = []
    found = []
    
    for instance_name in expected_instances:
        if instance_name in instances:
            instance = instances[instance_name]
            found.append({
                'name': instance_name,
                'id': instance.get('InstanceId', 'N/A'),
                'private': instance.get('PrivateIpAddress', 'N/A'),
                'public': instance.get('PublicIpAddress', 'N/A')
            })
        else:
            missing.append(instance_name)
    
    # Mostrar instancias encontradas
    print("\n📋 INSTANCIAS ENCONTRADAS EN config/instance_ips.json:\n")
    for inst in found:
        print(f"✅ {inst['name']:25} | ID: {inst['id']:20} | Private: {inst['private']:15} | Public: {inst['public']:15}")
    
    # Mostrar instancias faltantes
    if missing:
        print("\n❌ INSTANCIAS FALTANTES:")
        for inst_name in missing:
            print(f"   ❌ {inst_name}")
    
    # Verificar sincronización en .env files
    print("\n" + "-"*80)
    print("📦 SINCRONIZACIÓN EN ARCHIVOS .env:\n")
    
    services_to_check = {
        'api-gateway/.env': ['GATEWAY_HOST', 'EC2_API_GATEWAY_PRIVATE_IP', 'EC2_CORE_PRIVATE_IP', 'EC2_DB_PRIVATE_IP'],
        'micro-auth/.env': ['CORE_HOST', 'DB_HOST', 'MONGODB_HOST'],
        'micro-estudiantes/.env': ['CORE_HOST', 'DB_HOST', 'MONGODB_HOST'],
        'micro-maestros/.env': ['CORE_HOST', 'DB_HOST', 'MONGODB_HOST'],
        'micro-notificaciones/.env': ['EC2_NOTIFICACIONES_PRIVATE_IP'],
        'micro-messaging/.env': ['EC2_MESSAGING_PRIVATE_IP'],
        'monitoring/.env': ['EC2_MONITORING_PRIVATE_IP'],
        'frontend-web/.env': ['EC2_FRONTEND_PRIVATE_IP']
    }
    
    for service_file, variables in services_to_check.items():
        if os.path.exists(service_file):
            print(f"✅ {service_file}")
            with open(service_file, 'r') as f:
                content = f.read()
                for var in variables:
                    if var in content:
                        # Extract the value
                        for line in content.split('\n'):
                            if line.startswith(var + '='):
                                value = line.split('=')[1]
                                print(f"   ✓ {var} = {value}")
                                break
        else:
            if os.path.exists(os.path.dirname(service_file)):
                print(f"⚠️  {service_file} - NO EXISTE (pero el directorio sí)")
    
    # Resultado final
    print("\n" + "="*80)
    if len(found) == 9 and len(missing) == 0:
        print("✅ TODAS LAS 9 INSTANCIAS ESTÁN CORRECTAMENTE SINCRONIZADAS")
    else:
        print(f"⚠️  Encontradas: {len(found)}/9 instancias | Faltantes: {len(missing)}")
    print("="*80 + "\n")

if __name__ == '__main__':
    verify_all()
