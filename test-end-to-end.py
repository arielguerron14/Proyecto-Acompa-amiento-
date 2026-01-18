#!/usr/bin/env python3
"""
Test complete deployment end-to-end
Verify IPs are correct and services respond
"""
import requests
import json
import time
from datetime import datetime

print("="*70)
print("🧪 END-TO-END DEPLOYMENT TEST")
print("="*70)

# Load IPs
with open('config/instance_ips.json') as f:
    config = json.load(f)

api_gw_ip = config['EC2-API-Gateway']['PublicIpAddress']
frontend_ip = config['EC2-Frontend']['PublicIpAddress']
db_ip = config['EC2-DB']['PublicIpAddress']
core_ip = config['EC2-CORE']['PublicIpAddress']

print(f"""
📍 Infrastructure IPs:
   • API Gateway:     {api_gw_ip}:8080
   • Frontend:        {frontend_ip}:5500  
   • CORE:            {core_ip}
   • Database:        {db_ip}
   • Bastion:         54.91.218.98

⏰ Test started: {datetime.now().isoformat()}
""")

tests = [
    ('API Gateway /health', f'http://{api_gw_ip}:8080/health', 'GET', None),
    ('Auth /health', f'http://{api_gw_ip}:8080/auth/health', 'GET', None),
    ('Auth /register', f'http://{api_gw_ip}:8080/auth/register', 'POST', {
        'email': f'test-{int(time.time())}@example.com',
        'password': 'TestPass123!',
        'name': 'Test User'
    }),
]

results = []
for test_name, url, method, data in tests:
    try:
        print(f"\n🔍 Testing: {test_name}")
        print(f"   URL: {url}")
        
        if method == 'GET':
            resp = requests.get(url, timeout=5)
        else:
            resp = requests.post(url, json=data, timeout=5, headers={'Content-Type': 'application/json'})
        
        print(f"   Status: {resp.status_code}")
        
        try:
            body = resp.json()
            print(f"   Response: {json.dumps(body, indent=6)[:200]}")
            results.append((test_name, 'PASS' if resp.status_code < 400 else 'FAIL', resp.status_code))
        except:
            print(f"   Response: {resp.text[:100]}")
            results.append((test_name, 'PASS' if resp.status_code < 400 else 'FAIL', resp.status_code))
            
    except requests.exceptions.Timeout:
        print(f"   ⏱️ TIMEOUT")
        results.append((test_name, 'TIMEOUT', 'N/A'))
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ CONNECTION ERROR: {str(e)[:80]}")
        results.append((test_name, 'FAIL', 'Connection error'))
    except Exception as e:
        print(f"   ❌ ERROR: {str(e)[:80]}")
        results.append((test_name, 'FAIL', str(e)[:40]))

print("\n" + "="*70)
print("📊 TEST RESULTS SUMMARY")
print("="*70)
for test_name, status, code in results:
    icon = '✅' if status == 'PASS' else '❌' if status == 'FAIL' else '⏱️'
    print(f"{icon} {test_name:30s} | {status:8s} | {code}")

passed = sum(1 for _, s, _ in results if s == 'PASS')
total = len(results)
print(f"\n{'='*70}")
print(f"📈 RESULT: {passed}/{total} tests passed")
if passed == total:
    print("✅ DEPLOYMENT WORKING CORRECTLY!")
else:
    print(f"⚠️  {total-passed} test(s) failed - see details above")
print('='*70)
