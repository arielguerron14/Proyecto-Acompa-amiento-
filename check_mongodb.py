#!/usr/bin/env python3
import paramiko
import json

ssh_key_path = "ssh-key-ec2.pem"

with open('config/instance_ips.json', 'r') as f:
    ips = json.load(f)

bastion_ip = ips['EC-Bastion']['PublicIpAddress']
db_private = ips['EC2-DB']['PrivateIpAddress']

print(f"🔍 Checking MongoDB on EC2-DB ({db_private})")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
    
    ssh.connect(bastion_ip, username='ubuntu', pkey=key, timeout=60)
    transport = ssh.get_transport()
    channel = transport.open_channel('direct-tcpip', (db_private, 22), ("127.0.0.1", 0))
    
    ssh2 = paramiko.SSHClient()
    ssh2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh2.connect('127.0.0.1', username='ubuntu', pkey=key, sock=channel, timeout=60)
    
    print("✅ Connected to EC2-DB\n")
    
    commands = [
        "docker ps -a | grep mongo",
        "docker inspect mongo 2>&1 | grep -E '(Port|IPAddress)' | head -10",
        "docker logs mongo 2>&1 | tail -20",
        "docker exec mongo mongosh -u root -p example --authenticationDatabase admin --eval 'db.adminCommand(\"ping\")'  2>&1"
    ]
    
    for cmd in commands:
        print(f"▶️  {cmd[:80]}")
        stdin, stdout, stderr = ssh2.exec_command(cmd, timeout=30)
        result = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if result:
            lines = result.split('\n')
            for line in lines[-10:]:
                print(f"   {line}")
        if err and 'ping' not in cmd:
            print(f"   ERR: {err[:200]}")
    
    ssh2.close()
    ssh.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
