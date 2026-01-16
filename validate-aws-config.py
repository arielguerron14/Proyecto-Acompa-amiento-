#!/usr/bin/env python3
"""
Script de Validación de Configuración AWS
Verifica que todas las rutas, IPs y configuraciones estén correctas
"""

import json
import os
import re
from pathlib import Path

class ConfigValidator:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.checks_passed = 0
        self.checks_total = 0
        self.config_dir = Path(__file__).parent
        
    def check(self, condition, message, is_warning=False):
        """Ejecuta una verificación"""
        self.checks_total += 1
        if condition:
            self.checks_passed += 1
            status = "⚠️ WARNING" if is_warning else "✅ PASS"
            print(f"{status}: {message}")
            if is_warning:
                self.warnings.append(message)
        else:
            status = "⚠️ WARNING" if is_warning else "❌ FAIL"
            print(f"{status}: {message}")
            if not is_warning:
                self.errors.append(message)
        return condition

    def validate_env_aws(self):
        """Valida .env.aws"""
        print("\n" + "="*60)
        print("VALIDANDO .env.aws")
        print("="*60)
        
        env_file = self.config_dir / ".env.aws"
        if not env_file.exists():
            self.check(False, ".env.aws no existe")
            return
        
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Verificar IP privada de BD
        self.check(
            "172.31.67.126" in content,
            "IP privada de BD (172.31.67.126) presente en .env.aws"
        )
        
        # Verificar que no haya placeholders en valores (no en comentarios)
        has_placeholder = "=IP_PRIVADA_EC2_DB" in content
        self.check(
            not has_placeholder,
            "No hay placeholders IP_PRIVADA_EC2_DB en valores (correctamente reemplazados)"
        )
        
        # Verificar variables de BD
        bd_vars = ["DB_HOST=172.31.67.126", 
                   "MONGO_URL=mongodb://172.31.67.126",
                   "POSTGRES_HOST=172.31.67.126",
                   "REDIS_HOST=172.31.67.126"]
        
        for var in bd_vars:
            self.check(var in content, f"Configuración presente: {var}")
        
        # Verificar puertos
        ports = ["MICRO_AUTH_PORT=5005", "API_GATEWAY_PORT=8080", "FRONTEND_PORT=5500"]
        for port in ports:
            self.check(port in content, f"Puerto configurado: {port}")

    def validate_ssh_config(self):
        """Valida .ssh/config"""
        print("\n" + "="*60)
        print("VALIDANDO .ssh/config")
        print("="*60)
        
        ssh_file = self.config_dir / ".ssh" / "config"
        if not ssh_file.exists():
            self.check(False, ".ssh/config no existe")
            return
        
        with open(ssh_file, 'r') as f:
            content = f.read()
        
        # Instancias esperadas
        hosts = {
            "bastion": "34.235.224.202",
            "core": "18.232.51.134",
            "db": "100.28.252.104",
            "frontend": "44.220.126.89",
            "api-gateway": "52.7.168.4",
            "messaging": "44.192.50.144",
            "monitoring": "98.88.93.98",
            "notificaciones": "3.229.118.110",
            "reportes": "52.200.32.56"
        }
        
        for host, ip in hosts.items():
            pattern = rf"Host\s+{host}.*?HostName\s+{ip}"
            self.check(
                re.search(pattern, content, re.IGNORECASE | re.DOTALL),
                f"Host '{host}' configurado con IP {ip}"
            )
        
        # Verificar ProxyJump (excepto bastion)
        for host in hosts:
            if host != "bastion":
                has_proxy = "ProxyJump bastion" in content
                self.check(
                    has_proxy,
                    f"Host '{host}' usa ProxyJump bastion para acceso seguro"
                )

    def validate_instance_ips(self):
        """Valida config/instance_ips.json"""
        print("\n" + "="*60)
        print("VALIDANDO config/instance_ips.json")
        print("="*60)
        
        ips_file = self.config_dir / "config" / "instance_ips.json"
        if not ips_file.exists():
            self.check(False, "config/instance_ips.json no existe")
            return
        
        try:
            with open(ips_file, 'r') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            self.check(False, "config/instance_ips.json no es JSON válido")
            return
        
        # Verificar instancias esperadas
        expected_instances = {
            "EC-Bastion": "34.235.224.202",
            "EC2-CORE": "18.232.51.134",
            "EC2-DB": "100.28.252.104",
            "EC2-Frontend": "44.220.126.89",
            "EC2-API-Gateway": "52.7.168.4",
            "EC2-Messaging": "44.192.50.144",
            "EC2-Monitoring": "98.88.93.98",
            "EC2-Notificaciones": "3.229.118.110",
            "EC2-Reportes": "52.200.32.56"
        }
        
        for instance_name, expected_ip in expected_instances.items():
            if instance_name in data:
                actual_ip = data[instance_name].get("PublicIpAddress")
                self.check(
                    actual_ip == expected_ip,
                    f"Instancia {instance_name}: IP pública = {actual_ip}"
                )
            else:
                self.check(False, f"Instancia {instance_name} no encontrada")
        
        # Verificar IPs privadas
        db_instance = data.get("EC2-DB", {})
        self.check(
            db_instance.get("PrivateIpAddress") == "172.31.67.126",
            f"EC2-DB IP privada = 172.31.67.126"
        )

    def validate_get_instance_ip(self):
        """Valida get_instance_ip.py"""
        print("\n" + "="*60)
        print("VALIDANDO get_instance_ip.py")
        print("="*60)
        
        script_file = self.config_dir / "get_instance_ip.py"
        if not script_file.exists():
            self.check(False, "get_instance_ip.py no existe")
            return
        
        with open(script_file, 'r') as f:
            content = f.read()
        
        # Verificar SERVICE_MAPPING
        services = ["bastion", "core", "db", "frontend", "api-gateway",
                    "messaging", "monitoring", "notificaciones", "reportes"]
        
        for service in services:
            self.check(
                f"'{service}'" in content,
                f"Servicio '{service}' en SERVICE_MAPPING"
            )
        
        # Verificar función get_instance_ip
        self.check(
            "def get_instance_ip" in content,
            "Función get_instance_ip() definida"
        )

    def validate_workflows(self):
        """Valida workflows de despliegue"""
        print("\n" + "="*60)
        print("VALIDANDO Workflows de Despliegue")
        print("="*60)
        
        workflows_dir = self.config_dir / ".github" / "workflows"
        if not workflows_dir.exists():
            self.check(False, "Directorio .github/workflows no existe")
            return
        
        deploy_workflows = list(workflows_dir.glob("deploy-ec2-*.yml"))
        self.check(
            len(deploy_workflows) == 10,
            f"Se encontraron {len(deploy_workflows)}/10 workflows deploy-ec2-*.yml"
        )
        
        for workflow in deploy_workflows:
            with open(workflow, 'r') as f:
                content = f.read()
            
            workflow_name = workflow.name
            
            # Verificar que ejecutan update_instance_ips.py
            self.check(
                "update_instance_ips.py" in content,
                f"{workflow_name}: Ejecuta update_instance_ips.py"
            )
            
            # Verificar que ejecutan get_instance_ip.py
            self.check(
                "get_instance_ip.py" in content,
                f"{workflow_name}: Ejecuta get_instance_ip.py"
            )
            
            # Verificar que usan INSTANCE_IP
            self.check(
                "INSTANCE_IP" in content,
                f"{workflow_name}: Usa variable INSTANCE_IP"
            )

    def generate_report(self):
        """Genera reporte final"""
        print("\n" + "="*60)
        print("RESUMEN DE VALIDACIÓN")
        print("="*60)
        
        print(f"\n✅ Verificaciones pasadas: {self.checks_passed}/{self.checks_total}")
        
        if self.errors:
            print(f"\n❌ ERRORES ({len(self.errors)}):")
            for error in self.errors:
                print(f"   - {error}")
        
        if self.warnings:
            print(f"\n⚠️  ADVERTENCIAS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        if not self.errors and self.checks_passed == self.checks_total:
            print("\n🎉 ¡TODA LA CONFIGURACIÓN ES CORRECTA!")
            print("Los microservicios pueden comunicarse en AWS sin problemas.")
            return 0
        elif not self.errors:
            print("\n✅ Configuración OK (con advertencias menores)")
            return 0
        else:
            print("\n❌ Hay errores que deben corregirse antes de desplegar")
            return 1

def main():
    validator = ConfigValidator()
    
    print("\n" + "="*60)
    print("VALIDADOR DE CONFIGURACIÓN AWS")
    print("="*60)
    
    validator.validate_env_aws()
    validator.validate_ssh_config()
    validator.validate_instance_ips()
    validator.validate_get_instance_ip()
    validator.validate_workflows()
    
    exit_code = validator.generate_report()
    exit(exit_code)

if __name__ == "__main__":
    main()
