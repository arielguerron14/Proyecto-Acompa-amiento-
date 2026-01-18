#!/usr/bin/env python3
import paramiko
import io
import os
import sys

ssh_key_str = os.environ.get("EC2_SSH_KEY", "")
if not ssh_key_str:
    print("❌ EC2_SSH_KEY environment variable not set")
    sys.exit(1)

target_host = "3.236.220.99"  # EC2-CORE

print(f"🔗 Connecting to EC2-CORE ({target_host})...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key_str))
    ssh.connect(target_host, username='ubuntu', pkey=key, timeout=30)
    print("✅ Connected\n")
    
    # Check containers
    print("📦 Docker containers:")
    stdin, stdout, stderr = ssh.exec_command("docker ps -a --format 'table {{.Names}}\t{{.Status}}'")
    print(stdout.read().decode())
    
    # Check auth service logs
    print("\n📋 micro-auth logs (last 50 lines):")
    stdin, stdout, stderr = ssh.exec_command("docker logs micro-auth 2>&1 | tail -50")
    logs = stdout.read().decode()
    print(logs)
    
    # Test MongoDB connection from auth service
    print("\n🗄️  Testing MongoDB from auth container:")
    stdin, stdout, stderr = ssh.exec_command("docker exec micro-auth curl -s -X GET http://172.31.65.122:27017/admin/status.html 2>&1 | head -5 || echo 'Connection test...'")
    print(stdout.read().decode())
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Failed: {e}")
    sys.exit(1)
