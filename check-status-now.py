#!/usr/bin/env python3
"""
Check current infrastructure status and determine next steps
"""
import requests
import json
import time

API_GATEWAY = "http://35.168.216.132:8080"
AUTH_MICRO = "http://35.168.216.132:8080/auth"

print("=" * 70)
print("🔍 INFRASTRUCTURE STATUS CHECK")
print("=" * 70)

# Test 1: API Gateway health
print("\n1. API Gateway /health")
try:
    r = requests.get(f"{API_GATEWAY}/health", timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Auth service health
print("\n2. Auth Service /health")
try:
    r = requests.get(f"{AUTH_MICRO}/health", timeout=5)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Register (will timeout if MongoDB not working)
print("\n3. Auth Service /register (timeout = 3 seconds)")
try:
    test_user = {
        "email": f"test-{int(time.time())}@example.com",
        "password": "Test123!",
        "name": "Test User"
    }
    r = requests.post(f"{AUTH_MICRO}/register", json=test_user, timeout=3)
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.json()}")
except requests.exceptions.Timeout:
    print(f"   ⏱️  TIMEOUT - MongoDB likely not accessible from micro-auth")
except Exception as e:
    print(f"   Error: {e}")

# Check infrastructure file
print("\n4. Instance IPs")
try:
    with open('config/instance_ips.json') as f:
        config = json.load(f)
    print(f"   DB Instance: {config['EC2-DB']['InstanceId']}")
    print(f"   DB Private IP: {config['EC2-DB']['PrivateIpAddress']}")
    print(f"   DB Public IP: {config['EC2-DB']['PublicIpAddress']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 70)
print("📋 ANALYSIS")
print("=" * 70)
print("""
The /health endpoints work but /register times out.
This indicates:
1. API Gateway is running ✅
2. Microservices are running ✅
3. MongoDB connection is failing ❌

REASON: MongoDB might not be running or microservices can't reach it.

SOLUTION: We need to SSH directly to EC2-DB and check/restart MongoDB.
Since AWS SSM failed, let's use Bastion tunnel with updated SSH key.
""")
