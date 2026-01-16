#!/usr/bin/env python3
"""
Script de Validación de Endpoints
Verifica que todos los microservicios estén respondiendo correctamente
"""

import requests
import json
import time
from pathlib import Path

class EndpointValidator:
    def __init__(self):
        self.config_file = Path(__file__).parent / "config" / "instance_ips.json"
        self.env_file = Path(__file__).parent / ".env.aws"
        self.endpoints = []
        self.passed = 0
        self.failed = 0
        
    def load_config(self):
        """Carga configuración de IPs"""
        if not self.config_file.exists():
            print(f"❌ {self.config_file} no encontrado")
            return False
        
        with open(self.config_file, 'r') as f:
            self.instances = json.load(f)
        
        return True
    
    def check_endpoint(self, name, ip, port, path="/"):
        """Verifica un endpoint específico"""
        url = f"http://{ip}:{port}{path}"
        timeout = 5
        
        try:
            response = requests.get(url, timeout=timeout)
            if response.status_code == 200:
                print(f"✅ {name:20} ({ip}:{port}) - {response.status_code}")
                self.passed += 1
                return True
            else:
                print(f"⚠️  {name:20} ({ip}:{port}) - {response.status_code}")
                self.failed += 1
                return False
        except requests.exceptions.Timeout:
            print(f"❌ {name:20} ({ip}:{port}) - TIMEOUT")
            self.failed += 1
            return False
        except requests.exceptions.ConnectionError:
            print(f"❌ {name:20} ({ip}:{port}) - CONNECTION REFUSED")
            self.failed += 1
            return False
        except Exception as e:
            print(f"❌ {name:20} ({ip}:{port}) - {str(e)}")
            self.failed += 1
            return False
    
    def validate_all(self):
        """Valida todos los endpoints"""
        if not self.load_config():
            return False
        
        print("\n" + "="*70)
        print("VALIDACIÓN DE ENDPOINTS")
        print("="*70)
        
        # Endpoints por servicio
        endpoints_map = {
            "EC2-API-Gateway": {"port": 8080, "path": "/api/health", "name": "API Gateway"},
            "EC2-CORE": {"port": 5001, "path": "/health", "name": "Core"},
            "EC2-DB": {"port": 5432, "path": "", "name": "PostgreSQL (BD)"},
            "EC2-Frontend": {"port": 5500, "path": "/", "name": "Frontend"},
            "EC2-Messaging": {"port": 5006, "path": "/health", "name": "Messaging"},
            "EC2-Monitoring": {"port": 9090, "path": "/graph", "name": "Monitoring (Prometheus)"},
            "EC2-Notificaciones": {"port": 5006, "path": "/health", "name": "Notificaciones"},
            "EC2-Reportes": {"port": 5004, "path": "/health", "name": "Reportes"},
            "EC2-Analytics": {"port": 5007, "path": "/health", "name": "Analytics"},
        }
        
        print("\n📋 Verificando Endpoints:")
        print("-" * 70)
        
        for instance_key, endpoint_config in endpoints_map.items():
            if instance_key in self.instances:
                instance = self.instances[instance_key]
                ip = instance.get("PublicIpAddress")
                port = endpoint_config["port"]
                path = endpoint_config["path"]
                name = endpoint_config["name"]
                
                if ip and ip != "N/A":
                    self.check_endpoint(name, ip, port, path)
                else:
                    print(f"⚠️  {name:20} - IP no disponible")
                    self.failed += 1
            else:
                print(f"⚠️  {instance_key:20} - No encontrado en config")
                self.failed += 1
        
        # Resumen
        print("\n" + "="*70)
        print(f"✅ PASADAS: {self.passed}")
        print(f"❌ FALLIDAS: {self.failed}")
        print("="*70)
        
        return self.failed == 0
    
    def generate_report(self):
        """Genera un reporte detallado"""
        print("\n" + "="*70)
        print("REPORTE DE DESPLIEGUE")
        print("="*70)
        
        print("\n🚀 INSTANCIAS ACTIVAS:")
        print("-" * 70)
        for name, instance in self.instances.items():
            print(f"{name:20} | Pub: {instance['PublicIpAddress']:18} | Priv: {instance['PrivateIpAddress']}")
        
        print("\n📊 ESTADO DE ENDPOINTS:")
        print("-" * 70)
        
        if self.failed == 0:
            print("✅ TODOS LOS ENDPOINTS RESPONDEN CORRECTAMENTE")
        else:
            print(f"⚠️  {self.failed} ENDPOINTS SIN RESPUESTA")
            print("   Verificar que los contenedores estén corriendo en EC2")
        
        print("\n💡 PRÓXIMOS PASOS:")
        print("-" * 70)
        print("1. Verificar logs de los contenedores:")
        print("   ssh -i ~/.ssh/labsuser.pem ubuntu@<IP_PUBLICA>")
        print("   docker ps")
        print("   docker logs <container_id>")
        print("")
        print("2. Acceder a servicios web:")
        print("   Frontend: http://EC2-Frontend:5500")
        print("   API Gateway: http://EC2-API-Gateway:8080")
        print("   Monitoring: http://EC2-Monitoring:9090")
        print("")
        print("3. Validar comunicación interna (desde EC2-CORE):")
        print("   nc -zv 172.31.67.126 5432  # PostgreSQL")
        print("   nc -zv 172.31.67.126 27017 # MongoDB")
        print("   nc -zv 172.31.67.126 6379  # Redis")

def main():
    validator = EndpointValidator()
    
    success = validator.validate_all()
    validator.generate_report()
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
