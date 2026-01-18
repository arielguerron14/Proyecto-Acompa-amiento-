#!/usr/bin/env python3
"""
Complete auth flow test: Register → Login → Verify
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = 'http://35.168.216.132:8080'
TEST_EMAIL = f'test-{int(time.time())}@example.com'
TEST_PASSWORD = 'TestPass123!'
TEST_NAME = 'Test User'

print("="*70)
print("🧪 COMPLETE AUTH FLOW TEST")
print("="*70)
print(f"\n📍 Base URL: {BASE_URL}")
print(f"⏰ Test started: {datetime.now().isoformat()}\n")

# Helper to make requests
def make_request(method, endpoint, data=None, label=""):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "POST":
            resp = requests.post(url, json=data, timeout=15, headers={'Content-Type': 'application/json'})
        else:
            resp = requests.get(url, timeout=15)
        
        print(f"{'✅' if resp.status_code < 400 else '❌'} {label}")
        print(f"   Method: {method} {endpoint}")
        print(f"   Status: {resp.status_code}")
        
        try:
            body = resp.json()
            if 'token' in body:
                print(f"   Token: {body['token'][:50]}...")
            else:
                print(f"   Response: {json.dumps(body, indent=4)[:300]}")
            return resp.status_code, body
        except:
            print(f"   Response: {resp.text[:200]}")
            return resp.status_code, None
            
    except requests.exceptions.Timeout:
        print(f"⏱️  {label} - TIMEOUT after 15 seconds")
        return -1, None
    except requests.exceptions.ConnectionError as e:
        print(f"❌ {label} - CONNECTION ERROR: {str(e)[:100]}")
        return -2, None
    except Exception as e:
        print(f"❌ {label} - ERROR: {str(e)[:100]}")
        return -3, None

# Test 1: Check API Gateway health
print("\n▶️  STEP 1: Health Check")
print("-"*70)
status, resp = make_request("GET", "/health", label="API Gateway health")

# Test 2: Register user
print("\n▶️  STEP 2: Register User")
print("-"*70)
status, resp = make_request("POST", "/auth/register", 
    data={'email': TEST_EMAIL, 'password': TEST_PASSWORD, 'name': TEST_NAME},
    label="Register new user")

# Test 3: Login
print("\n▶️  STEP 3: Login")
print("-"*70)
status, login_resp = make_request("POST", "/auth/login",
    data={'email': TEST_EMAIL, 'password': TEST_PASSWORD},
    label="Login with credentials")

# Test 4: Verify token
if login_resp and 'token' in login_resp:
    print("\n▶️  STEP 4: Verify Token")
    print("-"*70)
    status, resp = make_request("POST", "/auth/verify-token",
        data={'token': login_resp['token']},
        label="Verify JWT token")
else:
    print("\n▶️  STEP 4: Verify Token - SKIPPED (no token from login)")

# Summary
print("\n" + "="*70)
print("📊 TEST SUMMARY")
print("="*70)
print("""
Expected Flow:
1. ✅ API Gateway /health → 200
2. ✅ Register user → 201
3. ✅ Login → 200 + token
4. ✅ Verify token → 200

If any step failed, check:
- MongoDB connectivity from micro-auth
- User model and database initialization
- Token generation service
- API Gateway routing to micro-auth
""")
