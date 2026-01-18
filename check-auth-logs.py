#!/usr/bin/env python3
"""
Check microservices logs to diagnose /auth/login error
"""
import json
import subprocess
import sys

print("🔍 Checking microservices logs...\n")

with open('config/instance_ips.json') as f:
    config = json.load(f)

core_ip = config['EC2-CORE']['InstanceId']

# SSH commands to check logs
commands = [
    ("docker ps -a", "Container status"),
    ("docker logs micro-auth 2>&1 | tail -30", "micro-auth logs (last 30 lines)"),
    ("docker logs api-gateway 2>&1 | tail -20", "api-gateway logs (last 20 lines)"),
]

print("=" * 70)
print("📋 MICROSERVICES STATUS & LOGS")
print("=" * 70)

for cmd, label in commands:
    print(f"\n🔹 {label}:")
    print("-" * 70)
    try:
        result = subprocess.run(
            ['aws', 'ssm', 'start-session', '--target', core_ip,
             '--document-name', 'AWS-RunShellScript',
             '--parameters', f'command={cmd}'],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            print(result.stdout[:1000])
        else:
            print(f"Error: {result.stderr[:300]}")
    except subprocess.TimeoutExpired:
        print("⏱️ Timeout")
    except Exception as e:
        print(f"❌ {str(e)[:100]}")

print("\n" + "=" * 70)
