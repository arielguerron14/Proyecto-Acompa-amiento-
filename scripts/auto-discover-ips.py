#!/usr/bin/env python3
"""
Auto-discover EC2 instances and update project configuration with current IPs.
This script discovers all running EC2 instances tagged with Project=lab-8-ec2,
gathers their IPs (private, public, and elastic), and updates the project
configuration files accordingly.
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

def run_command(cmd, shell=False):
    """Execute a shell command and return output."""
    try:
        result = subprocess.run(
            cmd,
            shell=shell,
            capture_output=True,
            text=True,
            check=False
        )
        return result.stdout.strip(), result.returncode, result.stderr
    except Exception as e:
        print(f"❌ Error executing command: {e}")
        return "", 1, str(e)

def discover_instances():
    """Discover EC2 instances and their IPs."""
    print("🔍 Discovering EC2 instances...")
    
    # Query instances
    cmd = [
        "aws", "ec2", "describe-instances",
        "--filters",
        "Name=tag:Project,Values=lab-8-ec2",
        "Name=instance-state-name,Values=running",
        "--query",
        "Reservations[*].Instances[*].[Tags[?Key==`Name`].Value|[0],InstanceId,PrivateIpAddress,PublicIpAddress]",
        "--output", "json",
        "--region", "us-east-1"
    ]
    
    output, code, err = run_command(cmd)
    if code != 0:
        print(f"❌ Failed to query instances: {err}")
        return None, None
    
    instances_raw = json.loads(output)
    
    # Query Elastic IPs
    cmd_eip = [
        "aws", "ec2", "describe-addresses",
        "--query", "Addresses[*].[InstanceId,PublicIp,AllocationId]",
        "--output", "json",
        "--region", "us-east-1"
    ]
    
    eip_output, code, err = run_command(cmd_eip)
    if code != 0:
        print(f"⚠️  Failed to query Elastic IPs: {err}")
        elastic_ips = {}
    else:
        eip_data = json.loads(eip_output)
        elastic_ips = {item[0]: item[1] for item in eip_data if item[0]}
    
    # Process instances
    instances = {}
    for reservation in instances_raw:
        for instance in reservation:
            if instance[0]:  # Has Name tag
                instance_id = instance[1]
                instances[instance[0]] = {
                    "instance_id": instance_id,
                    "private_ip": instance[2],
                    "public_ip": instance[3] or instance[2],
                    "elastic_ip": elastic_ips.get(instance_id, instance[3] or instance[2]),
                    "state": "running"
                }
    
    return instances, elastic_ips

def generate_config(instances):
    """Generate Node.js configuration file."""
    config_content = f'''/**
 * AUTO-GENERATED: Instance Configuration with Dynamic IPs
 * Generated: {datetime.utcnow().isoformat()}Z
 * Do NOT edit manually - Updated automatically by CI/CD pipeline
 */

module.exports = {{
  // Instance IP mappings - For inter-service communication
  instances: {json.dumps(instances, indent=4)},
  
  // Service routing configuration
  services: {{
    frontend: {{
      name: 'EC2-Frontend',
      ports: {{ http: 3000, https: 3001 }},
      health: '/health'
    }},
    api_gateway: {{
      name: 'EC2-API-Gateway',
      ports: {{ http: 8080, https: 8443 }},
      health: '/api/health'
    }},
    core: {{
      name: 'EC2-CORE',
      ports: {{ http: 8081, https: 8444 }},
      health: '/api/status'
    }},
    database: {{
      name: 'EC2-DB',
      ports: {{ postgres: 5432 }}
    }},
    messaging: {{
      name: 'EC2-Messaging',
      ports: {{ amqp: 5672, http: 15672 }}
    }},
    notifications: {{
      name: 'EC2-Notificaciones',
      ports: {{ http: 8082, https: 8445 }},
      health: '/notifications/health'
    }},
    reports: {{
      name: 'EC2-Reportes',
      ports: {{ http: 8083, https: 8446 }},
      health: '/reports/health'
    }},
    monitoring: {{
      name: 'EC2-Monitoring',
      ports: {{ prometheus: 9090, grafana: 3000 }},
      health: '/-/healthy'
    }}
  }},
  
  // Helper to get instance IP
  getInstanceIP: function(instanceName, ipType = 'private') {{
    const instance = this.instances[instanceName];
    if (!instance) return null;
    switch(ipType.toLowerCase()) {{
      case 'public': return instance.public_ip;
      case 'elastic': return instance.elastic_ip;
      default: return instance.private_ip;
    }}
  }},
  
  // Helper to get service URL
  getServiceURL: function(serviceName, protocol = 'http') {{
    const service = this.services[serviceName];
    if (!service) return null;
    const instance = this.instances[service.name];
    if (!instance) return null;
    const port = protocol === 'https' ? service.ports.https : service.ports.http;
    return `${{protocol}}://${{instance.private_ip}}:${{port}}`;
  }}
}};
'''
    return config_content

def generate_env_file(instances):
    """Generate .env file with instance IPs."""
    bastion = instances.get("EC-Bastion", {})
    frontend = instances.get("EC2-Frontend", {})
    api = instances.get("EC2-API-Gateway", {})
    core = instances.get("EC2-CORE", {})
    db = instances.get("EC2-DB", {})
    messaging = instances.get("EC2-Messaging", {})
    
    env_content = f'''# Auto-generated environment variables
# Timestamp: {datetime.utcnow().isoformat()}Z

# === INSTANCE IPs ===
# Internal Communication (Private IPs)
FRONTEND_PRIVATE={frontend.get('private_ip', 'UNKNOWN')}
API_PRIVATE={api.get('private_ip', 'UNKNOWN')}
CORE_PRIVATE={core.get('private_ip', 'UNKNOWN')}
DB_PRIVATE={db.get('private_ip', 'UNKNOWN')}
MESSAGING_PRIVATE={messaging.get('private_ip', 'UNKNOWN')}

# External Access (Public/Elastic IPs)
FRONTEND_PUBLIC={frontend.get('public_ip', 'UNKNOWN')}
API_PUBLIC={api.get('public_ip', 'UNKNOWN')}
CORE_PUBLIC={core.get('public_ip', 'UNKNOWN')}
DB_PUBLIC={db.get('public_ip', 'UNKNOWN')}
BASTION_PUBLIC={bastion.get('public_ip', 'UNKNOWN')}

# Elastic IPs (Static)
FRONTEND_ELASTIC={frontend.get('elastic_ip', 'UNKNOWN')}
API_ELASTIC={api.get('elastic_ip', 'UNKNOWN')}
CORE_ELASTIC={core.get('elastic_ip', 'UNKNOWN')}

# === SERVICE CONFIGURATION ===
DATABASE_HOST={db.get('private_ip', 'UNKNOWN')}
DATABASE_PORT=5432
DATABASE_URL=postgresql://user:pass@{db.get('private_ip', 'UNKNOWN')}:5432/acompanamiento

RABBITMQ_HOST={messaging.get('private_ip', 'UNKNOWN')}
RABBITMQ_PORT=5672
RABBITMQ_URL=amqp://guest:guest@{messaging.get('private_ip', 'UNKNOWN')}:5672/

API_GATEWAY_HOST={api.get('private_ip', 'UNKNOWN')}
API_GATEWAY_PORT=8080

CORE_SERVICE_HOST={core.get('private_ip', 'UNKNOWN')}
CORE_SERVICE_PORT=8081

# === BASTION GATEWAY ===
BASTION_HOST={bastion.get('public_ip', 'UNKNOWN')}
BASTION_USER=ubuntu
BASTION_PORT=22
'''
    return env_content

def generate_summary(instances):
    """Generate a summary report."""
    summary = """
