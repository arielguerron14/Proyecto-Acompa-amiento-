#!/usr/bin/env python3
import paramiko
import json

print("🔍 Checking microservices MongoDB connection via Bastion tunnel...")

with open('config/instance_ips.json') as f:
    config = json.load(f)

db_ip = config['EC2-DB']['PrivateIpAddress']
bastion_key = paramiko.RSAKey.from_private_key_file('ssh-key-ec2.pem')
bastion_client = paramiko.SSHClient()
bastion_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
bastion_client.connect('54.91.218.98', username='ec2-user', pkey=bastion_key, timeout=10)

transport = bastion_client.get_transport()
channel = transport.open_channel('direct-tcpip', (db_ip, 22), ('127.0.0.1', 0))
sock = paramiko.py3compat.SocketAdapter(channel)
db_client = paramiko.SSHClient()
db_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
db_client.connect(hostname=db_ip, username='ec2-user', pkey=paramiko.RSAKey.from_private_key_file('ssh-key-ec2.pem'), sock=sock, timeout=10)

# Check microservice logs for MongoDB connection
services = ['micro-auth', 'micro-estudiantes', 'micro-maestros']

for service in services:
    _, stdout, _ = db_client.exec_command(f"docker logs {service} 2>&1 | grep -i 'mongo\\|connected\\|error' | tail -3")
    logs = stdout.read().decode()
    print(f"\n📋 {service}:")
    if logs.strip():
        print(logs[:300])
    else:
        print("  (no mongo/connection messages found)")

# Test MongoDB directly
print("\n🔗 Testing MongoDB connection directly...")
_, stdout, _ = db_client.exec_command("docker exec mongo mongosh --eval \"db.adminCommand('ping')\" --quiet 2>&1 | head -5")
print(stdout.read().decode())

db_client.close()
bastion_client.close()
print("\n✅ Check complete!")
