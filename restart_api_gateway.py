#!/usr/bin/env python3
import paramiko
import os

ssh_key_path = "ssh-key-ec2.pem"

print("🔧 Restarting API Gateway container...")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    ssh.connect("35.168.216.132", username='ubuntu', pkey=key, timeout=30)
    
    commands = [
        "docker restart api-gateway",
        "sleep 3",
        "docker ps | grep api-gateway",
        "docker logs api-gateway 2>&1 | tail -20"
    ]
    
    for cmd in commands:
        print(f"\n▶️  {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        result = stdout.read().decode()
        print(result)
    
    ssh.close()
    print("\n✅ API Gateway container restarted!")
except Exception as e:
    print(f"❌ Error: {e}")
