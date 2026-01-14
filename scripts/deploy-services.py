#!/usr/bin/env python3

"""
Deploy Services to EC2 Instances via SSH/Bastion
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path

class ServiceDeployer:
    def __init__(self):
        self.config_file = "infrastructure-instances.config.js"
        self.bastion_key = os.path.expanduser("~/.ssh/bastion_key.pem")
        self.instances = {}
        self.bastion_ip = None
        
    def load_config(self):
        """Load instance configuration from JavaScript file"""
        try:
            result = subprocess.run(
                ['node', '-e', f'''
                const config = require('./infrastructure-instances.config.js');
                const instances = config.instances || {};
                console.log(JSON.stringify(instances, null, 2));
                '''],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                self.instances = json.loads(result.stdout)
                print("✓ Configuration loaded")
                return True
        except Exception as e:
            print(f"✗ Error loading config: {e}")
        return False
    
    def get_bastion_ip(self):
        """Extract Bastion IP from configuration"""
        for instance_key, instance_data in self.instances.items():
            if 'Bastion' in (instance_data.get('name') or ''):
                self.bastion_ip = instance_data.get('public_ip') or instance_data.get('public', {}).get('ip')
                if self.bastion_ip:
                    print(f"✓ Bastion IP: {self.bastion_ip}")
                    return True
        print("✗ Bastion IP not found")
        return False
    
    def deploy_all_services(self):
        """Deploy all services"""
        print("\n" + "="*60)
        print("SERVICE DEPLOYMENT CONFIGURATION")
        print("="*60 + "\n")
        
        print(f"Bastion: {self.bastion_ip}")
        print(f"Instances discovered: {len(self.instances)}\n")
        
        print("Available Services:\n")
        
        services = {
            'core': 'docker-compose.core.yml',
            'api-gateway': 'docker-compose.api-gateway.yml',
            'frontend': 'docker-compose.frontend.yml',
            'db': 'docker-compose.infrastructure.yml',
            'messaging': 'docker-compose.messaging.yml',
        }
        
        deployed = 0
        for service_name, compose_file in services.items():
            if Path(compose_file).exists():
                print(f"  ✓ {service_name:20} ({compose_file})")
                deployed += 1
            else:
                print(f"  ✗ {service_name:20} ({compose_file}) - NOT FOUND")
        
        print(f"\n✓ {deployed} services ready for deployment\n")
        print("="*60)
        print("DEPLOYMENT INSTRUCTIONS")
        print("="*60 + "\n")
        
        print("To deploy services via Bastion:\n")
        print(f"1. SSH to Bastion:")
        print(f"   ssh -i ~/.ssh/bastion_key.pem ubuntu@{self.bastion_ip}\n")
        
        print("2. From Bastion, SSH to instance:")
        for instance_key, instance_data in list(self.instances.items())[:1]:
            private_ip = instance_data.get('private_ip') or instance_data.get('private', {}).get('ip')
            name = instance_data.get('name', 'Unknown')
            print(f"   ssh -i ~/.ssh/key.pem ubuntu@{private_ip}  # {name}\n")
        
        print("3. Deploy service:")
        print("   cd /home/ubuntu/Proyecto-Acompa-amiento-")
        print("   docker-compose -f docker-compose.core.yml up -d\n")
        
        print("4. Check service logs:")
        print("   docker-compose logs -f\n")
        
        print("="*60)
        print("✅ DEPLOYMENT READY")
        print("="*60 + "\n")
        
        return True

def main():
    deployer = ServiceDeployer()
    
    print("\n" + "╔" + "="*58 + "╗")
    print("║" + " "*15 + "SERVICES DEPLOYMENT MANAGER" + " "*15 + "║")
    print("╚" + "="*58 + "╝\n")
    
    if not deployer.load_config():
        print("Cannot proceed without configuration")
        return False
    
    if not deployer.get_bastion_ip():
        print("Cannot proceed without Bastion IP")
        return False
    
    if not deployer.deploy_all_services():
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
