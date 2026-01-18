#!/usr/bin/env python3
import paramiko
import json
import os

ssh_key_path = "ssh-key-ec2.pem"

# Read current IPs
with open('config/instance_ips.json', 'r') as f:
    ips = json.load(f)

bastion_ip = ips['EC-Bastion']['PublicIpAddress']
core_ip = ips['EC2-CORE']['PrivateIpAddress']  # Private IP for tunnel
core_private = "172.31.65.0"
db_private_ip = ips['EC2-DB']['PrivateIpAddress']
docker_user = os.environ.get("DOCKER_USERNAME", "caguerronp")

print(f"🚀 Deploying via Bastion")
print(f"   Bastion: {bastion_ip}")
print(f"   EC2-CORE: {core_private} (internal)")
print(f"   MongoDB: {db_private_ip}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    
    # First, SSH to Bastion
    print("\n🔗 Connecting to Bastion...")
    ssh.connect(bastion_ip, username='ubuntu', pkey=key, timeout=60)
    print("✅ Bastion connected")
    
    # Use Bastion to reach EC2-CORE
    transport = ssh.get_transport()
    dest_addr = (core_private, 22)
    local_addr = ("127.0.0.1", 0)
    
    print(f"\n🔀 Creating tunnel to EC2-CORE through Bastion...")
    channel = transport.open_channel('direct-tcpip', dest_addr, local_addr)
    
    # Connect through the tunnel
    ssh2 = paramiko.SSHClient()
    ssh2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh2.connect('127.0.0.1', username='ubuntu', pkey=key, sock=channel, timeout=60)
    print("✅ Connected to EC2-CORE through tunnel")
    
    # Now deploy on EC2-CORE
    commands = [
        "docker ps -a | head -5",
        f"docker pull {docker_user}/micro-auth:latest 2>&1 | tail -3",
        f"docker run -d --name micro-auth --network host -p 3000:3000 -e PORT=3000 -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/auth?authSource=admin' -e NODE_ENV=production {docker_user}/micro-auth:latest 2>&1",
        "sleep 2",
        "docker ps | grep micro-auth",
        "docker logs micro-auth 2>&1 | tail -10"
    ]
    
    for cmd in commands:
        print(f"\n▶️  {cmd[:80]}")
        stdin, stdout, stderr = ssh2.exec_command(cmd, timeout=30)
        result = stdout.read().decode().strip()
        if result:
            lines = result.split('\n')
            for line in lines[-8:]:
                print(f"   {line}")
    
    ssh2.close()
    ssh.close()
    print("\n✅ Done!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
