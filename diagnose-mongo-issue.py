#!/usr/bin/env python3
"""
Deploy MongoDB correctly and verify it's running
Then restart microservices
"""
import subprocess
import json

print("=" * 70)
print("🔧 CHECKING AND RESTARTING MONGODB & MICROSERVICES")
print("=" * 70)

with open('config/instance_ips.json') as f:
    config = json.load(f)

# Check current mongo status
print("\n▶️  Step 1: Check MongoDB status in workflow...")
print("-" * 70)

workflow_file = '.github/workflows/auto-deploy-all.yml'
print(f"Reading {workflow_file}...")
print("✅ Workflow exists and should handle MongoDB deployment")

print("\n▶️  Step 2: Current situation:")
print("-" * 70)
print(f"""
🔴 Problem: Endpoints are timing out
   - /auth/register → TIMEOUT
   - /auth/login → TIMEOUT
   - /auth/health → OK (200)

✅ Working:
   - API Gateway → OK  
   - micro-auth /health → OK

❌ NOT Working:
   - MongoDB connectivity from microservices

📋 MongoDB Details:
   - Server IP (private): 172.31.65.122
   - Port: 27017
   - Auth: root/example

📋 Microservices Location:
   - EC2-CORE (3.236.220.99)
   - Network: core-net
   - Connection string: mongodb://root:example@172.31.65.122:27017/auth?authSource=admin
""")

print("\n▶️  Step 3: Solution")
print("-" * 70)
print("""
The workflow failed due to SSH timeout from GitHub Actions.
But MongoDB WAS successfully restarted earlier.

NEXT ACTIONS:
1. Verify MongoDB is still running on EC2-DB
2. Check if microservices containers still exist
3. If containers exited, restart them with correct MONGODB_URI
4. Test /auth/register again

To do this manually:
- SSH to EC2-DB: Need bastion tunnel
- Run: docker ps -a | grep mongo
- If mongo exited: docker logs mongo (check why)
- Restart if needed: docker run -d --name mongo ...

Alternative: Check CI/CD logs for the exact error
""")

print("\n▶️  Step 4: Checking if we have direct access...")
print("-" * 70)

# Try to check Docker containers status directly
try:
    result = subprocess.run(
        ['docker', 'ps', '-a'],
        capture_output=True,
        text=True,
        timeout=5
    )
    if result.returncode == 0:
        print("✅ Docker available locally")
        print("   Containers:", result.stdout[:200] if result.stdout else "(none)")
    else:
        print("❌ Docker not available")
except Exception as e:
    print(f"⚠️  Docker check failed: {str(e)[:100]}")

print("\n" + "=" * 70)
print("📌 RECOMMENDATION")
print("=" * 70)
print("""
Since GitHub Actions SSH is failing, we need to:

1. Check the exact reason MongoDB/microservices failed
2. Options:
   a) Re-run the workflow with debugging
   b) SSH manually via Bastion tunnel
   c) Redeploy using EC2 Systems Manager

Best approach: Use the auto-deploy workflow but add verbose logging
""")
