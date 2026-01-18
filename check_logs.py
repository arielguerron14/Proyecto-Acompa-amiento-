#!/usr/bin/env python3
import paramiko
import io
import os

ssh_key_path = "ssh-key-ec2.pem"

if not os.path.exists(ssh_key_path):
    print(f"❌ SSH key not found at {ssh_key_path}")
    exit(1)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    ssh.connect("3.236.220.99", username='ubuntu', pkey=key, timeout=30)
    
    print("📋 Checking micro-auth container logs...\n")
    stdin, stdout, stderr = ssh.exec_command("docker logs micro-auth 2>&1")
    logs = stdout.read().decode()
    
    # Get last 50 lines
    lines = logs.strip().split('\n')
    for line in lines[-50:]:
        print(line)
    
    ssh.close()
except Exception as e:
    print(f"❌ Error: {e}")
