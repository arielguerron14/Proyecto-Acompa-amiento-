#!/usr/bin/env python3
"""
Helper script to determine the correct docker-compose file name for each instance.
"""
import sys

# Mapping from instance names to their docker-compose file names
COMPOSE_FILES = {
    'messaging': 'docker-compose.ec2-messaging.yml',
    'db': 'docker-compose.ec2-db.yml',
    'core': 'docker-compose.ec2-core.yml',
    'api_gateway': 'docker-compose.api-gateway.yml',
    'reportes': 'docker-compose.ec2-reportes.yml',
    'notificaciones': 'docker-compose.ec2-notificaciones.yml',
    'analytics': 'docker-compose.ec2-analytics.yml',
    'monitoring': 'docker-compose.ec2-monitoring.yml',
    'frontend': 'docker-compose.frontend.yml',
    'bastion': 'docker-compose.ec2-bastion.yml',
}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: get-docker-compose-file.py <instance_name>")
        sys.exit(1)
    
    instance = sys.argv[1]
    if instance in COMPOSE_FILES:
        print(COMPOSE_FILES[instance])
    else:
        print(f"Error: Unknown instance '{instance}'", file=sys.stderr)
        sys.exit(1)
