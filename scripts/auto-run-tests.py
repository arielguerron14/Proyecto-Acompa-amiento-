#!/usr/bin/env python3
"""
Monitor y ejecutar tests - Auto-trigger cuando workflow complete
"""

import subprocess
import time
import json
import sys

def check_workflow_status():
    """Verifica el estado del último workflow"""
    try:
        result = subprocess.run(
            ["gh", "run", "list", "--workflow=deploy-docker-compose.yml", "--limit", "1", "--json", "status,conclusion"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if data:
                return data[0].get("status"), data[0].get("conclusion")
    except Exception as e:
        print(f"Error: {e}")
    
    return None, None

def wait_for_workflow():
    """Espera a que el workflow complete"""
    print("⏳ Esperando a que workflow complete...")
    max_wait = 900  # 15 minutos
    elapsed = 0
    
    while elapsed < max_wait:
        status, conclusion = check_workflow_status()
        
        print(f"  Status: {status} | Conclusion: {conclusion} | Tiempo: {elapsed}s")
        
        if status == "completed":
            print(f"\n✅ Workflow completado con conclusion: {conclusion}")
            return conclusion == "success"
        
        time.sleep(30)
        elapsed += 30
    
    print(f"\n⏱️ Timeout después de {max_wait}s")
    return False

def run_tests():
    """Ejecuta los tests de flujos"""
    print("\n" + "="*80)
    print("🧪 EJECUTANDO TESTS DE FLUJOS")
    print("="*80 + "\n")
    
    try:
        result = subprocess.run(
            ["python", "tests/integration/service_flow_tests.py"],
            timeout=600  # 10 minutos
        )
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error ejecutando tests: {e}")
        return False

def main():
    print("🎯 AUTO-MONITOR: Esperando workflow + Tests automáticos\n")
    
    # Esperar a que workflow complete
    success = wait_for_workflow()
    
    if not success:
        print("\n❌ Workflow no completó exitosamente. Abortando tests.")
        return 1
    
    # Esperar un poco para que servicios estabilicen
    print("\n⏳ Esperando 15 segundos para que servicios estabilicen...")
    time.sleep(15)
    
    # Ejecutar tests
    test_success = run_tests()
    
    return 0 if test_success else 1

if __name__ == "__main__":
    sys.exit(main())
