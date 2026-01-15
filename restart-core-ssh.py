#!/usr/bin/env python3
import subprocess
import sys
import time

CORE_IP = "3.237.39.196"
CORE_USER = "ubuntu"
SSH_KEY = "./ssh-key-ec2.pem"

def run_ssh_command(cmd):
    """Execute command via SSH"""
    full_cmd = f"ssh -i {SSH_KEY} -o StrictHostKeyChecking=no {CORE_USER}@{CORE_IP} \"{cmd}\""
    print(f"  Running: {cmd[:80]}...")
    try:
        result = subprocess.run(full_cmd, shell=True, capture_output=True, text=True, timeout=60)
        if result.stdout:
            print(result.stdout)
        if result.returncode != 0 and result.stderr:
            print(f"ERROR: {result.stderr}")
        return result.returncode == 0
    except Exception as e:
        print(f"Exception: {e}")
        return False

print(f"🔄 Connecting to EC2-Core ({CORE_IP})...\n")

# List current containers
print("📦 Current containers:")
run_ssh_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}'")

# Stop
print("\n⬇️  Stopping services...")
run_ssh_command("cd ~/Proyecto-Acompa-amiento- && sudo docker-compose -f docker-compose.core.yml down")
time.sleep(3)

# Start
print("\n⬆️  Starting services...")
run_ssh_command("cd ~/Proyecto-Acompa-amiento- && sudo docker-compose -f docker-compose.core.yml up -d")
time.sleep(15)

# Status
print("\n✅ Final status:")
run_ssh_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}'")

print("\n🎉 Done!")
