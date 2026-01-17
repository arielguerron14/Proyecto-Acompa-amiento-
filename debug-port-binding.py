#!/usr/bin/env python3
"""
Create a script to execute via SSM to debug port binding on EC2-CORE
"""
import json

commands = [
    "echo '=== Docker containers ===' && docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
    "echo '\n=== Port 3000 listening ===' && netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000",
    "echo '\n=== Docker inspect micro-auth ports ===' && docker inspect micro-auth --format='{{.HostConfig.PortBindings}}'",
    "echo '\n=== Test connectivity from localhost ===' && curl -s http://127.0.0.1:3000/health 2>&1 | head -5",
    "echo '\n=== Test connectivity from 0.0.0.0 (should fail) ===' && curl -s http://0.0.0.0:3000/health 2>&1 | head -5 || echo 'Expected - cannot connect to 0.0.0.0'",
    "echo '\n=== Containers logs ===' && docker logs --tail 5 micro-auth 2>&1 | head -10",
]

print("📋 SSM Commands to Debug Port Binding on EC2-CORE")
print("=" * 80)
print()
print("Execute these commands on EC2-CORE via AWS Systems Manager:")
print()

for cmd in commands:
    print(f"{cmd}")
    print()

print("=" * 80)
print()
print("Or in one line:")
cmd_joined = "; ".join(commands)
print(f'aws ssm send-command --instance-ids "i-XXXXX" --document-name "AWS-RunShellScript" --parameters "commands=[\\"{cmd_joined}\\"]"')
