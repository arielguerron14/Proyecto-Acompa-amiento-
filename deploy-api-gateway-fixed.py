#!/usr/bin/env python3
"""
Deploy API Gateway with CORE_HOST configuration
"""
import subprocess
import time
import boto3
from paramiko import SSHClient, AutoAddPolicy
import os

# Configuration
INSTANCE_NAME = "EC2-API-Gateway"
AWS_REGION = "us-east-1"
DOCKER_IMAGE = "caguerronp/api-gateway:latest"
CONTAINER_NAME = "api-gateway"
PORT = "8080"
CORE_HOST = "172.31.65.0"  # EC2-CORE private IP

def get_instance_info():
    """Get EC2 instance public IP"""
    ec2 = boto3.client('ec2', region_name=AWS_REGION)
    
    response = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:Name', 'Values': [INSTANCE_NAME]},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )
    
    if not response['Reservations']:
        raise Exception(f"No running instance found with tag: {INSTANCE_NAME}")
    
    instance = response['Reservations'][0]['Instances'][0]
    return {
        'public_ip': instance.get('PublicIpAddress'),
        'private_ip': instance.get('PrivateIpAddress'),
        'instance_id': instance['InstanceId']
    }

def deploy_via_ssh(public_ip):
    """Deploy API Gateway via SSH"""
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    
    print(f"🔌 Connecting to {public_ip}...")
    
    # Try different key paths
    key_paths = [
        os.path.expanduser("~/.ssh/proyecto-key.pem"),
        os.path.expanduser("~/.ssh/id_rsa"),
    ]
    
    for key_path in key_paths:
        if os.path.exists(key_path):
            try:
                ssh.connect(public_ip, username="ubuntu", key_filename=key_path, timeout=10)
                print(f"✅ Connected using {key_path}")
                break
            except:
                continue
    else:
        raise Exception("Could not connect to instance")
    
    try:
        # Pull latest image
        print("📥 Pulling Docker image...")
        stdin, stdout, stderr = ssh.exec_command(f"docker pull {DOCKER_IMAGE}")
        stdout.channel.recv_exit_status()
        
        # Stop and remove old container
        print("🛑 Stopping old container...")
        ssh.exec_command(f"docker stop {CONTAINER_NAME} || true")
        time.sleep(1)
        ssh.exec_command(f"docker rm {CONTAINER_NAME} || true")
        time.sleep(1)
        
        # Start new container with CORE_HOST
        print(f"🚀 Starting container with CORE_HOST={CORE_HOST}...")
        cmd = (
            f"docker run -d "
            f"--name {CONTAINER_NAME} "
            f"-p {PORT}:8080 "
            f"-e CORE_HOST={CORE_HOST} "
            f"-e NODE_ENV=production "
            f"--restart always "
            f"{DOCKER_IMAGE}"
        )
        stdin, stdout, stderr = ssh.exec_command(cmd)
        container_id = stdout.read().decode().strip()
        print(f"✅ Container started: {container_id[:12]}")
        
        # Wait and health check
        time.sleep(5)
        print("🏥 Performing health check...")
        stdin, stdout, stderr = ssh.exec_command(f"curl -s http://localhost:{PORT}/health | head -20")
        health = stdout.read().decode()
        if health:
            print(f"✅ Health check response: {health[:100]}")
        else:
            print("⚠️  Health check pending")
        
        # Verify CORE_HOST is set
        print("📋 Verifying environment variables...")
        stdin, stdout, stderr = ssh.exec_command(f"docker exec {CONTAINER_NAME} sh -c 'echo CORE_HOST=${{CORE_HOST:-NOT_SET}}'")
        env_output = stdout.read().decode().strip()
        print(f"   {env_output}")
        
    finally:
        ssh.close()

def main():
    print(f"🚀 API Gateway Deployment with CORE_HOST Configuration")
    print(f"   Image: {DOCKER_IMAGE}")
    print(f"   CORE_HOST: {CORE_HOST}")
    print()
    
    try:
        # Get instance info
        info = get_instance_info()
        print(f"📍 Found instance {info['instance_id']}")
        print(f"   Public IP: {info['public_ip']}")
        print(f"   Private IP: {info['private_ip']}")
        print()
        
        # Deploy
        deploy_via_ssh(info['public_ip'])
        
        print()
        print(f"✅ Deployment completed!")
        print(f"   API Gateway: http://{info['public_ip']}:{PORT}")
        print(f"   Test endpoint: curl http://{info['public_ip']}:{PORT}/health")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()
