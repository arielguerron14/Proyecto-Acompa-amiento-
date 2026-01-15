#!/usr/bin/env python3
import requests
import time

# API Gateway IP
API_GATEWAY = "http://52.7.168.4:8080"

endpoints = [
    "/horarios",
    "/estudiantes/reservas/estudiante/1",
    "/health"
]

print("🔍 Testing API Gateway endpoints...")
time.sleep(5)  # Wait for services to fully start

for endpoint in endpoints:
    url = f"{API_GATEWAY}{endpoint}"
    try:
        response = requests.get(url, timeout=10)
        print(f"✅ {endpoint}: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.text[:100]}...")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ {endpoint}: {str(e)}")
