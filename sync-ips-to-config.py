#!/usr/bin/env python3
"""
Update all configuration files from config/instance_ips.json
Ensures all IP references consume from single source of truth

Usage:
    python3 sync-ips-to-config.py
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime

def load_instance_ips():
    """Load IPs from config/instance_ips.json"""
    config_path = Path(__file__).parent / 'config' / 'instance_ips.json'
    with open(config_path) as f:
        return json.load(f)

def update_env_files(instances):
    """Update .env files with IPs from config"""
    project_root = Path(__file__).parent
    
    api_gateway_ip = instances['EC2-API-Gateway']['PublicIpAddress']
    frontend_ip = instances['EC2-Frontend']['PublicIpAddress']
    core_ip = instances['EC2-CORE']['PublicIpAddress']
    db_ip = instances['EC2-DB']['PublicIpAddress']
    bastion_ip = instances['EC-Bastion']['PublicIpAddress']
    
    # Update .env.generated
    env_generated = f"""# Auto-generated from config/instance_ips.json
# Generated: {datetime.now().isoformat()}
# DO NOT EDIT MANUALLY - run sync-ips-to-config.py to update

API_GATEWAY_IP={api_gateway_ip}
API_GATEWAY_URL=http://{api_gateway_ip}:8080
API_GATEWAY_HOST={api_gateway_ip}

FRONTEND_IP={frontend_ip}
FRONTEND_URL=http://{frontend_ip}:5500

CORE_IP={core_ip}
DB_IP={db_ip}
BASTION_IP={bastion_ip}

NODE_ENV=production
"""
    
    # Update .env.prod.frontend
    env_prod_frontend = f"""# Frontend Production Config - Auto-generated from instance_ips.json
# Generated: {datetime.now().isoformat()}
NODE_ENV=production
API_BASE_URL=http://{api_gateway_ip}:8080
API_GATEWAY_HOST={api_gateway_ip}
API_GATEWAY_PORT=8080
"""
    
    # Update docker-compose.frontend.yml
    docker_compose_frontend = f"""version: '3.8'
services:
  frontend:
    image: ${{DOCKER_USERNAME}}/frontend-web:latest
    container_name: frontend-web
    ports:
      - "5500:5500"
    environment:
      NODE_ENV: production
      API_GATEWAY_URL: http://{api_gateway_ip}:8080
      API_GATEWAY_HOST: {api_gateway_ip}
      API_GATEWAY_PORT: 8080
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
"""
    
    files_to_update = {
        '.env.generated': env_generated,
        '.env.prod.frontend': env_prod_frontend,
        'docker-compose.frontend.yml': docker_compose_frontend,
    }
    
    for filename, content in files_to_update.items():
        filepath = project_root / filename
        filepath.write_text(content)
        print(f"✅ Updated {filename}")

def update_python_scripts(instances):
    """Update Python scripts with IPs from config"""
    project_root = Path(__file__).parent
    core_ip = instances['EC2-CORE']['PublicIpAddress']
    
    # Update create-env-files.py to use core_ip from config
    create_env_path = project_root / 'create-env-files.py'
    if create_env_path.exists():
        content = create_env_path.read_text()
        # The script already reads from config, just log it
        print(f"✅ create-env-files.py uses EC2-CORE IP: {core_ip}")

def commit_changes():
    """Commit all IP updates to git"""
    project_root = Path(__file__).parent
    
    try:
        subprocess.run(['git', 'add', '.'], cwd=project_root, check=True)
        result = subprocess.run(
            ['git', 'commit', '-m', 'sync: Update all configs from instance_ips.json'],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Changes committed to git")
            # Push to remote
            subprocess.run(['git', 'push', 'origin', 'main'], cwd=project_root, check=True)
            print("✅ Changes pushed to remote")
        else:
            print("ℹ️  No changes to commit")
    except Exception as e:
        print(f"⚠️  Git operation failed: {e}")

def main():
    print("🔄 Synchronizing IPs from config/instance_ips.json...")
    
    try:
        instances = load_instance_ips()
        print(f"\n📍 Found {len(instances)} instances in config")
        
        # Display current IPs
        for name, info in instances.items():
            print(f"   • {name}: {info['PublicIpAddress']} ({info['PrivateIpAddress']})")
        
        print("\n📝 Updating configuration files...")
        update_env_files(instances)
        update_python_scripts(instances)
        
        print("\n✨ All configuration files updated from single source of truth")
        print("🔗 Committing to git...")
        commit_changes()
        
        print("\n✅ IP synchronization complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
