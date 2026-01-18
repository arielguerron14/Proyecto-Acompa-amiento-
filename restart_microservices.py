#!/usr/bin/env python3
import paramiko
import os
import time

ssh_key_path = "ssh-key-ec2.pem"

print("🔧 Checking and restarting microservices on EC2-CORE...")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    print("🔗 Attempting SSH connection to EC2-CORE (retry 3 times)...")
    
    for attempt in range(3):
        try:
            ssh.connect("3.236.220.99", username='ubuntu', pkey=key, timeout=60)
            print("✅ Connected!")
            break
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {str(e)[:80]}")
            if attempt < 2:
                time.sleep(5)
            else:
                raise
    
    commands = [
        ("docker ps -a", "List all containers"),
        ("docker restart micro-auth micro-estudiantes micro-maestros", "Restart microservices"),
        ("sleep 5", "Wait for restart"),
        ("docker ps | grep micro-", "Verify running"),
        ("docker logs micro-auth 2>&1 | tail -30", "Check auth logs"),
    ]
    
    for cmd, desc in commands:
        print(f"\n▶️  {desc}: {cmd[:60]}")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        result = stdout.read().decode().strip()
        if result:
            # Truncate if too long
            lines = result.split('\n')
            for line in lines[-15:]:
                print(f"   {line}")
    
    ssh.close()
    print("\n✅ Microservices restart complete!")
except Exception as e:
    print(f"❌ Error: {e}")
