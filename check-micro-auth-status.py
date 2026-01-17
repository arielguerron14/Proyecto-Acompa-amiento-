import boto3
import paramiko
import os
from io import StringIO

# AWS Setup
ec2 = boto3.client('ec2', region_name='us-east-1')
response = ec2.describe_instances(Filters=[{'Name': 'tag:Name', 'Values': ['EC2-CORE']}])

if not response['Reservations']:
    print("❌ No EC2-CORE instance found")
    exit(1)

instance = response['Reservations'][0]['Instances'][0]
instance_ip = instance['PublicIpAddress']

print(f"🔗 Connecting to EC2-CORE: {instance_ip}")

# SSH Setup
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_key_str = os.environ.get('EC2_SSH_KEY', '')

if not ssh_key_str:
    print("❌ EC2_SSH_KEY not set")
    exit(1)

try:
    key = paramiko.RSAKey.from_private_key(StringIO(ssh_key_str))
    ssh.connect(instance_ip, username='ec2-user', pkey=key, timeout=10)
    print(f"✅ Connected\n")
    
    # Get micro-auth logs
    print("📋 Micro-Auth Logs (last 30 lines):")
    print("=" * 60)
    stdin, stdout, stderr = ssh.exec_command("docker logs micro-auth 2>&1 | tail -30")
    logs = stdout.read().decode()
    print(logs)
    
    print("\n\n📊 Mongo Connection Status:")
    print("=" * 60)
    stdin, stdout, stderr = ssh.exec_command("curl -s http://localhost:3000/debug/mongo-status 2>&1")
    status = stdout.read().decode()
    print(status)
    
    print("\n\n🐳 Docker Containers Status:")
    print("=" * 60)
    stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'")
    containers = stdout.read().decode()
    print(containers)
    
    ssh.close()
    
except Exception as e:
    print(f"❌ Failed: {e}")
    exit(1)
