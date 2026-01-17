#!/usr/bin/env python3
import paramiko
import io
import os

# Read SSH key from environment variable
SSH_KEY_CONTENT = os.environ.get("EC2_SSH_KEY", "")

if not SSH_KEY_CONTENT:
    print("❌ ERROR: EC2_SSH_KEY environment variable not set")
    exit(1)

# Get instance IP from environment variable, fallback to hardcoded
TARGET_HOST = os.environ.get("INSTANCE_IP", "3.236.51.29")
USER = "ubuntu"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
key = paramiko.RSAKey.from_private_key(io.StringIO(SSH_KEY_CONTENT))
print(f"🔗 Connecting to {TARGET_HOST}...")
ssh.connect(TARGET_HOST, username=USER, pkey=key, timeout=30)
print(f"✅ Connected to {TARGET_HOST}")

containers = [
    "proyecto-acompa-amiento--micro-maestros-1",
    "proyecto-acompa-amiento--micro-estudiantes-1",
    "proyecto-acompa-amiento--micro-auth-1"
]

for container in containers:
    print(f"\n📋 Logs for {container}:")
    cmd = f"docker logs {container} 2>&1 | tail -20"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())

ssh.close()
