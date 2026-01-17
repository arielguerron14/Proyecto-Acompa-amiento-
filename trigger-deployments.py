#!/usr/bin/env python3
"""
Trigger GitHub Actions workflows to update instances
Usage: python3 trigger-deployments.py [workflow_name]
"""

import subprocess
import sys
import json
from pathlib import Path

# Configuration
REPO = "arielguerron14/Proyecto-Acompa-amiento-"
WORKFLOWS = [
    "update-ips.yml",                  # Update IPs from AWS
    "deploy-ec2-api-gateway.yml",      # Deploy API Gateway
    "deploy-ec2-frontend.yml",         # Deploy Frontend
    "deploy-ec2-core.yml",             # Deploy Core services
    "deploy-ec2-db.yml",               # Deploy Database
    "deploy-ec2-messaging.yml",        # Deploy Messaging
    "deploy-ec2-monitoring.yml",       # Deploy Monitoring
    "deploy-ec2-notificaciones.yml",   # Deploy Notifications
    "deploy-ec2-reportes.yml",         # Deploy Reports
    "deploy-ec2-analytics.yml",        # Deploy Analytics
    "deploy-ec2-bastion.yml",          # Deploy Bastion
]

def run_command(cmd, description):
    """Run a shell command and return the result"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, check=True)
        print(f"✅ {description}")
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return None

def trigger_workflow(workflow_name):
    """Trigger a GitHub Actions workflow"""
    cmd = f'gh workflow run "{workflow_name}" --repo {REPO}'
    result = run_command(cmd, f"Triggering {workflow_name}")
    return result is not None

def get_workflow_status(workflow_name):
    """Get the status of a workflow"""
    cmd = f'gh workflow view "{workflow_name}" --repo {REPO} --json status'
    result = run_command(cmd, f"Checking {workflow_name}")
    if result:
        try:
            data = json.loads(result)
            return data.get('status', 'unknown')
        except:
            return 'unknown'
    return None

def main():
    print("🚀 GitHub Actions Workflow Trigger")
    print(f"📦 Repository: {REPO}")
    
    # Check if gh CLI is available
    try:
        subprocess.run(['gh', '--version'], capture_output=True, check=True)
    except:
        print("❌ GitHub CLI (gh) is not installed or not in PATH")
        print("   Install it from: https://cli.github.com/")
        return 1
    
    # Determine which workflows to trigger
    workflows_to_trigger = WORKFLOWS
    if len(sys.argv) > 1:
        workflows_to_trigger = [sys.argv[1]]
    
    print(f"\n📋 Workflows to trigger:")
    for workflow in workflows_to_trigger:
        print(f"   • {workflow}")
    
    # Trigger workflows
    print("\n🔄 Triggering workflows...\n")
    triggered = 0
    failed = 0
    
    for workflow in workflows_to_trigger:
        if trigger_workflow(workflow):
            triggered += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"✅ Triggered: {triggered} workflow(s)")
    if failed > 0:
        print(f"❌ Failed: {failed} workflow(s)")
    
    print(f"\n📊 Monitor progress at:")
    print(f"   https://github.com/{REPO}/actions")
    print(f"\n💡 Tip: Use 'gh workflow view <workflow-name> --repo {REPO}' to check status")
    
    return 0 if failed == 0 else 1

if __name__ == '__main__':
    exit(main())
