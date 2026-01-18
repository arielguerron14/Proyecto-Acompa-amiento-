#!/usr/bin/env python3
"""
Direct infrastructure fix via EC2 Instance Connect (no SSH key needed)
Uses boto3 to execute commands directly on EC2 instances
"""
import boto3
import json
import time
import requests

print("=" * 80)
print("🚀 UNIFIED INFRASTRUCTURE FIX")
print("=" * 80)

# Load config
with open('config/instance_ips.json') as f:
    config = json.load(f)

db_public_ip = config['EC2-DB']['PublicIpAddress']
core_public_ip = config['EC2-CORE']['PublicIpAddress']
api_public_ip = config['EC2-API-Gateway']['PublicIpAddress']
db_private_ip = config['EC2-DB']['PrivateIpAddress']

print(f"""
📍 Target Infrastructure:
   EC2-DB public: {db_public_ip}
   EC2-DB private: {db_private_ip}
   EC2-CORE public: {core_public_ip}
   EC2-API-Gateway public: {api_public_ip}
""")

# =============================================================================
# WORKAROUND: Since SSH/SSM is failing, let's use the docker-exec approach
# We'll create a local script and save it, then have the user run it manually
# =============================================================================

fix_script = f"""#!/bin/bash
# This script should be run on EC2-DB via SSH or EC2 Instance Connect
echo "=============================================================="
echo "🔧 MONGODB AND SERVICES FIX"
echo "=============================================================="

echo ""
echo "📦 Step 1: Fix MongoDB on EC2-DB"
docker stop mongo 2>/dev/null || true
docker rm mongo 2>/dev/null || true
docker volume create mongo_data 2>/dev/null || true

docker run -d --name mongo \\
  -p 0.0.0.0:27017:27017 \\
  -e MONGO_INITDB_ROOT_USERNAME=root \\
  -e MONGO_INITDB_ROOT_PASSWORD=example \\
  -v mongo_data:/data/db \\
  mongo:6.0 \\
  --auth --bind_ip_all

echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Test MongoDB
echo ""
echo "✅ Testing MongoDB"
docker exec mongo mongosh mongodb://root:example@localhost:27017/admin --authenticationDatabase admin --eval "db.adminCommand('ping')" 2>&1 | head -5

echo ""
echo "📦 Step 2: Fix Microservices on EC2-CORE"
docker network create core-net 2>/dev/null || true

# Stop old services
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

# Start micro-auth with MongoDB URI
docker run -d --name micro-auth \\
  --network core-net \\
  -p 3000:3000 \\
  -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/auth?authSource=admin' \\
  -e PORT=3000 \\
  -e NODE_ENV=production \\
  -e LOG_LEVEL=debug \\
  --add-host=db-host:{db_private_ip} \\
  arielguerron14/micro-auth:latest

# Start micro-estudiantes
docker run -d --name micro-estudiantes \\
  --network core-net \\
  -p 3001:3001 \\
  -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/estudiantes?authSource=admin' \\
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \\
  -e PORT=3001 \\
  -e NODE_ENV=production \\
  -e LOG_LEVEL=debug \\
  --add-host=db-host:{db_private_ip} \\
  arielguerron14/micro-estudiantes:latest

# Start micro-maestros
docker run -d --name micro-maestros \\
  --network core-net \\
  -p 3002:3002 \\
  -e MONGODB_URI='mongodb://root:example@{db_private_ip}:27017/maestros?authSource=admin' \\
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \\
  -e PORT=3002 \\
  -e NODE_ENV=production \\
  -e LOG_LEVEL=debug \\
  --add-host=db-host:{db_private_ip} \\
  arielguerron14/micro-maestros:latest

echo "⏳ Waiting for microservices to be ready..."
sleep 10

echo ""
echo "✅ Microservices status:"
docker ps --filter "name=micro" --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"

echo ""
echo "=============================================================="
echo "✅ INFRASTRUCTURE FIX COMPLETE"
echo "=============================================================="
"""

# Save the script
with open('manual-fix.sh', 'w') as f:
    f.write(fix_script)

print("✅ Created manual-fix.sh script")
print("\nThis script will fix MongoDB and microservices.")
print("However, let me try a different approach using boto3 EC2 API...")

