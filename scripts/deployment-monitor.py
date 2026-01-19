#!/usr/bin/env python3
"""
Monitor y validador de despliegue - Proyecto Acompañamiento
Espera a que los servicios estén disponibles y ejecuta tests
"""

import subprocess
import sys
import time
import requests
import json
from datetime import datetime
from pathlib import Path

# Configuración
REPO_ROOT = Path(__file__).parent.parent
TESTS_DIR = REPO_ROOT / "tests" / "integration"
SCRIPTS_DIR = REPO_ROOT / "scripts"

INSTANCES = {
    'core': '3.236.99.88',
    'api_gateway': '98.86.94.92',
    'notifications': '98.92.17.165',
}

SERVICES = {
    'api_gateway': ('98.86.94.92', 8080),
    'auth': ('3.236.99.88', 5005),
    'estudiantes': ('3.236.99.88', 5002),
    'maestros': ('3.236.99.88', 5001),
    'notificaciones': ('98.92.17.165', 5006),
    'reportes_estudiantes': ('3.236.99.88', 5003),
    'reportes_maestros': ('3.236.99.88', 5004),
    'analytics': ('3.236.99.88', 5007),
}

class ColorText:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

    @staticmethod
    def success(text):
        return f"{ColorText.GREEN}✅ {text}{ColorText.ENDC}"

    @staticmethod
    def error(text):
        return f"{ColorText.RED}❌ {text}{ColorText.ENDC}"

    @staticmethod
    def info(text):
        return f"{ColorText.BLUE}ℹ️  {text}{ColorText.ENDC}"

    @staticmethod
    def warning(text):
        return f"{ColorText.YELLOW}⚠️  {text}{ColorText.ENDC}"


def print_header(text):
    print(f"\n{ColorText.BOLD}{ColorText.BLUE}{'='*80}{ColorText.ENDC}")
    print(f"{ColorText.BOLD}{ColorText.BLUE}🚀 {text}{ColorText.ENDC}")
    print(f"{ColorText.BOLD}{ColorText.BLUE}{'='*80}{ColorText.ENDC}\n")


def check_service_availability(service_name: str, ip: str, port: int, timeout: int = 5, retries: int = 3) -> bool:
    """Verifica que un servicio esté disponible"""
    for attempt in range(retries):
        try:
            response = requests.get(f"http://{ip}:{port}/health", timeout=timeout)
            if response.status_code == 200:
                print(ColorText.success(f"{service_name} ({ip}:{port}) - disponible"))
                return True
        except Exception as e:
            if attempt < retries - 1:
                print(ColorText.warning(f"{service_name} - intento {attempt + 1}/{retries} falló, reintentando..."))
                time.sleep(2)
            else:
                print(ColorText.error(f"{service_name} ({ip}:{port}) - NO disponible: {e}"))
                return False
    return False


def wait_for_all_services(timeout_total: int = 300) -> bool:
    """Espera a que todos los servicios estén disponibles"""
    print_header("ESPERANDO DISPONIBILIDAD DE SERVICIOS")

    start_time = time.time()
    all_services_ready = False

    while time.time() - start_time < timeout_total:
        ready_count = 0
        total_count = len(SERVICES)

        for service_name, (ip, port) in SERVICES.items():
            if check_service_availability(service_name, ip, port, timeout=3, retries=1):
                ready_count += 1

        print(f"\n📊 Servicios listos: {ready_count}/{total_count}")

        if ready_count == total_count:
            all_services_ready = True
            print(ColorText.success(f"¡Todos los servicios están disponibles!"))
            break
        else:
            remaining_time = timeout_total - (time.time() - start_time)
            if remaining_time > 0:
                print(ColorText.info(f"Esperando... ({int(remaining_time)}s restantes)"))
                time.sleep(10)

    return all_services_ready


