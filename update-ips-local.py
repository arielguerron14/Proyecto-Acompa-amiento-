#!/usr/bin/env python3
"""
Manually update IPs from AWS CLI (requires AWS credentials configured locally)
Usage: python3 update-ips-local.py
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

def fetch_instance_ips_from_aws():
    """Fetch current instance IPs from AWS"""
    try:
        result = subprocess.run([
            'aws', 'ec2', 'describe-instances',
            '--filters', 'Name=instance-state-name,Values=running',
            '--region', 'us-east-1',
            '--output', 'json'
        ], capture_output=True, text=True, check=True)
        
        data = json.loads(result.stdout)
        instances = {}
        
        print("📋 Scanning instances from AWS:")
        for reservation in data.get('Reservations', []):
            for inst in reservation.get('Instances', []):
                name = None
                
                # Get name from tag
                for tag in inst.get('Tags', []):
                    if tag.get('Key') == 'Name':
                        name = tag.get('Value')
                        break
                
                if name:
                    pub_ip = inst.get('PublicIpAddress', 'N/A')
                    priv_ip = inst.get('PrivateIpAddress', 'N/A')
                    
                    instances[name] = {
                        'InstanceId': inst.get('InstanceId'),
                        'Name': name,
                        'PublicIpAddress': pub_ip,
                        'PrivateIpAddress': priv_ip,
                        'Type': inst.get('InstanceType', 'unknown')
                    }
                    print(f"  ✅ {name}: {pub_ip}")
        
        return instances
    except Exception as e:
        print(f"❌ Failed to fetch IPs from AWS: {e}")
        print("   Make sure you have AWS CLI installed and credentials configured")
        return None

def update_config(instances):
    """Update config/instance_ips.json"""
    config_path = Path(__file__).parent / 'config' / 'instance_ips.json'
    
    with open(config_path, 'w') as f:
        json.dump(instances, f, indent=4)
    
    print(f"\n✅ Updated {config_path}")

def sync_to_all_configs():
    """Run sync-ips-to-config.py"""
    try:
        result = subprocess.run([
            'python3', 'sync-ips-to-config.py'
        ], cwd=Path(__file__).parent, capture_output=True, text=True, check=True)
        
        print(f"\n{result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to sync configs: {e}")
        print(f"   {e.stderr}")
        return False

def main():
    print("🔄 Updating IPs from AWS...")
    
    # Fetch IPs from AWS
    instances = fetch_instance_ips_from_aws()
    if not instances:
        print("\n❌ No instances found or AWS fetch failed")
        return 1
    
    # Update config/instance_ips.json
    update_config(instances)
    
    # Sync to all config files
    if not sync_to_all_configs():
        return 1
    
    # Commit changes
    print("\n🔗 Committing changes...")
    try:
        subprocess.run(['git', 'add', '.'], cwd=Path(__file__).parent, check=True)
        result = subprocess.run([
            'git', 'commit', '-m', 'chore: Update instance IPs from AWS [local]'
        ], cwd=Path(__file__).parent, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Changes committed")
            
            # Push to remote
            subprocess.run(['git', 'push', 'origin', 'main'], 
                         cwd=Path(__file__).parent, check=True)
            print("✅ Changes pushed to GitHub")
        else:
            print("ℹ️  No changes to commit")
    except Exception as e:
        print(f"⚠️  Could not commit: {e}")
    
    print("\n✨ IP update complete!")
    return 0

if __name__ == '__main__':
    exit(main())