╔════════════════════════════════════════════════════════════╗
║         INSTANCES DISCOVERY & CONFIGURATION UPDATE        ║
╚════════════════════════════════════════════════════════════╝

📋 Discovered Instances:
"""
    
    for name, data in instances.items():
        summary += f"""
  {name}:
    • Instance ID: {data['instance_id']}
    • Private IP:  {data['private_ip']}
    • Public IP:   {data['public_ip']}
    • Elastic IP:  {data['elastic_ip']}
"""
    
    summary += """
✅ Configuration Files Generated:
  • infrastructure-instances.config.js (Node.js config with dynamic IPs)
  • .env.generated (Environment variables for Docker/services)

🔗 These files contain:
  ✓ All instance IPs (private, public, elastic)
  ✓ Service routing configuration
  ✓ Helper functions for IP lookup
  ✓ Database and messaging configurations
  ✓ Bastion gateway configuration for external access

"""
    return summary

def commit_changes(instances):
    """Commit generated files to git."""
    print("📝 Committing changes to git...")
    
    # Check if there are changes
    cmd = ["git", "status", "--porcelain"]
    output, code, _ = run_command(cmd)
    
    if not output:
        print("⚠️  No changes to commit")
        return True
    
    # Add files
    cmd = ["git", "add", "infrastructure-instances.config.js", ".env.generated"]
    run_command(cmd)
    
    # Commit
    cmd = [
        "git", "commit", "-m",
        f"chore: Auto-update instance configuration with current IPs\n\n- Updated with discovered EC2 instance IPs\n- Timestamp: {datetime.utcnow().isoformat()}Z"
    ]
    output, code, err = run_command(cmd)
    
    if code != 0:
        print(f"❌ Commit failed: {err}")
        return False
    
    print("✅ Changes committed")
    
    # Push
    cmd = ["git", "push"]
    output, code, err = run_command(cmd)
    
    if code != 0:
        print(f"⚠️  Push failed: {err}")
        return False
    
    print("✅ Changes pushed to repository")
    return True

def main():
    """Main execution."""
    print("🚀 Starting auto-discovery of EC2 instances...\n")
    
    # Discover instances
    instances, elastic_ips = discover_instances()
    if not instances:
        print("❌ Failed to discover instances")
        sys.exit(1)
    
    print(f"✅ Discovered {len(instances)} instances\n")
    
    # Generate configuration
    config_content = generate_config(instances)
    env_content = generate_env_file(instances)
    summary = generate_summary(instances)
    
    # Write files
    print("📝 Generating configuration files...")
    with open("infrastructure-instances.config.js", "w") as f:
        f.write(config_content)
    print("   ✅ infrastructure-instances.config.js")
    
    with open(".env.generated", "w") as f:
        f.write(env_content)
    print("   ✅ .env.generated\n")
    
    # Commit changes
    commit_changes(instances)
    
    # Print summary
    print(summary)
    
    print("🎉 Auto-discovery and configuration update completed!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
