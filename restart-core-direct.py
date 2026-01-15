#!/usr/bin/env python3
import paramiko
import os
import sys
import time

# Configuration
CORE_IP = "3.237.39.196"  # Public IP
CORE_USER = "ubuntu"
SSH_KEY_PATH = os.path.join(os.path.dirname(__file__), "ssh-key-ec2.pem")

def restart_core_services():
    print(f"🔄 Connecting to EC2-Core ({CORE_IP})...")
    
    try:
        # Load private key from file
        pkey = paramiko.RSAKey.from_private_key_file(SSH_KEY_PATH)
        
        # Create SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect using loaded key
        ssh.connect(CORE_IP, username=CORE_USER, pkey=pkey, timeout=30)
        print("✅ Connected to Core")
        
        # List current containers
        print("\n📦 Current containers:")
        stdin, stdout, stderr = ssh.exec_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}'")
        print(stdout.read().decode())
        
        # Stop services
        print("\n⬇️  Stopping docker-compose services...")
        stdin, stdout, stderr = ssh.exec_command("cd ~/Proyecto-Acompa-amiento- && sudo docker-compose -f docker-compose.core.yml down")
        time.sleep(3)
        
        # Start services
        print("⬆️  Starting docker-compose services...")
        stdin, stdout, stderr = ssh.exec_command("cd ~/Proyecto-Acompa-amiento- && sudo docker-compose -f docker-compose.core.yml up -d")
        time.sleep(15)
        
        # Check status
        print("\n✅ Final status:")
        stdin, stdout, stderr = ssh.exec_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}'")
        print(stdout.read().decode())
        
        ssh.close()
        print("\n🎉 Services restarted successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = restart_core_services()
    sys.exit(0 if success else 1)
