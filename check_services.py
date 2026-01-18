#!/usr/bin/env python3
import paramiko
import os

ssh_key_path = "ssh-key-ec2.pem"

def check_instance(instance_name, ip):
    """SSH into instance and check running containers"""
    print(f"\n🔍 Checking {instance_name} ({ip})...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        key = paramiko.RSAKey.from_private_key_file(ssh_key_path)
        ssh.connect(ip, username='ubuntu', pkey=key, timeout=30)
        
        # Check running containers
        stdin, stdout, stderr = ssh.exec_command("docker ps --format 'table {{.Names}}\t{{.Status}}'")
        containers = stdout.read().decode()
        print(containers)
        
        ssh.close()
        return True
    except Exception as e:
        print(f"❌ Error connecting: {e}")
        return False

# Check all critical services
check_instance("EC2-DB", "44.192.33.182")
check_instance("EC2-CORE", "3.236.220.99")
check_instance("EC2-API-Gateway", "35.168.216.132")
