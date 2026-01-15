#!/usr/bin/env bash
# Quick verification script for deployment setup

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "                    ✅ DEPLOYMENT SETUP VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Check 1: GitHub Secrets
echo "1️⃣  Checking GitHub Secrets..."
echo "   Run this in your GitHub repo:"
echo "   → Go to Settings → Secrets and variables → Actions"
echo "   → Verify these exist:"
echo "      ✓ AWS_ACCESS_KEY_ID"
echo "      ✓ AWS_SECRET_ACCESS_KEY"
echo "      ✓ SSH_PRIVATE_KEY"
echo "      ✓ AWS_SESSION_TOKEN (optional)"
echo ""

# Check 2: EC2 Tags
echo "2️⃣  Checking EC2 Tags..."
echo "   Expected tags in AWS Console:"
echo "      ✓ Name: EC2-CORE"
echo "      ✓ Name: EC2-API-GATEWAY"
echo "      ✓ Name: EC2-DB (if exists)"
echo "      ✓ Name: EC2-FRONTEND (if exists)"
echo ""

# Check 3: AWS CLI
echo "3️⃣  Checking AWS CLI availability..."
if command -v aws &> /dev/null; then
    echo "      ✅ AWS CLI installed"
    echo ""
    echo "   Query instances:"
    echo "   $ aws ec2 describe-instances --region us-east-1 \\"
    echo "     --query 'Reservations[].Instances[].{Name:Tags[?Key==\`Name\`].Value|[0],PublicIP:PublicIpAddress,PrivateIP:PrivateIpAddress}'"
else
    echo "      ❌ AWS CLI not found"
    echo "      Run: pip install awscli"
fi
echo ""

# Check 4: Python
echo "4️⃣  Checking Python availability..."
if command -v python3 &> /dev/null; then
    echo "      ✅ Python 3 installed"
    echo "      Run: python3 setup-github-secrets.py"
else
    echo "      ❌ Python 3 not found"
fi
echo ""

# Check 5: SSH Key
echo "5️⃣  Checking SSH Key..."
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    echo "      ✅ SSH key found"
else
    echo "      ⚠️  No SSH key found at ~/.ssh/id_rsa or ~/.ssh/id_ed25519"
    echo "      You need your EC2 key.pem in GitHub Secrets"
fi
echo ""

# Check 6: Documentation
echo "6️⃣  Documentation files:"
files=("QUICK_START.md" "WORKFLOW_SETUP.md" "IP_ROUTING_STRATEGY.md" "DEPLOYMENT_ARCHITECTURE.md" "EXECUTIVE_SUMMARY.md" "setup-github-secrets.py")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "      ✅ $file"
    else
        echo "      ❌ $file (missing)"
    fi
done
echo ""

# Check 7: Workflow
echo "7️⃣  GitHub Workflow:"
if [ -f ".github/workflows/deploy.yml" ]; then
    echo "      ✅ Workflow file exists"
    echo "      Check: .github/workflows/deploy.yml"
else
    echo "      ❌ Workflow file missing"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "                           NEXT STEPS"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "1. Run setup script:"
echo "   $ python3 setup-github-secrets.py"
echo ""
echo "2. Add secrets to GitHub"
echo ""
echo "3. Tag your EC2 instances in AWS Console"
echo ""
echo "4. Execute workflow in GitHub Actions"
echo ""
echo "👉 For detailed instructions, open QUICK_START.md"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
