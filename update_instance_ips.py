import boto3
import json
import os
import re

# Mapeo de nombres de instancias a identificadores
INSTANCE_MAPPING = {
    'bastion': {'type': 'bastion', 'name_pattern': 'EC-?Bastion|bastion', 'ssh_host': 'bastion'},
    'core': {'type': 'service', 'name_pattern': 'EC2-CORE|core', 'ssh_host': 'core'},
    'db': {'type': 'database', 'name_pattern': 'EC2-DB|database|db', 'ssh_host': 'db'},
    'frontend': {'type': 'service', 'name_pattern': 'EC2-Frontend|frontend', 'ssh_host': 'frontend'},
    'api-gateway': {'type': 'service', 'name_pattern': 'EC2-API|api-gateway', 'ssh_host': 'api-gateway'},
    'messaging': {'type': 'service', 'name_pattern': 'messaging', 'ssh_host': 'messaging'},
    'monitoring': {'type': 'service', 'name_pattern': 'EC2-Monitoring|monitoring', 'ssh_host': 'monitoring'},
    'notificaciones': {'type': 'service', 'name_pattern': 'EC2-Notificaciones|notificaciones', 'ssh_host': 'notificaciones'},
    'reportes': {'type': 'service', 'name_pattern': 'EC2-Reportes|reportes', 'ssh_host': 'reportes'},
}

def get_instance_details():
    """Obtiene detalles de instancias EC2 con sus IPs públicas y privadas"""
    # Usar región de entorno o defaultear a us-east-1
    region = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1'
    ec2 = boto3.client('ec2', region_name=region)
    response = ec2.describe_instances()
    
    instances = {}
    
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            if instance['State']['Name'] == 'running':
                # Obtener nombre de la instancia del tag 'Name'
                instance_name = None
                if 'Tags' in instance:
                    for tag in instance['Tags']:
                        if tag['Key'] == 'Name':
                            instance_name = tag['Value']
                            break
                
                instance_info = {
                    'InstanceId': instance['InstanceId'],
                    'Name': instance_name or 'Unknown',
                    'PublicIpAddress': instance.get('PublicIpAddress', 'N/A'),
                    'PrivateIpAddress': instance.get('PrivateIpAddress', 'N/A'),
                    'Type': instance.get('InstanceType', 'unknown')
                }
                
                instances[instance_name or instance['InstanceId']] = instance_info
    
    return instances

def map_instances(instances):
    """Mapea instancias a configuraciones conocidas"""
    mapped = {}
    
    for key, config in INSTANCE_MAPPING.items():
        pattern = config['name_pattern']
        for instance_name, instance_info in instances.items():
            if re.search(pattern, instance_name, re.IGNORECASE):
                mapped[key] = instance_info
                break
    
    return mapped

def update_ssh_config(instances):
    """Actualiza .ssh/config con las nuevas IPs públicas"""
    ssh_config_path = '.ssh/config'
    
    if not os.path.exists(ssh_config_path):
        print(f"⚠️  SSH config not found: {ssh_config_path}")
        return
    
    with open(ssh_config_path, 'r') as f:
        lines = f.readlines()
    
    # Actualizar cada host con su nueva IP pública
    for key, instance_info in instances.items():
        if instance_info['PublicIpAddress'] != 'N/A':
            host_name = INSTANCE_MAPPING[key]['ssh_host']
            new_ip = instance_info['PublicIpAddress']
            
            # Buscar la sección del host y actualizar HostName
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                
                # Buscar línea "Host <nombre>"
                if line.startswith(f"Host {host_name}"):
                    # Buscar la siguiente línea "HostName"
                    j = i + 1
                    while j < len(lines) and (lines[j].startswith(' ') or lines[j].startswith('\t')):
                        if lines[j].strip().startswith('HostName'):
                            # Reemplazar la IP
                            indent = len(lines[j]) - len(lines[j].lstrip())
                            lines[j] = ' ' * indent + f'HostName {new_ip}\n'
                            print(f"✅ Updated SSH config for host '{host_name}': {new_ip}")
                            break
                        j += 1
                i += 1
    
    with open(ssh_config_path, 'w') as f:
        f.writelines(lines)

def update_env_aws(instances):
    """Actualiza .env.aws con las IPs privadas, especialmente la de BD"""
    env_file_path = '.env.aws'
    
    if not os.path.exists(env_file_path):
        print(f"⚠️  .env.aws not found: {env_file_path}")
        return
    
    with open(env_file_path, 'r') as f:
        lines = f.readlines()
    
    db_private_ip = instances.get('db', {}).get('PrivateIpAddress', 'N/A')
    
    if db_private_ip == 'N/A':
        print("⚠️  Database private IP not found")
        return
    
    updated_lines = []
    db_vars = ['DB_HOST', 'MONGO_URL', 'MONGO_URI', 'POSTGRES_HOST', 'REDIS_HOST', 'REDIS_URL']
    
    for line in lines:
        updated = False
        for var in db_vars:
            if line.startswith(var + '='):
                if 'IP_PRIVADA_EC2_DB' in line:
                    # Reemplazar placeholder
                    new_line = line.replace('IP_PRIVADA_EC2_DB', db_private_ip)
                    updated_lines.append(new_line)
                    if var == 'DB_HOST':
                        print(f"✅ Updated .env.aws: {var} = {db_private_ip}")
                    updated = True
                    break
                elif db_private_ip not in line:
                    # Reemplazar IP antigua por nueva
                    old_ip_match = re.search(r'(\d+\.\d+\.\d+\.\d+)', line)
                    if old_ip_match:
                        new_line = line.replace(old_ip_match.group(1), db_private_ip)
                        updated_lines.append(new_line)
                        if var == 'DB_HOST':
                            print(f"✅ Updated .env.aws: {var} = {db_private_ip}")
                        updated = True
                        break
        
        if not updated:
            updated_lines.append(line)
    
    with open(env_file_path, 'w') as f:
        f.writelines(updated_lines)

def save_instance_ips_backup(instances):
    """Guarda un respaldo de las IPs en config/instance_ips.json"""
    config_file_path = 'config/instance_ips.json'
    os.makedirs(os.path.dirname(config_file_path), exist_ok=True)
    
    # Convertir a formato JSON serializable
    instances_json = {k: v for k, v in instances.items()}
    
    with open(config_file_path, 'w') as f:
        json.dump(instances_json, f, indent=4)
    
    print(f"✅ Backup saved: {config_file_path}")

if __name__ == "__main__":
    print("🚀 Fetching instance IPs from AWS...")
    instances = get_instance_details()
    
    print(f"\n📋 Found {len(instances)} running instances:")
    for name, info in instances.items():
        print(f"  - {name}: Public={info['PublicIpAddress']}, Private={info['PrivateIpAddress']}")
    
    print("\n🔄 Mapping instances to configuration...")
    mapped_instances = map_instances(instances)
    
    print("\n📝 Updating configuration files...")
    update_ssh_config(mapped_instances)
    update_env_aws(mapped_instances)
    save_instance_ips_backup(instances)
    
    print("\n✅ Configuration files updated successfully!")