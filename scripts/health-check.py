#!/usr/bin/env python3
"""
Health Check & Endpoint Validation
Valida la salud de todos los servicios y endpoints
"""

import requests
import json
import time
import sys
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class ServiceStatus(Enum):
    HEALTHY = "✅"
    WARNING = "⚠️"
    ERROR = "❌"
    UNKNOWN = "❓"

@dataclass
class ServiceHealth:
    name: str
    url: str
    status: ServiceStatus
    response_time: Optional[float] = None
    error_message: Optional[str] = None
    status_code: Optional[int] = None

class HealthChecker:
    def __init__(self, timeout: int = 10, retries: int = 3, retry_delay: int = 5):
        self.timeout = timeout
        self.retries = retries
        self.retry_delay = retry_delay
        self.results: List[ServiceHealth] = []
    
    def check_endpoint(self, service_name: str, url: str, expected_status: int = 200) -> ServiceHealth:
        """Chequea un endpoint con reintentos"""
        for attempt in range(self.retries):
            try:
                start_time = time.time()
                response = requests.get(url, timeout=self.timeout, allow_redirects=True)
                response_time = time.time() - start_time
                
                if response.status_code == expected_status:
                    return ServiceHealth(
                        name=service_name,
                        url=url,
                        status=ServiceStatus.HEALTHY,
                        response_time=response_time,
                        status_code=response.status_code
                    )
                else:
                    return ServiceHealth(
                        name=service_name,
                        url=url,
                        status=ServiceStatus.WARNING,
                        response_time=response_time,
                        error_message=f"Expected {expected_status}, got {response.status_code}",
                        status_code=response.status_code
                    )
            
            except requests.exceptions.Timeout:
                error = "Connection timeout"
            except requests.exceptions.ConnectionError:
                error = "Connection refused"
            except requests.exceptions.RequestException as e:
                error = str(e)
            except Exception as e:
                error = f"Unexpected error: {str(e)}"
            
            if attempt < self.retries - 1:
                print(f"  ⏳ Intento {attempt + 1}/{self.retries} para {service_name} - {error}")
                time.sleep(self.retry_delay)
        
        return ServiceHealth(
            name=service_name,
            url=url,
            status=ServiceStatus.ERROR,
            error_message=error
        )
    
    def validate_services(self, services_config: Dict[str, Dict[str, str]]) -> List[ServiceHealth]:
        """Valida múltiples servicios"""
        print("\n" + "="*80)
        print("🧪 SERVICE HEALTH CHECK")
        print("="*80 + "\n")
        
        for service_name, config in services_config.items():
            if not config.get('ip') or config['ip'] == 'null':
                print(f"⏭️  {service_name:25} - SKIPPED (IP not available)")
                continue
            
            base_url = config['url']
            print(f"🔍 Checking {service_name:25} [{base_url}]...")
            
            endpoints = config.get('endpoints', [])
            for endpoint_name, endpoint_path, expected_status in endpoints:
                url = f"{base_url}{endpoint_path}"
                health = self.check_endpoint(f"{service_name}/{endpoint_name}", url, expected_status)
                self.results.append(health)
                
                status_icon = health.status.value
                response_info = f" ({health.response_time:.2f}s)" if health.response_time else ""
                error_info = f" - {health.error_message}" if health.error_message else ""
                
                print(f"  {status_icon} {endpoint_name:30} {response_info}{error_info}")
        
        return self.results
    
    def print_summary(self):
        """Imprime resumen de validación"""
        print("\n" + "="*80)
        print("📊 VALIDATION SUMMARY")
        print("="*80 + "\n")
        
        healthy = sum(1 for r in self.results if r.status == ServiceStatus.HEALTHY)
        warning = sum(1 for r in self.results if r.status == ServiceStatus.WARNING)
        error = sum(1 for r in self.results if r.status == ServiceStatus.ERROR)
        
        print(f"✅ Healthy:  {healthy}")
        print(f"⚠️  Warning:  {warning}")
        print(f"❌ Error:    {error}")
        print(f"📊 Total:    {len(self.results)}")
        print("\n" + "="*80 + "\n")
        
        if error > 0:
            print("⚠️ FAILED ENDPOINTS:")
            for result in self.results:
                if result.status == ServiceStatus.ERROR:
                    print(f"  ❌ {result.name:40} - {result.error_message}")
            print()
        
        success_rate = (healthy / len(self.results) * 100) if self.results else 0
        print(f"✨ Success Rate: {success_rate:.1f}%\n")
        
        return error == 0

