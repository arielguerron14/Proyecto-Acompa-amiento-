# 🚨 CRITICAL: API Gateway 503 Error - Root Cause & Fix

## Problem Summary
The frontend is receiving **503 (Service Unavailable)** errors when trying to register users:
```
POST http://98.92.84.126/api/auth/register 503 (Service Unavailable)
Error: API Gateway unavailable
```

## Root Cause Analysis

### Issue 1: EC2-Core Public IP Missing
The `deploy-all.yml` workflow tries to SSH to **13.221.55.216** which is a **PRIVATE IP**. This cannot work:
- GitHub Actions runners are on the public internet
- Private IPs (172.31.x.x, 10.x.x.x, 192.168.x.x) are only routable within AWS VPC
- The SSH connection fails, so EC2-Core microservices never deploy

**Current Workflow State:**
```yaml
- name: Deploy to EC2-Core (13.221.55.216)
  ssh -i ~/.ssh/key.pem -o ConnectTimeout=10 ubuntu@13.221.55.216  ❌ WRONG
```

### Issue 2: API Gateway Wrong Service URLs
The API Gateway is configured to reach microservices at:
```yaml
-e AUTH_SERVICE=http://13.221.55.216:3000
-e MAESTROS_SERVICE=http://13.221.55.216:3002
-e ESTUDIANTES_SERVICE=http://13.221.55.216:3001
```

But:
1. If EC2-Core didn't deploy (because SSH failed), these services don't exist
2. Even if they did, 13.221.55.216 is a private IP - the API Gateway container cannot reach it from EC2-API-Gateway

### Current Deployment Status

| Instance | Name | Public IP | Private IP | Microservices | Status |
|----------|------|-----------|-----------|----------------|--------|
| 1 | EC2-DB | 44.222.116.0 | 172.31.79.193 | ✅ mongo, postgres, redis | ✅ DEPLOYED |
| 2 | **EC2-Core** | **???** | **13.221.55.216** | ❌ micro-auth, micro-estudiantes, micro-maestros | ❌ NOT DEPLOYED |
| 3 | EC2-API-Gateway | 98.84.30.35 | ? | ❌ api-gateway (trying to reach missing services) | ⚠️ DEPLOYED BUT BROKEN |
| 4 | EC2-Frontend | 98.92.84.126 | ? | ✅ frontend | ✅ DEPLOYED |
| 5 | EC2-Notificaciones | 100.28.124.73 | ? | ? | ? |
| 6 | EC2-Messaging | 34.231.247.116 | ? | ? | ? |
| 7 | EC2-Reportes | 3.239.86.68 | ? | ? | ? |
| 8 | EC2-Monitoring | 35.171.146.166 | ? | ? | ? |

## Solution Required

### Step 1: Find EC2-Core's Public IP

**Option A: AWS Console**
1. Go to EC2 → Instances
2. Find the instance with private IP `13.221.55.216`
3. Note the **Public IP** (should look like `XX.XXX.XXX.XXX` e.g., `54.123.45.67`)

**Option B: AWS CLI**
```bash
aws ec2 describe-instances \
  --filters "Name=private-ip-address,Values=13.221.55.216" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

### Step 2: Update Workflow with Correct Public IP

Once you have EC2-Core's public IP (let's call it `EC2_CORE_PUBLIC_IP`):

**File:** `.github/workflows/deploy-all.yml`

**Change 1: Update SSH target (Line ~55)**
```yaml
# OLD:
ssh -i ~/.ssh/key.pem -o ConnectTimeout=10 ubuntu@13.221.55.216 << 'DEPLOY'

# NEW:
ssh -i ~/.ssh/key.pem -o ConnectTimeout=10 ubuntu@EC2_CORE_PUBLIC_IP << 'DEPLOY'
```

**Change 2: Update API Gateway service URLs (Line ~100)**
```yaml
# OLD:
docker run -d --name api-gateway --restart unless-stopped -p 8080:8080 \
  -e AUTH_SERVICE=http://13.221.55.216:3000 \
  -e MAESTROS_SERVICE=http://13.221.55.216:3002 \
  -e ESTUDIANTES_SERVICE=http://13.221.55.216:3001 \
  api-gateway:latest

# NEW:
docker run -d --name api-gateway --restart unless-stopped -p 8080:8080 \
  -e AUTH_SERVICE=http://EC2_CORE_PUBLIC_IP:3000 \
  -e MAESTROS_SERVICE=http://EC2_CORE_PUBLIC_IP:3002 \
  -e ESTUDIANTES_SERVICE=http://EC2_CORE_PUBLIC_IP:3001 \
  api-gateway:latest
```

### Step 3: Re-run Deploy Workflow

1. Get EC2-Core's public IP from AWS Console or CLI
2. Update `.github/workflows/deploy-all.yml` with this IP (replace `EC2_CORE_PUBLIC_IP`)
3. Commit and push the changes
4. Go to GitHub Actions → "Deploy All Services (Hardcoded IPs)"
5. Click "Run workflow"
6. Wait for all 8 deployment steps to complete

### Step 4: Test the Fix

After workflow completes successfully:

```bash
# Test frontend access
curl http://98.92.84.126

# Test API Gateway health
curl http://98.84.30.35:8080/health

# Test user registration (should not get 503)
curl -X POST http://98.84.30.35:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@example.com","password":"123456","rol":"Estudiante"}'
```

## Expected Flow After Fix

```
Frontend (98.92.84.126)
        ↓
        → API Gateway (98.84.30.35:8080)
          ├→ AUTH_SERVICE (EC2_CORE_PUBLIC_IP:3000)
          ├→ MAESTROS_SERVICE (EC2_CORE_PUBLIC_IP:3002)
          └→ ESTUDIANTES_SERVICE (EC2_CORE_PUBLIC_IP:3001)
             ↓
             → Database (44.222.116.0 mongo/postgres/redis)
```

## Verification Checklist

After deployment, verify:
- [ ] GitHub Actions workflow runs without errors
- [ ] EC2-Core SSH deployment succeeds (not skipped)
- [ ] All 8 services show "✅ DEPLOYED" status
- [ ] `curl http://98.84.30.35:8080/health` returns 200 OK
- [ ] Frontend loads without errors (http://98.92.84.126)
- [ ] User registration form appears
- [ ] Submitting registration doesn't show 503 error
- [ ] Request goes through to database (check Postgres/Mongo)

## Additional Notes

- **Security Group Issue?**: If after fixing the IP you still get connection refused, check AWS Security Groups. EC2-Core needs inbound rules for ports 3000, 3001, 3002 from EC2-API-Gateway
- **Container Issue?**: If services don't start, SSH to EC2-Core and run:
  ```bash
  docker ps                    # Check if containers running
  docker logs micro-auth       # Check logs for errors
  ```
- **Permanent Solution**: Consider using AWS Systems Manager Session Manager or VPC peering instead of public IPs for production

---

**Status**: 🚨 **CRITICAL - BLOCKS ENTIRE SYSTEM**  
**Effort**: ⭐ **QUICK FIX** (5-10 minutes once you have the public IP)
