#!/usr/bin/env python3
"""
Script para verificar que el arreglo fue exitoso
Ejecuta esto después de hacer los cambios en AWS
"""
import requests
import json
import time
import sys
from datetime import datetime

API_URL = "http://35.168.216.132:8080"
AUTH_URL = f"{API_URL}/auth"

def print_header(text):
    print(f"\n{'='*70}")
    print(f"🔍 {text}")
    print(f"{'='*70}\n")

def print_success(text):
    print(f"✅ {text}")

def print_error(text):
    print(f"❌ {text}")

def print_warning(text):
    print(f"⚠️  {text}")

def print_info(text):
    print(f"ℹ️  {text}")

def test_health_endpoint(url, name):
    """Test health endpoint"""
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            print_success(f"{name}: {r.status_code} OK")
            return True
        else:
            print_error(f"{name}: {r.status_code}")
            return False
    except requests.exceptions.Timeout:
        print_error(f"{name}: TIMEOUT")
        return False
    except Exception as e:
        print_error(f"{name}: {str(e)[:50]}")
        return False

def test_register():
    """Test register endpoint - CRITICAL TEST"""
    try:
        import random
        import string
        test_user = {
            "email": ''.join(random.choices(string.ascii_lowercase, k=10)) + '@test.com',
            "password": "Test123!",
            "name": "Test User"
        }
        
        r = requests.post(f"{AUTH_URL}/register", json=test_user, timeout=8)
        
        if r.status_code == 201:
            print_success(f"POST /auth/register: 201 Created ✨")
            data = r.json()
            if 'user' in data and 'userId' in data['user']:
                print_info(f"   User created: {data['user'].get('email')}")
                print_info(f"   User ID: {data['user'].get('userId')}")
                return True
            else:
                print_warning(f"   Response missing user data: {data}")
                return False
        elif r.status_code == 400:
            print_warning(f"POST /auth/register: 400 Bad Request")
            print_info(f"   {r.json().get('message', r.json())}")
            return False
        else:
            print_error(f"POST /auth/register: {r.status_code}")
            print_info(f"   {r.json()}")
            return False
            
    except requests.exceptions.Timeout:
        print_error(f"POST /auth/register: TIMEOUT (MongoDB still not working)")
        return False
    except Exception as e:
        print_error(f"POST /auth/register: {str(e)[:100]}")
        return False

def test_login():
    """Test login endpoint"""
    try:
        # First create a test user
        import random
        import string
        email = ''.join(random.choices(string.ascii_lowercase, k=10)) + '@test.com'
        password = "Test123!"
        name = "Test User"
        
        # Register
        r_reg = requests.post(f"{AUTH_URL}/register", 
            json={"email": email, "password": password, "name": name},
            timeout=8)
        
        if r_reg.status_code != 201:
            print_warning(f"Could not register test user for login test")
            return False
        
        # Login
        r_login = requests.post(f"{AUTH_URL}/login",
            json={"email": email, "password": password},
            timeout=8)
        
        if r_login.status_code == 200:
            print_success(f"POST /auth/login: 200 OK ✨")
            data = r_login.json()
            if 'token' in data:
                print_info(f"   JWT Token: {data['token'][:50]}...")
                return True
            else:
                print_warning(f"   Response missing token: {data}")
                return False
        else:
            print_error(f"POST /auth/login: {r_login.status_code}")
            return False
            
    except requests.exceptions.Timeout:
        print_error(f"POST /auth/login: TIMEOUT")
        return False
    except Exception as e:
        print_error(f"POST /auth/login: {str(e)[:100]}")
        return False

def main():
    print("\n")
    print_header("🧪 VERIFICACIÓN DE ARREGLO")
    print_info(f"Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"API URL: {API_URL}")
    
    results = {
        "api_health": False,
        "auth_health": False,
        "register": False,
        "login": False
    }
    
    # Test 1: API Gateway Health
    print("\n📋 Test 1: API Gateway Health")
    results["api_health"] = test_health_endpoint(f"{API_URL}/health", "GET /health")
    
    # Test 2: Auth Service Health
    print("\n📋 Test 2: Auth Service Health")
    results["auth_health"] = test_health_endpoint(f"{AUTH_URL}/health", "GET /auth/health")
    
    # Test 3: Register Endpoint (CRITICAL)
    print("\n📋 Test 3: Register Endpoint (CRITICAL)")
    print_info("This test creates a new user and verifies MongoDB connectivity")
    results["register"] = test_register()
    
    # Test 4: Login Endpoint
    print("\n📋 Test 4: Login Endpoint")
    print_info("This test registers and logs in a user")
    results["login"] = test_login()
    
    # Summary
    print_header("📊 RESUMEN")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"Pruebas pasadas: {passed}/{total}")
    print()
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} - {test_name}")
    
    print()
    
    if passed == total:
        print_success("¡TODOS LOS TESTS PASARON! 🎉")
        print()
        print("🚀 El proyecto está LISTO para pruebas en navegador!")
        print()
        print("Próximo paso:")
        print("  1. Abre: http://3.231.12.130:5500")
        print("  2. Intenta registrarte")
        print("  3. Intenta iniciar sesión")
        print("  4. Deberías ver el dashboard")
        print()
        return 0
    else:
        print_error(f"⚠️  {total - passed} tests fallaron")
        print()
        
        if results["register"] is False:
            print_error("PROBLEMA CRÍTICO: /auth/register no funciona")
            print("  Esto usualmente significa:")
            print("  1. MongoDB no está corriendo")
            print("  2. MongoDB no es accesible desde microservicios")
            print("  3. MONGODB_URI env var no está configurada correctamente")
            print()
            print("Soluciones:")
            print("  1. Verifica: ssh a EC2-DB y corre: docker ps -a | grep mongo")
            print("  2. Verifica logs: docker logs micro-auth | tail -20")
            print("  3. Revisa ARREGLO_RAPIDO.md para instrucciones paso a paso")
        
        print()
        return 1

if __name__ == "__main__":
    sys.exit(main())
