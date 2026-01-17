#!/usr/bin/env python3
"""
Generate API Gateway .env file with IPs from config/instance_ips.json
"""
import json
from pathlib import Path

# Load instance IPs
config_path = Path(__file__).parent / 'config' / 'instance_ips.json'
with open(config_path) as f:
    instances = json.load(f)

# Get IPs
frontend_ip = instances['EC2-Frontend']['PublicIpAddress']
core_ip = instances['EC2-CORE']['PublicIpAddress']

# When running in Docker on EC2-CORE, services are on localhost
# When accessing from outside, use the core IP
api_gateway_env = f"""# Auto-generated from config/instance_ips.json
# This .env is used when API Gateway runs in Docker on EC2-CORE

PORT=8080

# Microservices - use localhost since API Gateway runs in Docker on same host
# In production, these services are in containers linked to the same network
AUTH_SERVICE_URL=http://micro-auth:3000
ESTUDIANTES_SERVICE_URL=http://micro-estudiantes:3001
MAESTROS_SERVICE_URL=http://micro-maestros:3002
REPORTES_EST_SERVICE=http://micro-reportes-estudiantes:5003
REPORTES_MAEST_SERVICE=http://micro-reportes-maestros:5004

# Database connections
MONGO_URL=mongodb://admin:MyMongoProd123!@db:27017/acompaamiento?authSource=admin
POSTGRES_URL=postgresql://admin:MyPostgresProd123!@db:5432/acompaamiento

LOG_LEVEL=info

# CORS - Allow requests from frontend
CORS_ORIGIN=http://localhost:5500,http://127.0.0.1:5500,http://{frontend_ip}:5500,https://{frontend_ip}:5500

# Service Registry Configuration
CORE_HOST=http://localhost
EC2_CORE_IP={core_ip}
"""

# Write file
api_gateway_path = Path(__file__).parent / 'api-gateway' / '.env'
api_gateway_path.write_text(api_gateway_env)
print(f"✅ Generated {api_gateway_path}")
print(f"\n📌 CORS Origins configured:")
print(f"   • http://localhost:5500")
print(f"   • http://{frontend_ip}:5500")
