#!/usr/bin/env python3
"""
Restart microservices on EC2-CORE to reconnect to MongoDB after restart
"""
import json
import subprocess
import sys
from pathlib import Path

print("🔄 Restarting microservices to reconnect to MongoDB...\n")

with open('config/instance_ips.json') as f:
    config = json.load(f)

core_instance = config['EC2-CORE']['InstanceId']
db_instance = config['EC2-DB']['InstanceId']

# Commands to run on EC2-CORE
restart_commands = [
    "echo '🔍 Current containers:'",
    "docker ps -a | grep micro",
    "",
    "echo '🛑 Stopping old microservices...'",
    "docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true",
    "docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true",
    "",
    "echo '✅ Starting fresh microservices...'",
    "docker run -d --name micro-auth --network core-net -p 3000:3000 \\",
    "  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/auth?authSource=admin' \\",
    "  -e PORT=3000 \\",
    "  -e NODE_ENV=production \\",
    "  --add-host=db-host:172.31.65.122 \\",
    "  arielguerron14/micro-auth:latest",
    "",
    "docker run -d --name micro-estudiantes --network core-net -p 3001:3001 \\",
    "  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/estudiantes?authSource=admin' \\",
    "  -e AUTH_SERVICE_URL='http://micro-auth:3000' \\",
    "  -e PORT=3001 \\",
    "  -e NODE_ENV=production \\",
    "  --add-host=db-host:172.31.65.122 \\",
    "  arielguerron14/micro-estudiantes:latest",
    "",
    "docker run -d --name micro-maestros --network core-net -p 3002:3002 \\",
    "  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/maestros?authSource=admin' \\",
    "  -e AUTH_SERVICE_URL='http://micro-auth:3000' \\",
    "  -e PORT=3002 \\",
    "  -e NODE_ENV=production \\",
    "  --add-host=db-host:172.31.65.122 \\",
    "  arielguerron14/micro-maestros:latest",
    "",
    "echo '⏳ Waiting 3 seconds for containers to stabilize...'",
    "sleep 3",
    "",
    "echo '✅ Container status:'",
    "docker ps | grep micro",
    "",
    "echo '🔍 Checking logs for MongoDB connection...'",
    "docker logs micro-auth 2>&1 | grep -i 'mongo\\|connected\\|error' | tail -3",
]

cmd_script = '; '.join(restart_commands)

print("📤 Sending restart commands to EC2-CORE via SSM...")
try:
    result = subprocess.run(
        ['aws', 'ssm', 'start-session', '--target', core_instance,
         '--document-name', 'AWS-RunShellScript',
         '--parameters', f'command={cmd_script}'],
        timeout=60
    )
    if result.returncode == 0:
        print("\n✅ Microservices restarted successfully!")
    else:
        print("\n❌ Failed to restart microservices")
except subprocess.TimeoutExpired:
    print("\n⏱️ Command timed out")
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n🔗 Sleeping 5 seconds for containers to fully start...")
import time
time.sleep(5)

print("🧪 Testing microservice connectivity to MongoDB...")
subprocess.run(['python', 'test-end-to-end.py'])
