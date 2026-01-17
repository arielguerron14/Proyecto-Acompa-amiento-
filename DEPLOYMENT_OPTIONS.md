# 🚀 DEPLOYMENT GUIDE - Update Instances

## Current Status

✅ **All changes are pushed to GitHub**
- Latest commit: `4cfb3c9` 
- Branch: `main`
- Remote: Updated ✓

## 📊 What Was Updated

1. **IP Management System** ✅
   - config/instance_ips.json (source of truth)
   - .env.generated (auto-generated)
   - .env.prod.frontend (auto-generated)
   - docker-compose.frontend.yml (auto-generated)

2. **Configuration Files** ✅
   - Paramiko SSH in all 10 workflows
   - EC2_SSH_KEY secret support
   - Port configuration (frontend: 5500)

3. **API Gateway IP** ✅
   - Updated: 35.168.216.132
   - All files synchronized

## 🔄 Deployment Options

### Option 1: Trigger All Workflows (Manual)

#### Using GitHub CLI:
```bash
# Install: https://cli.github.com/

# Trigger update-ips workflow (recommended first)
gh workflow run "update-ips.yml" --repo arielguerron14/Proyecto-Acompa-amiento-

# Then trigger deploy workflows
gh workflow run "deploy-ec2-api-gateway.yml" --repo arielguerron14/Proyecto-Acompa-amiento-
gh workflow run "deploy-ec2-frontend.yml" --repo arielguerron14/Proyecto-Acompa-amiento-
gh workflow run "deploy-ec2-core.yml" --repo arielguerron14/Proyecto-Acompa-amiento-
# ... etc
```

#### Using trigger-deployments.py (Local):
```bash
# Trigger all workflows at once
python trigger-deployments.py

# Or trigger specific workflow
python trigger-deployments.py "deploy-ec2-frontend.yml"
```

### Option 2: Trigger via GitHub UI

1. Go to: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions
2. Select a workflow (e.g., "deploy-ec2-frontend.yml")
3. Click "Run workflow" (dropdown on right)
4. Select branch: `main`
5. Click "Run workflow" button

### Option 3: Manual Deployment (SSH)

```bash
# SSH into instance
ssh -i ~/.ssh/labsuser.pem ubuntu@35.168.216.132

# Inside instance, pull latest changes
cd Proyecto-Acompa-amiento-/
git pull origin main

# Restart services
docker-compose down
docker-compose pull
docker-compose up -d
```

## 🎯 Recommended Deployment Order

```
1️⃣  update-ips.yml              → Fetch latest IPs from AWS
2️⃣  deploy-ec2-core.yml         → Deploy core services (dependencies)
3️⃣  deploy-ec2-db.yml           → Deploy database
4️⃣  deploy-ec2-api-gateway.yml  → Deploy API Gateway
5️⃣  deploy-ec2-frontend.yml     → Deploy Frontend
6️⃣  deploy-ec2-messaging.yml    → Deploy Messaging
7️⃣  deploy-ec2-monitoring.yml   → Deploy Monitoring
8️⃣  deploy-ec2-notificaciones.yml → Deploy Notifications
9️⃣  deploy-ec2-reportes.yml     → Deploy Reports
🔟 deploy-ec2-analytics.yml     → Deploy Analytics
```

## 📍 Instance IPs (From config/instance_ips.json)

| Instance | Public IP | Private IP |
|----------|-----------|-----------|
| EC2-API-Gateway | 35.168.216.132 | 172.31.64.195 |
| EC2-Frontend | 3.231.12.130 | 172.31.77.249 |
| EC2-CORE | 44.197.251.135 | 172.31.65.0 |
| EC2-DB | 3.235.242.53 | 172.31.65.122 |
| EC2-Messaging | 44.201.68.131 | 172.31.68.53 |
| EC2-Notificaciones | 13.222.108.162 | 172.31.78.38 |
| EC2-Monitoring | 100.29.147.5 | 172.31.73.216 |
| EC2-Reportes | 44.206.88.188 | 172.31.77.76 |
| EC-Bastion | 54.91.218.98 | 172.31.75.78 |

## ✅ Verification After Deployment

### Check Frontend
```bash
curl http://3.231.12.130:5500
# Expected: HTML response from frontend
```

### Check API Gateway
```bash
curl http://35.168.216.132:8080/health
# Expected: { status: "ok" }
```

### Check Core Services
```bash
ssh -i ~/.ssh/labsuser.pem ubuntu@44.197.251.135
docker ps
docker logs <container-name>
```

## 🔐 Prerequisites

### Required GitHub Secrets:
- ✅ `EC2_SSH_KEY` - Plaintext SSH private key (set this!)
- ✅ `DOCKER_USERNAME` - Docker Hub username
- ✅ `DOCKER_TOKEN` - Docker Hub token
- ✅ `AWS_ACCESS_KEY_ID` - AWS credentials (for update-ips.yml)
- ✅ `AWS_SECRET_ACCESS_KEY` - AWS credentials (for update-ips.yml)
- ✅ `AWS_SESSION_TOKEN` - AWS session token (optional)

### To Set a Secret:
1. Go to: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions
2. Click "New repository secret"
3. Name: e.g., `EC2_SSH_KEY`
4. Value: Paste the secret
5. Click "Add secret"

## 📊 Monitor Deployments

### Via GitHub UI:
https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions

### Via GitHub CLI:
```bash
# List recent workflow runs
gh run list --repo arielguerron14/Proyecto-Acompa-amiento- --limit 10

# View specific workflow
gh workflow view "deploy-ec2-frontend.yml" --repo arielguerron14/Proyecto-Acompa-amiento-

# Watch a run
gh run watch <run-id> --repo arielguerron14/Proyecto-Acompa-imiento-
```

## 🆘 Troubleshooting

### If workflows fail:
1. Check GitHub Actions logs: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions
2. Verify all required secrets are set
3. Check EC2_SSH_KEY format (plaintext, not base64)
4. Ensure DOCKER credentials are valid

### If deployment is slow:
- Check AWS instance status
- Verify instance has internet connectivity
- Check Docker Hub rate limits

### If instances are unreachable:
- Verify IPs in config/instance_ips.json match current AWS IPs
- Run: `python sync-ips-to-config.py` to update configs
- Check security groups allow traffic

---

**Next Step**: Choose a deployment option above and execute!
