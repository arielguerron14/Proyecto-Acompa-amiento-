#!/usr/bin/env python3
"""
Generate all configuration files from config/instance_ips.json
This ensures all IPs are consumed from a single source of truth
"""
import json
import os
from pathlib import Path

# Read instance IPs from config
config_path = Path(__file__).parent / 'config' / 'instance_ips.json'
with open(config_path) as f:
    instances = json.load(f)

# Extract IPs from config
api_gateway_ip = instances['EC2-API-Gateway']['PublicIpAddress']
frontend_ip = instances['EC2-Frontend']['PublicIpAddress']
bastion_ip = instances['EC-Bastion']['PublicIpAddress']
db_ip = instances['EC2-DB']['PublicIpAddress']
messaging_ip = instances['EC2-Messaging']['PublicIpAddress']
core_ip = instances['EC2-CORE']['PublicIpAddress']

print(f"📍 API Gateway IP: {api_gateway_ip}")
print(f"📍 Frontend IP: {frontend_ip}")
print(f"📍 Bastion IP: {bastion_ip}")

# Generate .env.generated
env_generated = f"""# Auto-generated from config/instance_ips.json - DO NOT EDIT MANUALLY
# Generated on: {__import__('datetime').datetime.now().isoformat()}

API_GATEWAY_IP={api_gateway_ip}
API_GATEWAY_URL=http://{api_gateway_ip}:8080
API_GATEWAY_HOST={api_gateway_ip}

FRONTEND_IP={frontend_ip}
FRONTEND_URL=http://{frontend_ip}:5500

BASTION_IP={bastion_ip}
DB_IP={db_ip}
MESSAGING_IP={messaging_ip}
CORE_IP={core_ip}

# Docker Hub
DOCKER_USERNAME=${{DOCKER_USERNAME}}
DOCKER_TOKEN=${{DOCKER_TOKEN}}

# Environment
NODE_ENV=production
"""

# Generate docker-compose.frontend.yml with updated values
docker_compose_frontend = f"""version: '3.8'
services:
  frontend:
    image: ${{DOCKER_USERNAME}}/frontend-web:latest
    container_name: frontend-web
    ports:
      - "5500:5500"
    environment:
      NODE_ENV: production
      API_GATEWAY_URL: http://{api_gateway_ip}:8080
      API_GATEWAY_HOST: {api_gateway_ip}
      API_GATEWAY_PORT: 8080
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
"""

# Generate .env.prod.frontend
env_prod_frontend = f"""# Frontend Production Configuration - Auto-generated from instance_ips.json
NODE_ENV=production
API_BASE_URL=http://{api_gateway_ip}:8080
API_GATEWAY_HOST={api_gateway_ip}
API_GATEWAY_PORT=8080
"""

# Write files
output_files = {
    '.env.generated': env_generated,
    'docker-compose.frontend.yml': docker_compose_frontend,
    '.env.prod.frontend': env_prod_frontend,
}

project_root = Path(__file__).parent
for filename, content in output_files.items():
    filepath = project_root / filename
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✅ Generated {filename}")

print("\n✨ All configuration files generated from config/instance_ips.json")
print("📌 All IPs now consumed from single source of truth")
