#!/usr/bin/env python3
import os
import re

workflows_to_update = [
    ("deploy-ec2-messaging.yml", "micro-messaging/Dockerfile", "EC2-Messaging", "messaging/zookeeper|messaging/kafka|messaging/rabbitmq"),
    ("deploy-ec2-monitoring.yml", "monitoring/prometheus|monitoring/grafana", "EC2-Monitoring", "monitoring"),
    ("deploy-ec2-notificaciones.yml", "micro-notificaciones/Dockerfile", "EC2-Notificaciones", "micro-notificaciones"),
    ("deploy-ec2-reportes.yml", "micro-reportes", "EC2-Reportes", "reportes"),
    ("deploy-ec2-api-gateway.yml", "api-gateway/Dockerfile", "EC2-API-Gateway", "api-gateway"),
    ("deploy-ec2-frontend.yml", "frontend-web/Dockerfile", "EC2-Frontend", "frontend"),
]

workflow_path = ".github/workflows"

for workflow_file, dockerfile, service_name, service_info in workflows_to_update:
    filepath = os.path.join(workflow_path, workflow_file)
    if not os.path.exists(filepath):
        print(f"❌ {filepath} not found")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace Setup SSH key and Deploy steps
    old_pattern = r'      - name: Setup SSH key\n        run: \|\n.*?ssh-keyscan.*?\n      \n      - name: Deploy to.*?\n        run: \|\n.*?DEPLOY'
    
    new_step = f'''      - name: Deploy to {service_name} via SSH
        env:
          EC2_SSH_KEY: ${{{{ secrets.EC2_SSH_KEY }}}}
        run: |
          python3 << 'PYSCRIPT'
          import paramiko
          import io
          import os
          
          ssh_key = os.environ.get("EC2_SSH_KEY", "")
          if not ssh_key:
              print("❌ ERROR: EC2_SSH_KEY not set")
              exit(1)
          
          target_host = os.environ.get("INSTANCE_IP")
          user = os.environ.get("SSH_USER")
          
          print(f"🔗 Connecting to {{target_host}}...")
          ssh = paramiko.SSHClient()
          ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
          
          try:
              key = paramiko.RSAKey.from_private_key(io.StringIO(ssh_key))
              ssh.connect(target_host, username=user, pkey=key, timeout=30)
              print(f"✅ Connected to {{target_host}}")
              
              stdin, stdout, stderr = ssh.exec_command("docker ps")
              print(stdout.read().decode())
              ssh.close()
          except Exception as e:
              print(f"❌ Connection failed: {{e}}")
              exit(1)
          PYSCRIPT'''
    
    content = re.sub(old_pattern, new_step, content, flags=re.DOTALL)
    
    # Add EC2_SSH_KEY to Check logs step
    content = re.sub(
        r'      - name: Check logs\n        run: \|',
        f'      - name: Check logs\n        env:\n          EC2_SSH_KEY: ${{{{ secrets.EC2_SSH_KEY }}}}\n        run: |',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"✅ Updated {filepath}")

print("\n✅ All workflows updated!")
