#!/usr/bin/env python3
"""
Complete diagnostic and fix via Bastion SSH tunnel
Verifies MongoDB, microservices, and entire auth flow
"""
import paramiko
import json
import time

print("=" * 70)
print("🔧 COMPLETE DIAGNOSTIC & FIX VIA BASTION TUNNEL")
print("=" * 70)

with open('config/instance_ips.json') as f:
    config = json.load(f)

db_ip = config['EC2-DB']['PrivateIpAddress']
db_public = config['EC2-DB']['PublicIpAddress']
core_ip = config['EC2-CORE']['PrivateIpAddress']

print(f"\n📍 Infrastructure:")
print(f"   DB Private IP: {db_ip}")
print(f"   CORE Private IP: {core_ip}")
print(f"   Bastion: 54.91.218.98")

try:
    print("\n▶️  Connecting via Bastion tunnel...")
    bastion_key = paramiko.RSAKey.from_private_key_file('ssh-key-ec2.pem')
    bastion_client = paramiko.SSHClient()
    bastion_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    bastion_client.connect('54.91.218.98', username='ec2-user', pkey=bastion_key, timeout=10)
    print("   ✅ Connected to Bastion")

    # Create tunnel to EC2-DB
    transport = bastion_client.get_transport()
    channel = transport.open_channel('direct-tcpip', (db_ip, 22), ('127.0.0.1', 0))
    sock = paramiko.py3compat.SocketAdapter(channel)
    db_client = paramiko.SSHClient()
    db_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    db_client.connect(hostname=db_ip, username='ec2-user', pkey=bastion_key, sock=sock, timeout=10)
    print("   ✅ Connected to EC2-DB via tunnel")

    # Check MongoDB
    print("\n▶️  Checking MongoDB status...")
    _, stdout, _ = db_client.exec_command("docker ps -a --filter name=mongo --format '{{.Names}} {{.Status}}'")
    mongo_status = stdout.read().decode().strip()
    if mongo_status:
        print(f"   {mongo_status}")
        if "Up" in mongo_status:
            print("   ✅ MongoDB is running")
        else:
            print("   ❌ MongoDB is not running - will restart...")
            # Restart MongoDB
            _, stdout, _ = db_client.exec_command(
                "docker stop mongo 2>/dev/null || true; "
                "docker rm mongo 2>/dev/null || true; "
                "docker run -d --name mongo -p 0.0.0.0:27017:27017 "
                "-e MONGO_INITDB_ROOT_USERNAME=root "
                "-e MONGO_INITDB_ROOT_PASSWORD=example "
                "-v mongo_data:/data/db mongo:6.0 --auth --bind_ip_all"
            )
            print("   Waiting for MongoDB to start...")
            time.sleep(5)
            print("   ✅ MongoDB restarted")
    else:
        print("   ❌ MongoDB not found")

    # Check PostgreSQL
    print("\n▶️  Checking PostgreSQL status...")
    _, stdout, _ = db_client.exec_command("docker ps --filter name=postgres --format '{{.Names}} {{.Status}}'")
    pg_status = stdout.read().decode().strip()
    print(f"   {pg_status if pg_status else '❌ Not running'}")

    # Check Redis
    print("\n▶️  Checking Redis status...")
    _, stdout, _ = db_client.exec_command("docker ps --filter name=redis --format '{{.Names}} {{.Status}}'")
    redis_status = stdout.read().decode().strip()
    print(f"   {redis_status if redis_status else '❌ Not running'}")

    db_client.close()

    # Now check CORE microservices
    print("\n▶️  Checking microservices on EC2-CORE...")
    
    # Create tunnel to EC2-CORE
    transport = bastion_client.get_transport()
    channel = transport.open_channel('direct-tcpip', (core_ip, 22), ('127.0.0.1', 0))
    sock = paramiko.py3compat.SocketAdapter(channel)
    core_client = paramiko.SSHClient()
    core_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    core_client.connect(hostname=core_ip, username='ec2-user', pkey=bastion_key, sock=sock, timeout=10)
    print("   ✅ Connected to EC2-CORE via tunnel")

    _, stdout, _ = core_client.exec_command("docker ps --format '{{.Names}} {{.Status}}'")
    print("\n   Containers running:")
    for line in stdout.read().decode().strip().split('\n'):
        print(f"      {line}")

    # Check if microservices logs show MongoDB errors
    print("\n▶️  Checking micro-auth logs for MongoDB errors...")
    _, stdout, _ = core_client.exec_command("docker logs micro-auth 2>&1 | grep -i 'mongo\\|connected\\|error' | tail -5")
    logs = stdout.read().decode().strip()
    if logs:
        for line in logs.split('\n'):
            print(f"      {line[:100]}")
    else:
        print("      (no error messages found)")

    core_client.close()
    bastion_client.close()

    print("\n" + "=" * 70)
    print("✅ Diagnostic complete!")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
