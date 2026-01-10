#!/usr/bin/env python3
"""
Direct SSH diagnostics for EC2 instances
Requires SSH key to be available or configured
"""

import subprocess
import sys

instances = [
    ("EC2_MESSAGING", "44.221.50.177", "ubuntu"),
    ("EC2_MONITORING", "54.198.235.28", "ubuntu"),
]

def run_ssh_command(host, user, command, key_file=None):
    """Execute SSH command"""
    try:
        ssh_cmd = ["ssh"]
        
        if key_file:
            ssh_cmd.extend(["-i", key_file])
        
        ssh_cmd.extend([
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "ConnectTimeout=10",
            f"{user}@{host}",
            command
        ])
        
        result = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=15)
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

print("\n" + "="*70)
print("EC2 INSTANCES SSH DIAGNOSTICS")
print("="*70 + "\n")

for instance_name, ip, user in instances:
    print(f"[{instance_name}] {ip}")
    print("-" * 70)
    
    # Test SSH connection
    code, out, err = run_ssh_command(ip, user, "echo OK", None)
    
    if code == 0:
        print(f"✅ SSH connection successful\n")
        
        # Get Docker status
        print("📦 Docker containers:")
        code, out, err = run_ssh_command(ip, user, "docker ps -a", None)
        if code == 0:
            for line in out.split('\n')[:6]:  # Show first 6 lines
                print(f"   {line}")
        else:
            print(f"   ⚠️  Could not get docker ps: {err[:100]}")
        
        print()
        
        # Get Docker logs for failed services
        if "messaging" in instance_name.lower():
            print("📋 Kafka logs (last 10 lines):")
            code, out, err = run_ssh_command(ip, user, "docker logs proyecto-kafka 2>&1 | tail -10", None)
            if code == 0:
                for line in out.split('\n')[-10:]:
                    if line.strip():
                        print(f"   {line}")
            
            print()
            print("📋 Prometheus logs (if exists):")
            code, out, err = run_ssh_command(ip, user, "docker logs proyecto-prometheus 2>&1 | tail -5", None)
            if code == 0:
                for line in out.split('\n')[-5:]:
                    if line.strip():
                        print(f"   {line}")
        
        elif "monitoring" in instance_name.lower():
            print("📋 Prometheus logs:")
            code, out, err = run_ssh_command(ip, user, "docker logs proyecto-prometheus 2>&1 | tail -10", None)
            if code == 0:
                for line in out.split('\n')[-10:]:
                    if line.strip():
                        print(f"   {line}")
        
        print()
        
        # Check docker-compose.yml exists
        code, out, err = run_ssh_command(ip, user, "ls -lh ~/app/docker-compose.yml", None)
        if code == 0:
            print(f"✓ docker-compose.yml exists")
        else:
            print(f"⚠️  docker-compose.yml not found")
        
    else:
        print(f"❌ SSH connection failed: {err[:150]}\n")
    
    print()

print("="*70)
