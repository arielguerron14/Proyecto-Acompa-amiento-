#!/usr/bin/env python3
"""
Script to prepare GitHub Secrets for the Dynamic IP Discovery Workflow
This script helps you configure AWS credentials and SSH key in GitHub Secrets
"""

import base64
import sys
import os
import json
from pathlib import Path


def encode_file_to_base64(file_path: str) -> str:
    """Read file and encode to base64"""
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        return base64.b64encode(content).decode('utf-8')
    except FileNotFoundError:
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)


def validate_aws_credentials(access_key: str, secret_key: str, session_token: str = None) -> bool:
    """Validate AWS credentials format"""
    if not access_key or not secret_key:
        print("❌ Error: Access Key and Secret Key are required")
        return False
    
    if len(access_key) < 10:
        print("❌ Error: Access Key ID seems too short")
        return False
    
    if len(secret_key) < 20:
        print("❌ Error: Secret Access Key seems too short")
        return False
    
    return True


def prepare_github_secrets():
    """Interactive script to prepare GitHub Secrets"""
    
    print("\n" + "="*60)
    print("GitHub Actions Secrets Configuration")
    print("="*60 + "\n")
    
    secrets = {}
    
    # Step 1: AWS Credentials
    print("📋 STEP 1: AWS Credentials")
    print("-" * 60)
    print("Your credentials can be from:")
    print("  • AWS IAM User (static credentials)")
    print("  • AWS STS Temporary Credentials (with session token)")
    print()
    
    access_key = input("Enter AWS_ACCESS_KEY_ID: ").strip()
    secret_key = input("Enter AWS_SECRET_ACCESS_KEY: ").strip()
    session_token = input("Enter AWS_SESSION_TOKEN (optional, press Enter to skip): ").strip()
    
    if not validate_aws_credentials(access_key, secret_key, session_token):
        sys.exit(1)
    
    secrets['AWS_ACCESS_KEY_ID'] = access_key
    secrets['AWS_SECRET_ACCESS_KEY'] = secret_key
    
    if session_token:
        secrets['AWS_SESSION_TOKEN'] = session_token
    
    print("✅ AWS Credentials configured\n")
    
    # Step 2: SSH Private Key
    print("🔐 STEP 2: SSH Private Key")
    print("-" * 60)
    print("This is your EC2 key pair file (.pem or .key)")
    print()
    
    ssh_key_path = input("Enter path to SSH private key file: ").strip()
    ssh_key_path = os.path.expanduser(ssh_key_path)
    
    if not os.path.exists(ssh_key_path):
        print(f"❌ Error: File not found: {ssh_key_path}")
        sys.exit(1)
    
    ssh_key_b64 = encode_file_to_base64(ssh_key_path)
    secrets['SSH_PRIVATE_KEY'] = ssh_key_b64
    
    print(f"✅ SSH key encoded ({len(ssh_key_b64)} characters)\n")
    
    # Step 3: Summary
    print("="*60)
    print("📌 SECRETS SUMMARY")
    print("="*60 + "\n")
    
    print("Copy and paste these into GitHub Secrets:")
    print("(Settings → Secrets and variables → Actions → New repository secret)\n")
    
    for key, value in secrets.items():
        if key == 'SSH_PRIVATE_KEY':
            print(f"\n🔑 {key}")
            print("-" * 60)
            print(f"Value: {value[:50]}...{value[-20:]}")
            print(f"Length: {len(value)} characters")
        elif key == 'AWS_SECRET_ACCESS_KEY':
            print(f"\n🔑 {key}")
            print("-" * 60)
            print(f"Value: {value[:15]}...{value[-10:]}")
        else:
            print(f"\n🔑 {key}")
            print("-" * 60)
            print(f"Value: {value}")
    
    # Step 4: Save to file
    print("\n" + "="*60)
    save_to_file = input("\n💾 Save secrets to file? (y/n): ").strip().lower()
    
    if save_to_file == 'y':
        output_file = "github-secrets.json"
        try:
            with open(output_file, 'w') as f:
                json.dump(secrets, f, indent=2)
            print(f"✅ Secrets saved to {output_file}")
            print(f"⚠️  IMPORTANT: Add this to .gitignore and never commit to GitHub!")
            
            # Add to .gitignore
            gitignore_path = Path(".gitignore")
            if gitignore_path.exists():
                with open(gitignore_path, 'a') as f:
                    if "github-secrets.json" not in gitignore_path.read_text():
                        f.write("\ngithub-secrets.json\n")
                print("✅ Added to .gitignore")
        except Exception as e:
            print(f"❌ Error saving file: {e}")
    
    # Step 5: Instructions
    print("\n" + "="*60)
    print("📖 NEXT STEPS")
    print("="*60 + "\n")
    
    print("1. Go to your GitHub repository")
    print("2. Click Settings → Secrets and variables → Actions")
    print("3. For each secret above, click 'New repository secret'")
    print("4. Copy the secret name and value")
    print("5. Save\n")
    print("6. Your workflow will automatically detect IPs and deploy!")
    print("\n✅ Setup complete!\n")


def list_required_iam_permissions():
    """Display required IAM permissions"""
    
    print("\n" + "="*60)
    print("🔐 REQUIRED IAM PERMISSIONS")
    print("="*60 + "\n")
    
    permissions = [
        "ec2:DescribeInstances",
        "ec2:DescribeTags",
        "ec2:DescribeInstanceStatus",
    ]
    
    print("Your AWS IAM user needs at least these permissions:\n")
    
    for perm in permissions:
        print(f"  • {perm}")
    
    print("\n📋 Example IAM Policy JSON:\n")
    
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeTags",
                    "ec2:DescribeInstanceStatus"
                ],
                "Resource": "*"
            }
        ]
    }
    
    print(json.dumps(policy, indent=2))
    print("\n")


if __name__ == "__main__":
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "--permissions":
            list_required_iam_permissions()
        else:
            prepare_github_secrets()
    except KeyboardInterrupt:
        print("\n\n⚠️  Cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
