#!/usr/bin/env python3
"""
Diagnose EC2-CORE connectivity issues
"""
import subprocess
import time

# Instance details
CORE_IP = "3.226.242.64"  # EC2-CORE public IP
CORE_PRIVATE = "172.31.65.0"  # EC2-CORE private IP

commands = [
    ("echo '=== Docker Containers Status ===' && docker ps -a", "List all containers"),
    ("docker inspect micro-auth 2>/dev/null | grep -E '\"IPAddress|Port' | head -20", "Check micro-auth network"),
    ("docker inspect micro-auth --format='{{.NetworkSettings.Networks}}'", "Micro-auth networks"),
    ("netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000", "Check port 3000 listening"),
    ("docker exec micro-auth sh -c 'netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000'", "Port 3000 inside container"),
    ("docker exec micro-auth sh -c 'curl -s http://localhost:3000/health 2>&1 | head -5'", "Test health inside container"),
    ("curl -s http://localhost:3000/health 2>&1 | head -5", "Test health from host (127.0.0.1)"),
    ("docker network inspect core-net 2>/dev/null | grep -A 20 Containers", "Check core-net network"),
]

print("🔍 Diagnosing EC2-CORE Connectivity Issues")
print(f"   Public IP: {CORE_IP}")
print(f"   Private IP: {CORE_PRIVATE}")
print()

for cmd, desc in commands:
    print(f"📋 {desc}")
    print(f"   Command: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
    output = result.stdout or result.stderr
    if output.strip():
        for line in output.split('\n')[:10]:
            if line.strip():
                print(f"   {line}")
    else:
        print("   (no output)")
    print()
