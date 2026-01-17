#!/usr/bin/env python3
import paramiko
import io
import os

# Read SSH key from environment variable
SSH_KEY_CONTENT = os.environ.get("EC2_SSH_KEY", "")

if not SSH_KEY_CONTENT:
    print("❌ ERROR: EC2_SSH_KEY environment variable not set")
    exit(1)

# API Gateway public IP
API_GATEWAY_HOST = "52.7.168.4"
USER = "ubuntu"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
key = paramiko.RSAKey.from_private_key(io.StringIO(SSH_KEY_CONTENT))
ssh.connect(API_GATEWAY_HOST, username=USER, pkey=key, timeout=30)

print("📍 Checking API Gateway configuration...")
cmd = "cat ~/Proyecto-Acompa-amiento-/api-gateway/.env || echo 'No .env file found'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())

ssh.close()
