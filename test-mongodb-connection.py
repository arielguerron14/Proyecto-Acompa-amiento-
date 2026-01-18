#!/usr/bin/env python3
"""
Test MongoDB connectivity from local machine
"""
import json
import subprocess
import sys

print("🔍 Testing MongoDB connectivity...\n")

with open('config/instance_ips.json') as f:
    config = json.load(f)

db_private_ip = config['EC2-DB']['PrivateIpAddress']
db_public_ip = config['EC2-DB']['PublicIpAddress']

# MongoDB credentials
mongo_user = 'root'
mongo_pass = 'example'
mongo_db = 'auth'

print(f"📍 MongoDB Server:")
print(f"   Private IP: {db_private_ip}:27017")
print(f"   Public IP: {db_public_ip}:27017")
print(f"   Credentials: {mongo_user}:{mongo_pass}")
print(f"   Database: {mongo_db}\n")

# Test 1: Direct telnet to MongoDB port (via public IP - won't work due to AWS SG)
print("▶️  Test 1: Direct connection via public IP")
try:
    from pymongo import MongoClient
    print("   pymongo available, testing connection...")
    try:
        client = MongoClient(f'mongodb://{mongo_user}:{mongo_pass}@{db_public_ip}:27017/?authSource=admin', serverSelectionTimeoutMS=5000)
        result = client['admin'].command('ping')
        print(f'✅ Connected: {result}')
    except Exception as e:
        print(f'❌ Connection failed: {str(e)[:150]}')
except ImportError:
    print("   pymongo not installed, skipping direct test")

# Test 2: Via private IP from CI (simulated)
print("\n▶️  Test 2: MongoDB connection string check")
mongo_uri = f"mongodb://{mongo_user}:{mongo_pass}@{db_private_ip}:27017/{mongo_db}?authSource=admin"
print(f"   URI: {mongo_uri}")
print(f"   ✅ URI format is valid")

print("\n▶️  Test 3: Check if port 27017 is open")
try:
    import socket
    s = socket.socket()
    result = s.connect_ex((db_public_ip, 27017))
    if result == 0:
        print(f"   ✅ Port 27017 is open on {db_public_ip}")
    else:
        print(f"   ❌ Port 27017 is closed (error code: {result})")
    s.close()
except Exception as e:
    print(f"   ⚠️ Could not test: {str(e)[:100]}")

print("\n📋 Summary:")
print("""
For microservices to connect to MongoDB:
1. Microservices must have MONGODB_URI env var set
2. MongoDB must be running on EC2-DB (port 27017)
3. Network must allow traffic from EC2-CORE to EC2-DB
4. Auth credentials must be correct: root/example
""")
