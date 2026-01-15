#!/usr/bin/env python3
"""
Auto-Discovery and Configuration Updater
Descubre instancias EC2 y actualiza automáticamente todas las configuraciones
"""

import json
import subprocess
import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class InfrastructureDiscovery:
    def __init__(self, aws_region: str = "us-east-1", project_tag: str = "acompaamiento"):
        self.aws_region = aws_region
        self.project_tag = project_tag
        self.instances: Dict[str, Dict[str, str]] = {}
        
    def discover_instances(self) -> Dict[str, Dict[str, str]]:
        """Descubre instancias EC2 por nombre"""
        try:
            cmd = f"""
            aws ec2 describe-instances \
              --region {self.aws_region} \
              --filters 'Name=tag:Project,Values={self.project_tag}' \
                        'Name=instance-state-name,Values=running' \
              --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value|[0],InstanceId,PublicIpAddress,PrivateIpAddress]' \
              --output json
            """
            
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ Error al consultar AWS: {result.stderr}")
                return {}
            
            instances_data = json.loads(result.stdout)
            
            service_mapping = {
                "EC2-Frontend": {"public": None, "private": None, "id": None},
                "EC2-API-Gateway": {"public": None, "private": None, "id": None},
                "EC2-CORE": {"public": None, "private": None, "id": None},
                "EC2-DB": {"public": None, "private": None, "id": None},
                "EC2-Messaging": {"public": None, "private": None, "id": None},
                "EC2-Notificaciones": {"public": None, "private": None, "id": None},
                "EC2-Reportes": {"public": None, "private": None, "id": None},
                "EC2-Monitoring": {"public": None, "private": None, "id": None},
                "EC2-Bastion": {"public": None, "private": None, "id": None},
            }
            
            for instance in instances_data:
                if len(instance) >= 4:
                    name, instance_id, public_ip, private_ip = instance[0], instance[1], instance[2], instance[3]
                    if name in service_mapping:
                        service_mapping[name] = {
                            "public": public_ip,
                            "private": private_ip,
                            "id": instance_id
                        }
            
            self.instances = service_mapping
            return service_mapping
        
        except Exception as e:
            print(f"❌ Error al descubrir instancias: {e}")
            return {}
    
    def print_discovery_report(self):
        """Imprime reporte de descubrimiento"""
        print("\n" + "="*70)
        print("📋 DISCOVERY REPORT - Instancias EC2 Descubiertas")
        print("="*70 + "\n")
        
        for service, info in self.instances.items():
            status = "✅" if info["public"] else "❌"
            print(f"{status} {service:25} | Public: {info['public']:<15} | Private: {info['private']}")
        
        print("\n" + "="*70 + "\n")
    
    def get_instance_ips(self, service_name: str) -> Tuple[Optional[str], Optional[str]]:
        """Obtiene IPs públicas y privadas de un servicio"""
        if service_name in self.instances:
            info = self.instances[service_name]
            return info["public"], info["private"]
        return None, None


