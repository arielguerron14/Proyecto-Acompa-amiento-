#!/usr/bin/env python3
import paramiko
import json
import os

ssh_key_path = "ssh-key-ec2.pem"

with open('config/instance_ips.json', 'r') as f:
    ips = json.load(f)

bastion_ip = ips['EC-Bastion']['PublicIpAddress']
core_private = "172.31.65.0"
db_private_ip = ips['EC2-DB']['PrivateIpAddress']
docker_user = os.environ.get("DOCKER_USERNAME", "caguerronp")

print(f"🚀 Cleaning and restarting microservices via Bastion")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    
    # Connect via Bastion tunnel
    ssh.connect(bastion_ip, username='ubuntu', pkey=key, timeout=60)
    transport = ssh.get_transport()
    channel = transport.open_channel('direct-tcpip', (core_private, 22), ("127.0.0.1", 0))
    
    ssh2 = paramiko.SSHClient()
    ssh2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh2.connect('127.0.0.1', username='ubuntu', pkey=key, sock=channel, timeout=60)
    
    print("✅ Connected to EC2-CORE\n")
    
    # Commands to clean and restart
    commands = [
        "docker rm -f micro-auth micro-estudiantes micro-maestros 2>/dev/null || true",
        "docker network create core-net 2>/dev/null || true",
        f"docker run -d --name micro-auth --network core-net --add-host=db-host:{db_private_ip} -p 0.0.0.0:3000:3000 -e PORT=3000 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/auth?authSource=admin' -e NODE_ENV=production {docker_user}/micro-auth:latest",
        "sleep 2",
        f"docker run -d --name micro-estudiantes --network core-net --add-host=db-host:{db_private_ip} -p 0.0.0.0:3001:3001 -e PORT=3001 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/estudiantes?authSource=admin' -e NODE_ENV=production {docker_user}/micro-estudiantes:latest",
        "sleep 2",
        f"docker run -d --name micro-maestros --network core-net --add-host=db-host:{db_private_ip} -p 0.0.0.0:3002:3002 -e PORT=3002 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/maestros?authSource=admin' -e NODE_ENV=production {docker_user}/micro-maestros:latest",
        "sleep 3",
        "docker ps -a | grep micro-",
        "echo '\n📋 Checking logs...'",
        "docker logs micro-auth 2>&1 | tail -15",
    ]
    
    for cmd in commands:
        if cmd.startswith("echo"):
            print(f"\n{cmd}")
        else:
            print(f"▶️  {cmd[:100]}")
            stdin, stdout, stderr = ssh2.exec_command(cmd, timeout=30)
            result = stdout.read().decode().strip()
            if result:
                lines = result.split('\n')
                for line in lines[-10:]:
                    print(f"   {line}")
    
    ssh2.close()
    ssh.close()
    print("\n✅ Microservices restarted!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