def run_python_tests() -> bool:
    """Ejecuta tests Python"""
    print_header("EJECUTANDO TESTS DE FLUJOS (Python)")

    test_file = TESTS_DIR / "service_flow_tests.py"

    if not test_file.exists():
        print(ColorText.error(f"No se encontró {test_file}"))
        return False

    try:
        # Asegurarse que requests está instalado
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "requests", "-q"],
            check=True,
            capture_output=True
        )

        result = subprocess.run(
            [sys.executable, str(test_file)],
            capture_output=False,
            timeout=600
        )

        return result.returncode == 0
    except Exception as e:
        print(ColorText.error(f"Error ejecutando tests Python: {e}"))
        return False


def run_javascript_tests() -> bool:
    """Ejecuta tests JavaScript"""
    print_header("EJECUTANDO TESTS DE FLUJOS (JavaScript)")

    test_file = TESTS_DIR / "service-flow-tests.js"

    if not test_file.exists():
        print(ColorText.error(f"No se encontró {test_file}"))
        return False

    try:
        # Instalar dependencias
        subprocess.run(
            ["npm", "install"],
            cwd=str(REPO_ROOT),
            capture_output=True,
            timeout=120
        )

        # Ejecutar tests
        result = subprocess.run(
            ["npm", "test", "--", str(test_file)],
            cwd=str(REPO_ROOT),
            capture_output=False,
            timeout=600
        )

        return result.returncode == 0
    except Exception as e:
        print(ColorText.warning(f"Tests JavaScript no disponibles: {e}"))
        return False


def run_validation_script() -> bool:
    """Ejecuta script de validación bash"""
    print_header("EJECUTANDO VALIDACIÓN DE DESPLIEGUE")

    script_file = SCRIPTS_DIR / "validate-deployment.sh"

    if not script_file.exists():
        print(ColorText.error(f"No se encontró {script_file}"))
        return False

    try:
        result = subprocess.run(
            ["bash", str(script_file)],
            capture_output=False,
            timeout=600
        )

        return result.returncode == 0
    except Exception as e:
        print(ColorText.warning(f"Validación bash no disponible: {e}"))
        return False


def generate_report(test_results: dict):
    """Genera reporte de resultados"""
    print_header("REPORTE FINAL DE DESPLIEGUE")

    timestamp = datetime.now().isoformat()

    report = {
        'timestamp': timestamp,
        'results': test_results,
        'summary': {
            'total': len(test_results),
            'passed': sum(1 for v in test_results.values() if v),
            'failed': sum(1 for v in test_results.values() if not v),
        }
    }

    print(json.dumps(report, indent=2))

    # Guardar reporte
    report_file = REPO_ROOT / "deployment-report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(ColorText.success(f"Reporte guardado en {report_file}"))

    # Resumen
    print(f"\n{'='*80}")
    print(f"✅ Pasadas: {report['summary']['passed']}")
    print(f"❌ Fallidas: {report['summary']['failed']}")
    print(f"📊 Total: {report['summary']['total']}")

    if report['summary']['failed'] == 0:
        print(f"\n{ColorText.success('¡DESPLIEGUE COMPLETADO EXITOSAMENTE!')}")
        return True
    else:
        print(f"\n{ColorText.error('Algunos tests fallaron. Revisar logs.')}")
        return False


def main():
    print(f"\n{ColorText.BOLD}{ColorText.CYAN}🎯 INICIANDO VALIDACIÓN DE DESPLIEGUE{ColorText.ENDC}")
    print(f"Timestamp: {datetime.now().isoformat()}\n")

    results = {}

    # 1. Esperar servicios
    print_header("FASE 1: DISPONIBILIDAD DE SERVICIOS")
    services_ready = wait_for_all_services(timeout_total=600)  # 10 minutos
    results['services_available'] = services_ready

    if not services_ready:
        print(ColorText.error("Los servicios no están disponibles. Abortando."))
        generate_report(results)
        return 1

    # 2. Esperar un poco más para que los servicios estabilicen
    print(ColorText.info("Esperando 10 segundos para que servicios estabilicen..."))
    time.sleep(10)

    # 3. Ejecutar tests
    print_header("FASE 2: EJECUCIÓN DE TESTS")

    results['python_tests'] = run_python_tests()
    results['javascript_tests'] = run_javascript_tests()
    results['validation_script'] = run_validation_script()

    # 4. Generar reporte
    success = generate_report(results)

    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
