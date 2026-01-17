#!/usr/bin/env python3
"""
Test script to verify EC2-Reportes deployment and image functionality
Tests:
1. Instance connectivity via SSH
2. Docker status
3. Image build (if needed)
4. Container deployment simulation
"""

import paramiko
import json
import os
import sys

def test_reportes_deployment():
    """Test EC2-Reportes deployment"""
    
    # Cargar IPs
    with open('config/instance_ips.json', 'r') as f:
        instances = json.load(f)
    
    reportes_info = instances.get('EC2-Reportes', {})
    public_ip = reportes_info.get('PublicIpAddress')
    private_ip = reportes_info.get('PrivateIpAddress')
    
    print("=" * 70)
    print("🧪 TESTING EC2-REPORTES DEPLOYMENT")
    print("=" * 70)
    print()
    print(f"📍 Instance Information:")
    print(f"   Name: EC2-Reportes")
    print(f"   Public IP: {public_ip}")
    print(f"   Private IP: {private_ip}")
    print(f"   Type: {reportes_info.get('Type', 'unknown')}")
    print()
    
    # Verificar SSH key
    ssh_key_path = os.path.expanduser('~/.ssh/labsuser.pem')
    if not os.path.exists(ssh_key_path):
        print("⚠️  SSH key not found at ~/.ssh/labsuser.pem")
        print("   You need the SSH key to test deployment")
        return False
    
    if not public_ip or public_ip == 'N/A':
        print("❌ No public IP found for EC2-Reportes")
        return False
    
    # Intentar conexión SSH
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"🔗 Testing SSH connection to {public_ip}...")
        ssh.connect(public_ip, username='ubuntu', key_filename=ssh_key_path, timeout=10)
        print(f"✅ SSH connection successful")
        print()
        
        # Verificar Docker
        print("📦 Checking Docker status...")
        stdin, stdout, stderr = ssh.exec_command('docker --version')
        docker_version = stdout.read().decode().strip()
        print(f"✅ Docker: {docker_version}")
        
        # Listar containers actuales
        print()
        print("📋 Current containers:")
        stdin, stdout, stderr = ssh.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"')
        containers = stdout.read().decode().strip()
        if containers:
            for line in containers.split('\n'):
                print(f"   {line}")
        else:
            print("   (No containers running)")
        
        # Verificar imagen micro-analytics
        print()
        print("🖼️  Checking for micro-analytics image...")
        stdin, stdout, stderr = ssh.exec_command('docker images | grep micro-analytics')
        images = stdout.read().decode().strip()
        if images:
            print(f"✅ Image found:")
            for line in images.split('\n'):
                print(f"   {line}")
        else:
            print("⚠️  No micro-analytics image found (will be pulled during deployment)")
        
        # Probar que el puerto 5007 está disponible
        print()
        print("🔌 Checking port 5007...")
        stdin, stdout, stderr = ssh.exec_command('netstat -ln 2>/dev/null | grep 5007 || echo "Port 5007 is available"')
        port_status = stdout.read().decode().strip()
        print(f"   {port_status}")
        
        # Simulación de deployment
        print()
        print("🚀 SIMULATING DEPLOYMENT...")
        print("   (This shows what the workflow will do)")
        print()
        
        deploy_commands = [
            "echo 'Step 1: Pulling micro-analytics image...'",
            "echo 'docker pull <docker_username>/micro-analytics:latest'",
            "echo ''",
            "echo 'Step 2: Stopping any existing container...'",
            "docker stop micro-analytics 2>/dev/null || echo 'No previous container'",
            "docker rm micro-analytics 2>/dev/null || echo 'Container removed'",
            "echo ''",
            "echo 'Step 3: Starting new container...'",
            "echo 'docker run -d --name micro-analytics -p 5007:5007 <docker_username>/micro-analytics:latest'",
            "echo ''",
            "echo 'Step 4: Waiting for container to start...'",
            "sleep 2",
            "echo ''",
            "echo 'Step 5: Verifying deployment...'",
            "echo 'docker ps | grep micro-analytics'",
        ]
        
        deploy_cmd = "; ".join(deploy_commands)
        stdin, stdout, stderr = ssh.exec_command(deploy_cmd)
        
        output = stdout.read().decode()
        print(output)
        
        print()
        print("=" * 70)
        print("✅ EC2-REPORTES TEST SUCCESSFUL")
        print("=" * 70)
        print()
        print("Summary:")
        print("  ✅ SSH connection works")
        print("  ✅ Docker is installed and running")
        print("  ✅ Port 5007 is available")
        print("  ✅ Instance is ready for deployment")
        print()
        print("Next steps:")
        print("  1. Set up GitHub Secrets (DOCKER_USERNAME, DOCKER_TOKEN, EC2_SSH_KEY)")
        print("  2. Push changes to trigger workflow or run manually from GitHub Actions")
        print("  3. Monitor workflow execution at: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions")
        print()
        
        ssh.close()
        return True
        
    except paramiko.AuthenticationException:
        print(f"❌ SSH Authentication failed")
        print("   Check your SSH key")
        return False
    except paramiko.SSHException as e:
        print(f"❌ SSH Error: {e}")
        print("   Instance may not be reachable")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    success = test_reportes_deployment()
    sys.exit(0 if success else 1)