class ConfigurationUpdater:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.files_updated = 0
        self.lines_updated = 0
    
    def update_file(self, file_path: str, old_pattern: str, new_value: str) -> bool:
        """Actualiza un archivo con patrón regex"""
        try:
            full_path = self.project_root / file_path
            if not full_path.exists():
                return False
            
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            updated_content = re.sub(old_pattern, new_value, content)
            
            if updated_content != content:
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                lines_changed = len(updated_content.split('\n')) - len(content.split('\n'))
                self.files_updated += 1
                self.lines_updated += abs(lines_changed)
                return True
            
            return False
        except Exception as e:
            print(f"⚠️ Error al actualizar {file_path}: {e}")
            return False
    
    def update_api_gateway_ips(self, api_gateway_ip: str):
        """Actualiza todas las referencias al API Gateway"""
        if not api_gateway_ip:
            return
        
        print(f"\n🔄 Actualizando API Gateway IP a: {api_gateway_ip}")
        
        files_to_update = [
            # Docker Compose
            ("docker-compose.frontend.yml", r"http://[\d.]+:8080", f"http://{api_gateway_ip}:8080"),
            ("docker-compose.api-gateway.yml", r"http://[\d.]+:8080", f"http://{api_gateway_ip}:8080"),
            
            # Environment files
            (".env.prod.frontend", r"API_BASE_URL=http://[\d.]+:8080", f"API_BASE_URL=http://{api_gateway_ip}:8080"),
            ("scripts/.env.prod.frontend", r"API_BASE_URL=http://[\d.]+:8080", f"API_BASE_URL=http://{api_gateway_ip}:8080"),
            
            # Config files
            ("infrastructure.config.js", r"'http://[\d.]+:8080'", f"'http://{api_gateway_ip}:8080'"),
            ("infrastructure.hardcoded.config.js", r"'http://[\d.]+:8080'", f"'http://{api_gateway_ip}:8080'"),
            ("frontend-web/server.js", r"'http://[\d.]+:8080'", f"'http://{api_gateway_ip}:8080'"),
            ("frontend-web/public/js/config.js", r"'http://[\d.]+:8080'", f"'http://{api_gateway_ip}:8080'"),
        ]
        
        success_count = 0
        for file_path, pattern, new_value in files_to_update:
            if self.update_file(file_path, pattern, new_value):
                print(f"  ✅ {file_path}")
                success_count += 1
        
        print(f"\n✅ {success_count}/{len(files_to_update)} archivos actualizados")
    
    def update_database_ips(self, database_ip: str):
        """Actualiza todas las referencias a la base de datos"""
        if not database_ip:
            return
        
        print(f"\n🔄 Actualizando Database IP a: {database_ip}")
        
        # Patrones para MongoDB
        files_mongodb = [
            ("docker-compose.core.yml", r"mongodb://[\d.]+:27017", f"mongodb://admin:password@{database_ip}:27017"),
            ("docker-compose.prod.yml", r"mongodb://[\d.]+:27017", f"mongodb://admin:password@{database_ip}:27017"),
        ]
        
        # Patrones para PostgreSQL
        files_postgresql = [
            ("docker-compose.core.yml", r"postgresql://[\d.]+:5432", f"postgresql://postgres:password@{database_ip}:5432"),
        ]
        
        success_count = 0
        for file_path, pattern, new_value in files_mongodb + files_postgresql:
            if self.update_file(file_path, pattern, new_value):
                print(f"  ✅ {file_path}")
                success_count += 1
        
        print(f"\n✅ {success_count} archivos actualizados")
    
    def print_update_summary(self):
        """Imprime resumen de actualizaciones"""
        print("\n" + "="*70)
        print(f"📊 UPDATE SUMMARY")
        print("="*70)
        print(f"Archivos actualizados: {self.files_updated}")
        print(f"Líneas modificadas: {self.lines_updated}")
        print("="*70 + "\n")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Auto-Discovery y Configuration Updater')
    parser.add_argument('--region', default='us-east-1', help='AWS Region')
    parser.add_argument('--project-tag', default='acompaamiento', help='Project Tag')
    parser.add_argument('--dry-run', action='store_true', help='Solo mostrar cambios sin aplicarlos')
    parser.add_argument('--output-json', help='Guardar descobrimiento en archivo JSON')
    
    args = parser.parse_args()
    
    print("\n🚀 Auto-Discovery & Configuration Update")
    print("="*70 + "\n")
    
    # Descubrir instancias
    discovery = InfrastructureDiscovery(args.region, args.project_tag)
    discovery.discover_instances()
    discovery.print_discovery_report()
    
    # Guardar JSON si se solicita
    if args.output_json:
        with open(args.output_json, 'w') as f:
            json.dump(discovery.instances, f, indent=2)
        print(f"✅ Descobrimiento guardado en: {args.output_json}\n")
    
    # Actualizar configuraciones
    if not args.dry_run:
        updater = ConfigurationUpdater()
        
        api_gw_ip, _ = discovery.get_instance_ips("EC2-API-Gateway")
        db_ip, _ = discovery.get_instance_ips("EC2-DB")
        
        if api_gw_ip:
            updater.update_api_gateway_ips(api_gw_ip)
        
        if db_ip:
            updater.update_database_ips(db_ip)
        
        updater.print_update_summary()
    else:
        print("⚠️ DRY-RUN: No se realizaron cambios")
        print("Usa sin --dry-run para aplicar cambios\n")


if __name__ == "__main__":
    main()
