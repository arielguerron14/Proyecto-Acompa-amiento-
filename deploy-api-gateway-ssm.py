#!/usr/bin/env python3
"""
Deploy API Gateway using AWS Systems Manager (SSM)
"""
import json
import time

# Configuration
INSTANCE_IP = "35.168.216.132"  # For reference only
DOCKER_IMAGE = "caguerronp/api-gateway:latest"
CONTAINER_NAME = "api-gateway"
PORT = "8080"
CORE_HOST = "172.31.65.0"  # EC2-CORE private IP

def main():
    print(f"🚀 API Gateway Deployment with CORE_HOST Configuration")
    print(f"   Target: {INSTANCE_IP}:{PORT}")
    print(f"   Image: {DOCKER_IMAGE}")
    print(f"   CORE_HOST: {CORE_HOST}")
    print()
    
    commands = [
        'echo "📥 Pulling Docker image..."',
        f'docker pull {DOCKER_IMAGE}',
        'echo "🛑 Stopping old container..."',
        f'docker stop {CONTAINER_NAME} || true',
        f'docker rm {CONTAINER_NAME} || true',
        'sleep 2',
        'echo "🚀 Starting new container with CORE_HOST..."',
        f'docker run -d --name {CONTAINER_NAME} -p {PORT}:8080 -e CORE_HOST={CORE_HOST} -e NODE_ENV=production --restart always {DOCKER_IMAGE}',
        'sleep 5',
        'echo "🏥 Health check..."',
        f'curl -s http://localhost:{PORT}/health 2>&1 | head -20 || echo "Health check pending"',
        'echo "📋 Verifying environment..."',
        f'docker exec {CONTAINER_NAME} sh -c "echo CORE_HOST=${{CORE_HOST:-NOT_SET}}" || echo "Container not ready"',
    ]
    
    # Build the SSM command
    print("🔧 Building SSM command...")
    print()
    print("Commands to execute:")
    for i, cmd in enumerate(commands, 1):
        if not cmd.startswith('echo'):
            print(f"  {i}. {cmd}")
    
    print()
    print("📋 To execute via AWS Console:")
    print("  1. Go to Systems Manager > Run Command")
    print("  2. Select Document: AWS-RunShellScript")
    print("  3. Select EC2-API-Gateway instance")
    print("  4. Paste these commands in the Command parameters:")
    print()
    for cmd in commands:
        print(f"    {cmd}")
    
    print()
    print("📋 Or execute via AWS CLI:")
    print(f"""
aws ssm send-command \\
  --document-name "AWS-RunShellScript" \\
  --instance-ids "i-XXXXXXXXX" \\  # Replace with actual instance ID
  --region "us-east-1" \\
  --parameters 'commands={json.dumps(commands)}'
    """)

if __name__ == "__main__":
    main()
