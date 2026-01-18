#!/usr/bin/env python3
import paramiko
import json
import os
import time

ssh_key_path = "ssh-key-ec2.pem"

# Read current IPs
with open('config/instance_ips.json', 'r') as f:
    ips = json.load(f)

db_private_ip = ips['EC2-DB']['PrivateIpAddress']
docker_user = os.environ.get("DOCKER_USERNAME", "caguerronp")

print(f"🚀 Direct deployment to EC2-CORE")
print(f"   MongoDB IP: {db_private_ip}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    ssh.connect("3.236.220.99", username='ubuntu', pkey=key, timeout=60)
    print("✅ SSH Connected to EC2-CORE")
    
    # Prepare deployment commands
    commands = [
        "docker network create core-net 2>/dev/null || true",
        f"docker pull {docker_user}/micro-auth:latest",
        f"docker pull {docker_user}/micro-estudiantes:latest",
        f"docker pull {docker_user}/micro-maestros:latest",
        "docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true",
        "docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true",
        f"docker run -d --name micro-auth --network core-net --add-host=db-host:{db_private_ip} -p 0.0.0.0:3000:3000 -e PORT=3000 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/auth?authSource=admin' -e NODE_ENV=production {docker_user}/micro-auth:latest",
        "sleep 3",
        f"docker run -d --name micro-estudiantes --network core-net --add-host=db-host:{db_private_ip} -p 0.0.0.0:3001:3001 -e PORT=3001 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/estudiantes?authSource=admin' -e NODE_ENV=production {docker_user}/micro-estudiantes:latest",
        "sleep 3",
        f"docker run -d --name micro-maestros --network core-net --add-host=db-host:{db_private_ip} -p 0.0.0.0:3002:3002 -e PORT=3002 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/maestros?authSource=admin' -e NODE_ENV=production {docker_user}/micro-maestros:latest",
        "sleep 5",
        "docker ps -a | grep micro-",
    ]
    
    for cmd in commands:
        print(f"\n▶️  {cmd[:100]}")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
        result = stdout.read().decode().strip()
        if result:
            lines = result.split('\n')
            for line in lines[-5:]:
                print(f"   {line}")
    
    ssh.close()
    print("\n✅ Microservices deployed successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
