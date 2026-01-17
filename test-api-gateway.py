#!/usr/bin/env python3
"""
Test API Gateway connectivity to microservices
"""
import requests
import json
import time

API_GATEWAY = "http://35.168.216.132:8080"

tests = [
    ("Health Check", "GET", "/health", None),
    ("Auth Health", "GET", "/auth/health", None),
    ("Register (empty)", "POST", "/auth/register", {}),
]

print("🧪 Testing API Gateway Connectivity")
print(f"   Target: {API_GATEWAY}")
print("=" * 60)
print()

for test_name, method, endpoint, data in tests:
    url = f"{API_GATEWAY}{endpoint}"
    print(f"📋 {test_name}")
    print(f"   {method} {endpoint}")
    
    try:
        if method == "GET":
            resp = requests.get(url, timeout=5)
        else:
            resp = requests.post(
                url,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
        
        print(f"   Status: {resp.status_code}")
        
        if resp.text:
            try:
                body = json.loads(resp.text)
                print(f"   Response: {json.dumps(body)[:100]}")
            except:
                print(f"   Response: {resp.text[:100]}")
        
        if resp.status_code == 502:
            print(f"   ❌ Still 502 - API Gateway not reaching microservices")
        elif resp.status_code == 200:
            print(f"   ✅ Success!")
        elif 400 <= resp.status_code < 500:
            print(f"   ⚠️  Client error (normal - missing data)")
        else:
            print(f"   ⚠️  Unexpected status")
    
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Connection Error: {str(e)[:80]}")
    except requests.exceptions.Timeout:
        print(f"   ⏱️  Timeout")
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:80]}")
    
    print()
    time.sleep(1)

print("=" * 60)
print("Test Summary:")
print("  - If you see 502: Microservices still not reachable")
print("  - If you see 200/4xx: API Gateway can reach microservices ✅")
print("  - If 4xx with error message: Microservice is responding ✅")
