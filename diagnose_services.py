#!/usr/bin/env python3
import paramiko
import os
import time

ssh_key_path = "ssh-key-ec2.pem"

def run_ssh_command(ip, command, description=""):
    """SSH into instance and run a command"""
    print(f"\n{'='*60}")
    if description:
        print(f"📌 {description}")
    print(f"🔗 {ip} >> {command[:80]}")
    print('='*60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
        ssh.connect(ip, username='ubuntu', pkey=key, timeout=30)
        
        stdin, stdout, stderr = ssh.exec_command(command)
        result = stdout.read().decode().strip()
        error = stderr.read().decode().strip()
        
        if result:
            print(result)
        if error and 'Command not found' not in error:
            print(f"⚠️  {error}")
        
        ssh.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

# Try EC2-API-Gateway
print("\n🚀 CHECKING EC2-API-GATEWAY (35.168.216.132)")
run_ssh_command("35.168.216.132", "docker ps -a", "List all containers")
run_ssh_command("35.168.216.132", "docker logs api-gateway 2>&1 | tail -30", "Recent API Gateway logs")
run_ssh_command("35.168.216.132", "netstat -tuln | grep 8080 || echo 'Port 8080 not listening'", "Check if port 8080 is listening")

time.sleep(2)

# Try EC2-CORE with longer timeout
print("\n🔌 CHECKING EC2-CORE (3.236.220.99)")
try:
    run_ssh_command("3.236.220.99", "docker ps -a", "List running containers on EC2-CORE")
    run_ssh_command("3.236.220.99", "docker logs micro-auth 2>&1 | tail -20", "Recent micro-auth logs")
except:
    print("⏱️  Retrying EC2-CORE connection...")
    time.sleep(5)
    run_ssh_command("3.236.220.99", "docker ps", "Retry: List containers")