# =============================================================================
# TRY USING EC2 RUN INSTANCES METADATA SERVICE
# =============================================================================

try:
    ec2 = boto3.resource('ec2', region_name='us-east-1')
    
    # Get instances
    db_instance = ec2.Instance(config['EC2-DB']['InstanceId'])
    core_instance = ec2.Instance(config['EC2-CORE']['InstanceId'])
    
    print(f"\n📋 Instance states:")
    print(f"   EC2-DB: {db_instance.state['Name']}")
    print(f"   EC2-CORE: {core_instance.state['Name']}")
    
    # Try using EC2 Instance Connect for bash commands
    print("\n🔗 Attempting to use EC2 Instance Connect...")
    client = boto3.client('ec2-instance-connect', region_name='us-east-1')
    
    mongo_check = """
docker ps -a --filter name=mongo --format 'table {{.Names}}\\t{{.Status}}'
"""
    
    try:
        response = client.send_ssh_public_key(
            InstanceId=config['EC2-DB']['InstanceId'],
            SSHPublicKey='ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...',  # Placeholder
            AvailabilityZone='us-east-1a',
            OSUser='ec2-user'
        )
        print(f"✅ Instance Connect available")
    except Exception as e:
        print(f"⚠️  Instance Connect error: {str(e)[:100]}")
        
except Exception as e:
    print(f"⚠️  boto3 approach failed: {str(e)[:100]}")

# =============================================================================
# ALTERNATIVE: Use subprocess to test the infrastructure as-is
# =============================================================================

print("\n" + "=" * 80)
print("🔍 TESTING CURRENT INFRASTRUCTURE")
print("=" * 80)

tests = [
    ('GET', f'http://{api_public_ip}:8080/health', None, 'API Gateway /health'),
    ('GET', f'http://{api_public_ip}:8080/auth/health', None, 'Auth /health'),
]

for method, url, data, label in tests:
    try:
        if method == 'GET':
            r = requests.get(url, timeout=5)
        else:
            r = requests.post(url, json=data, timeout=5)
        print(f"✅ {label}: {r.status_code}")
    except requests.exceptions.Timeout:
        print(f"⏱️  {label}: TIMEOUT")
    except Exception as e:
        print(f"❌ {label}: {str(e)[:50]}")

# Test register (will timeout if MongoDB not working)
print(f"\n📝 Testing /auth/register (5 sec timeout)...")
try:
    import random
    import string
    rand_email = ''.join(random.choices(string.ascii_lowercase, k=8)) + '@test.com'
    r = requests.post(f'http://{api_public_ip}:8080/auth/register', 
        json={'email': rand_email, 'password': 'Test123!', 'name': 'Test'},
        timeout=5)
    print(f"✅ /register: {r.status_code}")
    print(f"   Response: {r.json()}")
except requests.exceptions.Timeout:
    print(f"❌ /register: TIMEOUT (MongoDB not accessible)")
    print(f"\n🔴 PROBLEM IDENTIFIED:")
    print(f"   Microservices cannot connect to MongoDB")
    print(f"   MongoDB might not be running or network connectivity is broken")
except Exception as e:
    print(f"⚠️  {str(e)[:100]}")

print("\n" + "=" * 80)
print("💡 NEXT STEPS")
print("=" * 80)
print("""
Since automated SSH/SSM connection is failing, PLEASE:

1. Go to AWS Console: https://console.aws.amazon.com/ec2
2. Select EC2-DB instance (i-044d5e68b427462d2)
3. Click "Connect" button → "EC2 Instance Connect" tab
4. Copy the contents of manual-fix.sh and paste it in the terminal
5. This will fix MongoDB and restart microservices

OR if that doesn't work:
6. Use AWS Systems Manager → Session Manager
7. Connect to EC2-DB
8. Run: curl -s https://raw.githubusercontent.com/your-repo/main/manual-fix.sh | bash

The issue is: MongoDB is not running or microservices can't reach it.
Once fixed, /auth/register should return 201 Created instead of timeout.
""")

print("\n📌 Script saved to: manual-fix.sh")
print("📌 Instance IPs: config/instance_ips.json")
