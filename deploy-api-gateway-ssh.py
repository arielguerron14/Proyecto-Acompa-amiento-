#!/usr/bin/env python3
"""
Deploy API Gateway with CORE_HOST configuration using direct SSH
"""
import subprocess
import time
from paramiko import SSHClient, AutoAddPolicy
import os
import sys

# Configuration
API_GATEWAY_IP = "35.168.216.132"  # EC2-API-Gateway public IP
DOCKER_IMAGE = "caguerronp/api-gateway:latest"
CONTAINER_NAME = "api-gateway"
PORT = "8080"
CORE_HOST = "172.31.65.0"  # EC2-CORE private IP

def deploy_via_ssh():
    """Deploy API Gateway via SSH"""
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    
    print(f"🔌 Connecting to {API_GATEWAY_IP}...")
    
    # Try different key paths
    key_paths = [
        os.path.expanduser("~/.ssh/proyecto-key.pem"),
        os.path.expanduser("~/.ssh/id_rsa"),
        "/root/.ssh/proyecto-key.pem",
        "/root/.ssh/id_rsa",
    ]
    
    connected = False
    for key_path in key_paths:
        if os.path.exists(key_path):
            try:
                ssh.connect(API_GATEWAY_IP, username="ubuntu", key_filename=key_path, timeout=10)
                print(f"✅ Connected using {key_path}")
                connected = True
                break
            except Exception as e:
                print(f"   ⚠️  Failed with {key_path}: {str(e)[:50]}")
                continue
    
    if not connected:
        raise Exception("Could not connect to instance - no valid SSH keys found")
    
    try:
        # Pull latest image
        print("📥 Pulling Docker image...")
        stdin, stdout, stderr = ssh.exec_command(f"docker pull {DOCKER_IMAGE}")
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode()
        if exit_code != 0:
            print(f"   ⚠️  Error: {stderr.read().decode()}")
        else:
            print(f"   ✅ Image pulled successfully")
        
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
        print(f"   Command: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        container_id = stdout.read().decode().strip()
        error = stderr.read().decode()
        if error:
            print(f"   ⚠️  Error: {error}")
        if container_id:
            print(f"   ✅ Container started: {container_id[:12]}")
        else:
            print(f"   ⚠️  No container ID returned")
        
        # Wait and health check
        print("⏳ Waiting for container to start...")
        time.sleep(5)
        
        print("🏥 Performing health check...")
        stdin, stdout, stderr = ssh.exec_command(f"curl -s http://localhost:{PORT}/health 2>&1 | head -30")
        health = stdout.read().decode()
        if health:
            print(f"✅ Health response:\n{health}")
        else:
            print("⚠️  Health check returned no output")
        
        # Verify CORE_HOST is set in container
        print("📋 Verifying environment variables in container...")
        stdin, stdout, stderr = ssh.exec_command(f"docker exec {CONTAINER_NAME} sh -c 'echo CORE_HOST=\\${{CORE_HOST:-NOT_SET}}'")
        env_output = stdout.read().decode().strip()
        print(f"   {env_output}")
        
        # Check logs
        print("📋 Recent container logs...")
        stdin, stdout, stderr = ssh.exec_command(f"docker logs {CONTAINER_NAME} 2>&1 | tail -10")
        logs = stdout.read().decode()
        if logs:
            for line in logs.split('\n')[-5:]:
                if line.strip():
                    print(f"   {line}")
        
    finally:
        ssh.close()

def main():
    print(f"🚀 API Gateway Deployment with CORE_HOST Configuration")
    print(f"   Target: {API_GATEWAY_IP}:{PORT}")
    print(f"   Image: {DOCKER_IMAGE}")
    print(f"   CORE_HOST: {CORE_HOST}")
    print()
    
    try:
        deploy_via_ssh()
        
        print()
        print(f"✅ Deployment completed!")
        print(f"   API Gateway: http://{API_GATEWAY_IP}:{PORT}")
        print(f"   Test /health: curl http://{API_GATEWAY_IP}:{PORT}/health")
        print(f"   Test /auth/register: curl -X POST http://{API_GATEWAY_IP}:{PORT}/auth/register")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

if __name__ == "__main__":
    main()
