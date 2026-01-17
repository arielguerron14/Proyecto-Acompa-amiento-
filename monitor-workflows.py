#!/usr/bin/env python3
"""
Monitor both workflows until completion
"""
import subprocess
import time
import sys

def get_workflow_status(workflow_name):
    """Get the status of a workflow"""
    result = subprocess.run(
        ["gh", "run", "list", f"--workflow={workflow_name}", "--limit", "1"],
        capture_output=True,
        text=True
    )
    
    lines = result.stdout.strip().split('\n')
    if len(lines) >= 2:
        status_line = lines[1]
        parts = status_line.split()
        status = parts[0] if parts else "?"
        return status
    return "?"

workflows = [
    "deploy-ec2-core.yml",
    "deploy-ec2-api-gateway.yml"
]

print("🚀 Monitoring Workflow Deployments")
print("=" * 60)
print("Status symbols:")
print("  * = In progress")
print("  ✓ = Completed successfully")
print("  X = Failed")
print("=" * 60)
print()

# Monitor for up to 15 minutes
start_time = time.time()
timeout = 900  # 15 minutes

while time.time() - start_time < timeout:
    all_done = True
    
    for workflow in workflows:
        status = get_workflow_status(workflow)
        status_icon = {
            "*": "🔄 In Progress",
            "✓": "✅ Success",
            "X": "❌ Failed",
            "?": "❓ Unknown"
        }.get(status, f"? {status}")
        
        print(f"{workflow:30} {status_icon}")
        
        if status == "*":
            all_done = False
    
    print()
    
    if all_done:
        print("=" * 60)
        print("✅ All workflows completed!")
        print("=" * 60)
        break
    
    time.sleep(10)  # Check every 10 seconds
else:
    print("⏱️  Timeout: Workflow monitoring exceeded 15 minutes")
    sys.exit(1)
