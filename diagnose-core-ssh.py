#!/usr/bin/env python3
"""
Connect to EC2-CORE and diagnose microservices network issues
"""
import os
import subprocess
import sys

CORE_IP = "3.226.242.64"  # EC2-CORE public IP
CORE_PRIVATE = "172.31.65.0"  # EC2-CORE private IP

commands = [
    "echo '=== Docker Containers ===' && docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'",
    "echo '\n=== Micro-Auth Network ===' && docker inspect micro-auth --format '{{range .NetworkSettings.Networks}}Network: {{.}}, IP: {{.IPAddress}}\n{{end}}' 2>/dev/null",
    "echo '\n=== Ports Listening ===' && ss -tlnp 2>/dev/null | grep 300 || netstat -tlnp 2>/dev/null | grep 300",
    "echo '\n=== Container Port 3000 ===' && docker exec micro-auth ss -tlnp 2>/dev/null | grep 3000 || echo 'Container not accessible'",
    "echo '\n=== Health Check Inside ===' && docker exec micro-auth curl -s http://localhost:3000/health 2>&1 | head -3",
    "echo '\n=== Health Check Host ===' && curl -s http://localhost:3000/health 2>&1 | head -3",
    "echo '\n=== Core-net Bridge ===' && docker network inspect core-net 2>/dev/null | grep -A 30 '\"Containers\"'",
    "echo '\n=== API Gateway Connectivity Test ===' && docker network inspect core-net --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}})\n{{end}}'",
]

print(f"🔍 Diagnosing EC2-CORE ({CORE_IP}) Connectivity")
print(f"   Private IP: {CORE_PRIVATE}")
print()

# Try SSH connection
try:
    from paramiko import SSHClient, AutoAddPolicy
    
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    
    print(f"🔌 Connecting to {CORE_IP}...")
    
    # Try different key paths
    key_paths = [
        os.path.expanduser("~/.ssh/proyecto-key.pem"),
        os.path.expanduser("~/.ssh/id_rsa"),
        "/root/.ssh/proyecto-key.pem",
    ]
    
    for key_path in key_paths:
        if os.path.exists(key_path):
            try:
                ssh.connect(CORE_IP, username="ubuntu", key_filename=key_path, timeout=10)
                print(f"✅ Connected via {key_path}\n")
                
                for cmd in commands:
                    print(f"📋 Executing: {cmd[:60]}...")
                    stdin, stdout, stderr = ssh.exec_command(cmd)
                    output = stdout.read().decode()
                    if output.strip():
                        print(output[:500])
                    else:
                        error = stderr.read().decode()
                        if error.strip():
                            print(f"Error: {error[:200]}")
                    print()
                
                ssh.close()
                sys.exit(0)
            except Exception as e:
                continue
    
    print("❌ Could not connect - no SSH keys found")
    sys.exit(1)

except ImportError:
    print("❌ paramiko not installed")
    sys.exit(1)
