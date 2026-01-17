#!/usr/bin/env python3
"""
Manual IP update script - Update instance IPs directly
Useful when AWS CLI is not available or credentials are not configured locally

Usage:
    python3 manual-update-ips.py

Then specify the IPs for each instance when prompted.
"""

import json
from pathlib import Path
from datetime import datetime

# Current instances and their IPs (you'll update these manually)
INSTANCES = {
    "EC2-DB": {
        "InstanceId": "i-044d5e68b427462d2",
        "PublicIpAddress": "3.235.242.53",
        "PrivateIpAddress": "172.31.65.122",
    },
    "EC2-Messaging": {
        "InstanceId": "i-05b542859eb9b6773",
        "PublicIpAddress": "44.201.68.131",
        "PrivateIpAddress": "172.31.68.53",
    },
    "EC2-Notificaciones": {
        "InstanceId": "i-0310057c92934ed7f",
        "PublicIpAddress": "13.222.108.162",
        "PrivateIpAddress": "172.31.78.38",
    },
    "EC2-Monitoring": {
        "InstanceId": "i-0c64645c516c89508",
        "PublicIpAddress": "100.29.147.5",
        "PrivateIpAddress": "172.31.73.216",
    },
    "EC2-CORE": {
        "InstanceId": "i-081f465622ca0724a",
        "PublicIpAddress": "44.197.251.135",
        "PrivateIpAddress": "172.31.65.0",
    },
    "EC-Bastion": {
        "InstanceId": "i-0b042e910a1da4a1f",
        "PublicIpAddress": "54.91.218.98",
        "PrivateIpAddress": "172.31.75.78",
    },
    "EC2-Reportes": {
        "InstanceId": "i-0341e0dd14abdeb6c",
        "PublicIpAddress": "44.206.88.188",
        "PrivateIpAddress": "172.31.77.76",
    },
    "EC2-Frontend": {
        "InstanceId": "i-05a84b0d8e3c9e2a5",
        "PublicIpAddress": "3.231.12.130",
        "PrivateIpAddress": "172.31.77.249",
    },
    "EC2-API-Gateway": {
        "InstanceId": "i-0e5c7b2f4a9d1c6e8",
        "PublicIpAddress": "35.168.216.132",
        "PrivateIpAddress": "172.31.64.195",
    },
}

def main():
    print("📝 Manual Instance IP Update")
    print("="*60)
    print("\nCurrent IPs:")
    for name, info in INSTANCES.items():
        print(f"\n{name}:")
        print(f"  Public:  {info['PublicIpAddress']}")
        print(f"  Private: {info['PrivateIpAddress']}")
    
    print("\n" + "="*60)
    print("\nTo update an IP, enter it in the format:")
    print("  Instance-Name PublicIP PrivateIP")
    print("\nExample: EC2-API-Gateway 52.1.2.3 172.31.1.1")
    print("\nLeave empty and press Enter when done.\n")
    
    while True:
        user_input = input("Update IP (or press Enter to skip): ").strip()
        
        if not user_input:
            break
        
        parts = user_input.split()
        if len(parts) != 3:
            print("❌ Invalid format. Use: Instance-Name PublicIP PrivateIP")
            continue
        
        instance_name, public_ip, private_ip = parts
        
        if instance_name not in INSTANCES:
            print(f"❌ Instance '{instance_name}' not found")
            print(f"   Available: {', '.join(INSTANCES.keys())}")
            continue
        
        INSTANCES[instance_name]['PublicIpAddress'] = public_ip
        INSTANCES[instance_name]['PrivateIpAddress'] = private_ip
        print(f"✅ Updated {instance_name}")
    
    # Format for config file
    config_data = {}
    for name, info in INSTANCES.items():
        config_data[name] = {
            "InstanceId": info["InstanceId"],
            "Name": name,
            "PublicIpAddress": info["PublicIpAddress"],
            "PrivateIpAddress": info["PrivateIpAddress"],
            "Type": "t3.small"
        }
    
    # Save to config/instance_ips.json
    config_path = Path(__file__).parent / 'config' / 'instance_ips.json'
    with open(config_path, 'w') as f:
        json.dump(config_data, f, indent=4)
    
    print(f"\n✅ Saved to {config_path}")
    
    # Sync to all configs
    print("\n🔄 Syncing IPs to all configuration files...")
    import subprocess
    result = subprocess.run(['python', 'sync-ips-to-config.py'], 
                          cwd=Path(__file__).parent,
                          capture_output=True, text=True)
    print(result.stdout)
    
    # Commit and push
    print("\n🔗 Committing to git...")
    try:
        subprocess.run(['git', 'add', '.'], cwd=Path(__file__).parent, check=True)
        subprocess.run(['git', 'commit', '-m', 'chore: Update instance IPs [manual]'], 
                      cwd=Path(__file__).parent, check=True)
        subprocess.run(['git', 'push', 'origin', 'main'], 
                      cwd=Path(__file__).parent, check=True)
        print("✅ Changes pushed to GitHub")
    except Exception as e:
        print(f"⚠️  Git operation failed: {e}")
    
    print("\n✨ Done!")

if __name__ == '__main__':
    main()
