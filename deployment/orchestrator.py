#!/usr/bin/env python3
"""
Deployment Orchestrator for EC2 Docker Instances
Coordina despliegues de imágenes Docker en múltiples instancias EC2
"""

import argparse
import boto3
import json
import time
import sys
from typing import List, Dict, Optional
from datetime import datetime

class DeploymentOrchestrator:
    """Orquestador de despliegues en instancias EC2"""
    
    def __init__(self, region: str = "us-east-1"):
        self.ec2 = boto3.client("ec2", region_name=region)
        self.ssm = boto3.client("ssm", region_name=region)
        self.region = region
        
        # Mapping de instancias a imágenes
        self.instances_config = {
            "EC2-Bastion": {
                "images": ["bastion-host:latest"],
                "containers": ["bastion-host"],
                "ports": [22]
            },
            "EC2-API-Gateway": {
                "images": ["api-gateway:latest"],
                "containers": ["api-gateway"],
                "ports": [8080]
            },
            "EC2-CORE": {
                "images": [
                    "micro-auth:latest",
                    "micro-estudiantes:latest",
                    "micro-maestros:latest",
                    "micro-core:latest"
                ],
                "containers": [
                    "micro-auth",
                    "micro-estudiantes",
                    "micro-maestros",
                    "micro-core"
                ],
                "ports": [3001, 3002, 3003, 3004]
            },
            "EC2-Reportes": {
                "images": [
                    "micro-reportes-estudiantes:latest",
                    "micro-reportes-maestros:latest"
                ],
                "containers": [
                    "micro-reportes-estudiantes",
                    "micro-reportes-maestros"
                ],
                "ports": [4001, 4002]
            },
            "EC2-Notificaciones": {
                "images": ["micro-notificaciones:latest"],
                "containers": ["micro-notificaciones"],
                "ports": [5000]
            },
            "EC2-Messaging": {
                "images": [
                    "proyecto-zookeeper:1.0",
                    "proyecto-kafka:1.0",
                    "proyecto-rabbitmq:1.0"
                ],
                "containers": ["zookeeper", "kafka", "rabbitmq"],
                "ports": [2181, 9092, 5672]
            },
            "EC2-DB": {
                "images": [
                    "mongo:latest",
                    "postgres:latest",
                    "redis:latest"
                ],
                "containers": ["mongo", "postgres", "redis"],
                "ports": [27017, 5432, 6379],
                "volumes": ["mongo_data", "postgres_data", "redis_data"]
            },
            "EC2-Analytics": {
                "images": ["micro-analytics:latest"],
                "containers": ["micro-analytics"],
                "ports": [6000]
            },
            "EC2-Monitoring": {
                "images": [
                    "proyecto-prometheus:1.0",
                    "proyecto-grafana:1.0"
                ],
                "containers": ["prometheus", "grafana"],
                "ports": [9090, 3000],
                "volumes": ["prometheus_data", "grafana_data"]
            },
            "EC2-Frontend": {
                "images": ["frontend-web:latest"],
                "containers": ["frontend-web"],
                "ports": [80, 443]
            }
        }
    
    def get_instance_id(self, instance_tag: str) -> Optional[str]:
        """Obtiene el ID de una instancia por tag"""
        try:
            response = self.ec2.describe_instances(
                Filters=[
                    {"Name": "tag:Name", "Values": [instance_tag]},
                    {"Name": "instance-state-name", "Values": ["running"]}
                ]
            )
            
            if response["Reservations"]:
                return response["Reservations"][0]["Instances"][0]["InstanceId"]
            return None
        except Exception as e:
            print(f"❌ Error obteniendo instancia {instance_tag}: {str(e)}")
            return None
    
    def send_deploy_command(self, instance_id: str, commands: List[str]) -> str:
        """Envía comandos de despliegue a una instancia"""
        try:
            response = self.ssm.send_command(
                DocumentName="AWS-RunShellScript",
                InstanceIds=[instance_id],
                Parameters={"commands": commands}
            )
            return response["Command"]["CommandId"]
        except Exception as e:
            print(f"❌ Error enviando comando: {str(e)}")
            return None
    
    def get_command_status(self, command_id: str, instance_id: str) -> Dict:
        """Obtiene el estado de un comando"""
        try:
            response = self.ssm.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )
            return {
                "status": response["Status"],
                "stdout": response.get("StandardOutputContent", ""),
                "stderr": response.get("StandardErrorContent", "")
            }
        except Exception as e:
            print(f"⚠️  Error obteniendo estado: {str(e)}")
            return None
    
    def deploy_instance(self, instance_tag: str, wait: bool = True) -> bool:
        """Despliega imágenes en una instancia"""
        print(f"\n🚀 Iniciando despliegue en {instance_tag}...")
        
        # Obtener ID de la instancia
        instance_id = self.get_instance_id(instance_tag)
        if not instance_id:
            print(f"❌ Instancia {instance_tag} no encontrada o no está corriendo")
            return False
        
        print(f"📍 Instancia encontrada: {instance_id}")
        
        # Obtener configuración
        config = self.instances_config.get(instance_tag)
        if not config:
            print(f"❌ Configuración no encontrada para {instance_tag}")
            return False
        
        # Construir comandos de despliegue
        commands = self._build_deploy_commands(instance_tag, config)
        
        # Enviar comando
        command_id = self.send_deploy_command(instance_id, commands)
        if not command_id:
            return False
        
        print(f"📤 Comandos enviados. ID de comando: {command_id}")
        
        # Esperar resultado si se solicita
        if wait:
            return self._wait_for_completion(command_id, instance_id, instance_tag)
        
        return True
    
    def _build_deploy_commands(self, instance_tag: str, config: Dict) -> List[str]:
        """Construye los comandos de despliegue"""
        commands = []
        
        # Crear volúmenes si es necesario
        if "volumes" in config:
            for volume in config["volumes"]:
                commands.append(f"docker volume create {volume} || true")
        
        # Pull de imágenes
        for image in config["images"]:
            commands.append(f"echo 'Pulling {image}...'")
            commands.append(f"docker pull {image}")
        
        # Detener y remover contenedores viejos
        for container in config["containers"]:
            commands.append(f"docker stop {container} || true")
            commands.append(f"docker rm {container} || true")
        
        # Iniciar nuevos contenedores
        for i, (image, container, port) in enumerate(
            zip(config["images"], config["containers"], config["ports"])
        ):
            if instance_tag == "EC2-DB":
                commands.append(self._build_db_container_cmd(container, image, port, i, config))
            elif instance_tag == "EC2-Monitoring":
                commands.append(self._build_monitoring_container_cmd(container, image, port, i, config))
            else:
                commands.append(
                    f"docker run -d --name {container} -p {port}:{self._get_internal_port(container)} "
                    f"--restart always {image}"
                )
        
        # Agregar esperas para dependencias
        if instance_tag == "EC2-Messaging":
            commands.append("sleep 5")
        
        # Verificar despliegue
        commands.append(f"echo 'Verificando despliegue...'")
        commands.append("docker ps | grep -E '" + "|".join(config["containers"]) + "'")
        
        return commands
    
    def _build_db_container_cmd(self, container: str, image: str, port: int, index: int, config: Dict) -> str:
        """Construye comando para contenedores de base de datos"""
        volume = config.get("volumes", [])[index] if index < len(config.get("volumes", [])) else None
        
        if container == "mongo":
            return (
                f"docker run -d --name {container} -p {port}:27017 "
                f"-v {volume}:/data/db --restart always {image}"
            )
        elif container == "postgres":
            return (
                f"docker run -d --name {container} -p {port}:5432 "
                f"-e POSTGRES_PASSWORD=postgres -v {volume}:/var/lib/postgresql/data "
                f"--restart always {image}"
            )
        elif container == "redis":
            return (
                f"docker run -d --name {container} -p {port}:6379 "
                f"-v {volume}:/data --restart always {image}"
            )
        return ""
    
    def _build_monitoring_container_cmd(self, container: str, image: str, port: int, index: int, config: Dict) -> str:
        """Construye comando para contenedores de monitoreo"""
        volume = config.get("volumes", [])[index] if index < len(config.get("volumes", [])) else None
        
        if container == "prometheus":
            return (
                f"docker run -d --name {container} -p {port}:9090 "
                f"-v {volume}:/prometheus --restart always {image}"
            )
        elif container == "grafana":
            return (
                f"docker run -d --name {container} -p {port}:3000 "
                f"-v {volume}:/var/lib/grafana --restart always {image}"
            )
        return ""
    
    def _get_internal_port(self, container: str) -> int:
        """Obtiene el puerto interno del contenedor"""
        default_ports = {
            "bastion-host": 22,
            "api-gateway": 8080,
            "micro-": 3000,
            "zookeeper": 2181,
            "kafka": 9092,
            "rabbitmq": 5672,
            "frontend": 3000
        }
        
        for key, port in default_ports.items():
            if key in container:
                return port
        
        return 3000  # Puerto por defecto
    
    def _wait_for_completion(self, command_id: str, instance_id: str, instance_tag: str) -> bool:
        """Espera a que se complete el comando"""
        max_attempts = 60
        attempt = 0
        
        while attempt < max_attempts:
            status = self.get_command_status(command_id, instance_id)
            if not status:
                time.sleep(2)
                attempt += 1
                continue
            
            if status["status"] == "Success":
                print(f"✅ {instance_tag} desplegado exitosamente")
                if status["stdout"]:
                    print(f"📋 Output:\n{status['stdout']}")
                return True
            elif status["status"] == "Failed":
                print(f"❌ Error en despliegue de {instance_tag}")
                if status["stderr"]:
                    print(f"📋 Error:\n{status['stderr']}")
                return False
            elif status["status"] == "InProgress":
                print(f"⏳ Desplegando {instance_tag}... ({attempt}s)")
            
            time.sleep(2)
            attempt += 1
        
        print(f"⚠️  Timeout esperando despliegue de {instance_tag}")
        return False
    
    def deploy_all(self, environment: str = "dev", sequential: bool = True):
        """Despliega en todas las instancias"""
        print(f"\n🚀 Iniciando despliegue en TODAS las instancias (Environment: {environment})")
        print(f"Modo: {'Secuencial' if sequential else 'Paralelo'}")
        
        instances = list(self.instances_config.keys())
        failed = []
        succeeded = []
        
        # Orden recomendado
        deploy_order = [
            "EC2-DB",
            "EC2-Messaging",
            "EC2-Bastion",
            "EC2-CORE",
            "EC2-API-Gateway",
            "EC2-Reportes",
            "EC2-Notificaciones",
            "EC2-Analytics",
            "EC2-Monitoring",
            "EC2-Frontend"
        ]
        
        for instance_tag in deploy_order:
            if instance_tag in instances:
                start_time = datetime.now()
                success = self.deploy_instance(instance_tag, wait=True)
                duration = (datetime.now() - start_time).total_seconds()
                
                if success:
                    succeeded.append(instance_tag)
                    print(f"✅ {instance_tag} completado en {duration:.1f}s\n")
                else:
                    failed.append(instance_tag)
                    print(f"❌ {instance_tag} falló después de {duration:.1f}s\n")
        
        # Resumen
        self._print_summary(succeeded, failed)
    
    def _print_summary(self, succeeded: List[str], failed: List[str]):
        """Imprime resumen del despliegue"""
        print("\n" + "="*60)
        print("📊 RESUMEN DE DESPLIEGUE")
        print("="*60)
        
        if succeeded:
            print(f"\n✅ Exitosos ({len(succeeded)}):")
            for instance in succeeded:
                print(f"   • {instance}")
        
        if failed:
            print(f"\n❌ Fallidos ({len(failed)}):")
            for instance in failed:
                print(f"   • {instance}")
        
        print(f"\n📈 Total: {len(succeeded)} exitosos, {len(failed)} fallidos")
        print("="*60 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Orquestador de despliegues Docker en EC2"
    )
    
    parser.add_argument(
        "action",
        choices=["deploy-all", "deploy"],
        help="Acción a realizar"
    )
    
    parser.add_argument(
        "--instance",
        help="Etiqueta de instancia específica (para deploy)"
    )
    
    parser.add_argument(
        "--environment",
        choices=["dev", "staging", "prod"],
        default="dev",
        help="Ambiente de despliegue"
    )
    
    parser.add_argument(
        "--region",
        default="us-east-1",
        help="Región de AWS"
    )
    
    parser.add_argument(
        "--no-wait",
        action="store_true",
        help="No esperar a que se complete el despliegue"
    )
    
    parser.add_argument(
        "--list",
        action="store_true",
        help="Listar instancias disponibles"
    )
    
    args = parser.parse_args()
    
    # Crear orquestador
    orchestrator = DeploymentOrchestrator(region=args.region)
    
    # Listar instancias
    if args.list:
        print("\n📋 Instancias disponibles:")
        print("="*60)
        for instance_tag, config in orchestrator.instances_config.items():
            print(f"\n{instance_tag}")
            print(f"  Imágenes: {', '.join(config['images'])}")
            print(f"  Puertos: {', '.join(map(str, config['ports']))}")
        print("="*60 + "\n")
        return
    
    # Ejecutar acción
    try:
        if args.action == "deploy-all":
            orchestrator.deploy_all(environment=args.environment)
        elif args.action == "deploy":
            if not args.instance:
                print("❌ --instance requerido para acción 'deploy'")
                parser.print_help()
                sys.exit(1)
            
            wait = not args.no_wait
            success = orchestrator.deploy_instance(args.instance, wait=wait)
            sys.exit(0 if success else 1)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Despliegue cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
