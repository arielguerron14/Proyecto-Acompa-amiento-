#!/usr/bin/env python3
import json
import subprocess
import sys

print("🔍 Checking infrastructure status via AWS SSM (bypassing SSH)...")

with open('config/instance_ips.json') as f:
    config = json.load(f)

instances = {
    'EC2-DB': config['EC2-DB']['InstanceId'],
    'EC2-CORE': config['EC2-CORE']['InstanceId'],
    'EC2-API-Gateway': config['EC2-API-Gateway']['InstanceId'],
}

commands = {
    'MongoDB status': 'docker ps | grep mongo',
    'microservices status': 'docker ps | grep micro-',
    'API Gateway status': 'docker ps | grep api-gateway',
}

for name, instance_id in instances.items():
    print(f"\n{'='*60}")
    print(f"🔌 {name} ({instance_id})")
    print('='*60)
    
    for cmd_name, cmd in commands.items():
        try:
            result = subprocess.run(
                ['aws', 'ssm', 'start-session', '--target', instance_id, '--document-name', 'AWS-RunShellScript', '--parameters', f'command={cmd}'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                output = result.stdout
                if output.strip():
                    print(f"\n✅ {cmd_name}:")
                    print('  ' + '\n  '.join(output.strip().split('\n')[-5:]))
                else:
                    print(f"\n⚠️  {cmd_name}: (no output)")
            else:
                print(f"\n❌ {cmd_name}: {result.stderr[:100]}")
        except subprocess.TimeoutExpired:
            print(f"\n⏱️  {cmd_name}: Timeout")
        except Exception as e:
            print(f"\n❌ {cmd_name}: {str(e)[:100]}")