class LogValidator:
    """Valida logs de servicios en instancias EC2"""
    
    def __init__(self):
        self.error_patterns = [
            r"error",
            r"exception",
            r"failed",
            r"fatal",
            r"panic",
            r"crash"
        ]
    
    def check_container_logs(self, ip: str, container_id: str) -> Tuple[bool, List[str]]:
        """Chequea logs de un container específico"""
        try:
            # Este método necesitaría SSH, implementar según necesidad
            return True, []
        except Exception as e:
            return False, [str(e)]


def create_services_config(instances: Dict[str, Dict[str, str]]) -> Dict[str, Dict]:
    """Crea configuración de servicios a validar"""
    
    api_gw_ip = instances.get("EC2-API-Gateway", {}).get("public")
    frontend_ip = instances.get("EC2-Frontend", {}).get("public")
    monitoring_ip = instances.get("EC2-Monitoring", {}).get("public")
    
    return {
        "API Gateway": {
            "ip": api_gw_ip,
            "url": f"http://{api_gw_ip}:8080" if api_gw_ip else "http://unknown:8080",
            "endpoints": [
                ("Health", "/health", 200),
                ("Status", "/status", 200),
                ("Auth Register", "/auth/register", 400),  # Esperamos error porque es POST
            ]
        },
        "Frontend": {
            "ip": frontend_ip,
            "url": f"http://{frontend_ip}" if frontend_ip else "http://unknown",
            "endpoints": [
                ("Home", "/", 200),
                ("Index", "/index.html", 200),
            ]
        },
        "Prometheus": {
            "ip": monitoring_ip,
            "url": f"http://{monitoring_ip}:9090" if monitoring_ip else "http://unknown:9090",
            "endpoints": [
                ("Health", "/-/healthy", 200),
                ("API", "/api/v1/query", 400),  # POST request esperado
            ]
        },
        "Grafana": {
            "ip": monitoring_ip,
            "url": f"http://{monitoring_ip}:3000" if monitoring_ip else "http://unknown:3000",
            "endpoints": [
                ("Health", "/api/health", 200),
                ("Login", "/login", 200),
            ]
        }
    }


def main():
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='Health Check & Validation')
    parser.add_argument('--instances-json', required=True, help='JSON con instancias descubiertas')
    parser.add_argument('--timeout', type=int, default=10, help='Timeout en segundos')
    parser.add_argument('--retries', type=int, default=3, help='Número de reintentos')
    parser.add_argument('--output-json', help='Guardar resultados en JSON')
    
    args = parser.parse_args()
    
    # Cargar instancias
    try:
        with open(args.instances_json, 'r') as f:
            instances_list = json.load(f)
        
        # Convertir lista a diccionario por nombre
        instances = {}
        for item in instances_list:
            if item[0]:  # Nombre
                instances[item[0]] = {
                    "id": item[1],
                    "public": item[2],
                    "private": item[3]
                }
    except Exception as e:
        print(f"❌ Error al cargar instancias: {e}")
        sys.exit(1)
    
    # Crear configuración y validar
    services_config = create_services_config(instances)
    checker = HealthChecker(timeout=args.timeout, retries=args.retries)
    checker.validate_services(services_config)
    
    success = checker.print_summary()
    
    # Guardar resultados
    if args.output_json:
        results = [
            {
                "service": r.name,
                "url": r.url,
                "status": r.status.name,
                "status_code": r.status_code,
                "response_time": r.response_time,
                "error": r.error_message
            }
            for r in checker.results
        ]
        with open(args.output_json, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"📄 Resultados guardados en: {args.output_json}\n")
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
