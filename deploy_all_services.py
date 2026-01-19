#!/usr/bin/env python3
"""
Deploy all 10 EC2 microservices using SSH through bastion host.
Usage: python3 deploy_all_services.py <ssh_key_path> [bastion_ip]
"""

import subprocess
import json
import sys
import time
from pathlib import Path

# Configuration
BASTION_IP = "52.6.170.44"
BASTION_USER = "ubuntu"
SSH_USER = "ubuntu"

SERVICES = [
    {
        "name": "EC2-CORE",
        "docker_file": "docker-compose.ec2-core.yml",
        "timeout": 25,
    },
    {
        "name": "EC2-API-Gateway",
        "docker_file": "docker-compose.api-gateway.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-DB",
        "docker_file": "docker-compose.ec2-db.yml",
        "timeout": 20,
    },
    {
        "name": "EC2-Messaging",
        "docker_file": "docker-compose.messaging.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-Reportes",
        "docker_file": "docker-compose.ec2-reportes.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-Notificaciones",
        "docker_file": "docker-compose.ec2-notificaciones.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-Analytics",
        "docker_file": "docker-compose.ec2-analytics.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-Monitoring",
        "docker_file": "docker-compose.ec2-monitoring.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-Frontend",
        "docker_file": "docker-compose.ec2-frontend.yml",
        "timeout": 15,
    },
    {
        "name": "EC2-Analytics",
        "docker_file": "docker-compose.ec2-analytics.yml",
        "timeout": 15,
        "public_ip_fallback": "3.87.33.92",  # Use public IP if bastion routing fails
    },
    {
        "name": "EC-Bastion",
        "docker_file": "docker-compose.ec2-bastion.yml",
        "timeout": 15,
        "direct": True,  # Deploy directly to bastion, not via jump
    },
]

def load_instance_ips():
    """Load instance IPs from config file."""
    config_path = Path("config/instance_ips.json")
    if not config_path.exists():
        print(f"❌ Config file not found: {config_path}")
        sys.exit(1)
    
    with open(config_path) as f:
        return json.load(f)

def deploy_service(service, instance_ips, ssh_key):
    """Deploy a single service."""
    service_name = service["name"]
    docker_file = service["docker_file"]
    is_direct = service.get("direct", False)
    
    if service_name not in instance_ips:
        print(f"❌ {service_name}: Not found in instance config")
        return False
    
    if not Path(docker_file).exists():
        print(f"❌ {service_name}: Docker-compose file not found: {docker_file}")
        return False
    
    instance = instance_ips[service_name]
    private_ip = instance["PrivateIpAddress"]
    public_ip_fallback = service.get("public_ip_fallback")
    
    print(f"\n🚀 Deploying {service_name}...")
    
    # Build SSH command
    ssh_opts = [
        "ssh",
        "-o", "ConnectTimeout=15",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "LogLevel=ERROR",
        "-i", str(ssh_key),
    ]
    
    if is_direct:
        # Direct SSH to Bastion
        ssh_opts.append(f"{SSH_USER}@{BASTION_IP}")
    elif public_ip_fallback:
        # Try public IP directly if available (for services with routing issues through bastion)
        ssh_opts.append(f"{SSH_USER}@{public_ip_fallback}")
        print(f"  ℹ️  Using public IP fallback: {public_ip_fallback}")
    else:
        # SSH jump through bastion - use ProxyCommand for more reliability
        ssh_opts.extend([
            "-o", f"ProxyCommand=ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=15 -i {ssh_key} -W %h:%p {BASTION_USER}@{BASTION_IP}",
            f"{SSH_USER}@{private_ip}",
        ])
    
    # Read docker-compose file content
    try:
        with open(docker_file, 'r') as f:
            docker_compose_content = f.read()
    except IOError as e:
        print(f"❌ {service_name}: Could not read {docker_file}: {e}")
        return False
    
    # Deployment script - write docker-compose file first, then deploy
    deploy_script = f"""
# Write docker-compose file
mkdir -p /tmp/deploy
cat > /tmp/deploy/{docker_file} << 'EOF_DOCKER_COMPOSE'
{docker_compose_content}
EOF_DOCKER_COMPOSE

# For Bastion, install docker-compose if needed
which docker-compose >/dev/null 2>&1 || (sudo apt-get update -qq 2>/dev/null && sudo apt-get install -y docker-compose >/dev/null 2>&1) || true

cd /tmp/deploy
docker-compose -f {docker_file} down 2>/dev/null || true
docker-compose -f {docker_file} up -d --no-build 2>&1 | head -15
sleep 3
docker-compose -f {docker_file} ps
"""
    
    try:
        result = subprocess.run(
            ssh_opts + ["bash", "-s"],
            input=deploy_script,
            text=True,
            timeout=service["timeout"] * 60,
            capture_output=True,
        )
        
        if result.returncode == 0:
            print(f"✅ {service_name}: Deployment successful")
            print(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
            return True
        else:
            print(f"❌ {service_name}: Deployment failed")
            print(f"Error: {result.stderr[-500:]}")
            return False
    
    except subprocess.TimeoutExpired:
        print(f"⏱️  {service_name}: Deployment timed out after {service['timeout']} minutes")
        return False
    except Exception as e:
        print(f"❌ {service_name}: Error: {e}")
        return False

def main():
    """Main deployment orchestrator."""
    if len(sys.argv) < 2:
        print("Usage: python3 deploy_all_services.py <ssh_key_path> [bastion_ip]")
        sys.exit(1)
    
    ssh_key = Path(sys.argv[1])
    if not ssh_key.exists():
        print(f"❌ SSH key not found: {ssh_key}")
        sys.exit(1)
    
    if len(sys.argv) > 2:
        global BASTION_IP
        BASTION_IP = sys.argv[2]
    
    print("📋 Loading instance configuration...")
    instance_ips = load_instance_ips()
    
    print(f"🔑 Using SSH key: {ssh_key}")
    print(f"🛡️  Bastion: {BASTION_IP}")
    print(f"📦 Deploying {len(SERVICES)} services...\n")
    
    results = {}
    for service in SERVICES:
        success = deploy_service(service, instance_ips, ssh_key)
        results[service["name"]] = success
    
    # Summary
    print("\n" + "="*60)
    print("📊 DEPLOYMENT SUMMARY")
    print("="*60)
    
    success_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    for service_name, success in results.items():
        status = "✅" if success else "❌"
        print(f"{status} {service_name}")
    
    print("="*60)
    print(f"Result: {success_count}/{total_count} services deployed successfully")
    
    return 0 if success_count == total_count else 1

if __name__ == "__main__":
    sys.exit(main())
