# 🚀 QUICK FIX GUIDE - MongoDB Connectivity Issue

## Problem Summary
- ✅ API Gateway running and healthy
- ✅ Microservices running and health endpoints responding
- ❌ /auth/register and /auth/login endpoints TIMEOUT
- 🔴 **Root Cause**: MongoDB not accessible from microservices OR MongoDB not running

## Solution: Two Options

### Option 1: Manual Fix via AWS Console (FASTEST) ⚡

1. Open AWS Console: https://console.aws.amazon.com/ec2
2. Go to Instances → Select **EC2-DB** (i-044d5e68b427462d2)
3. Click **Connect** → **EC2 Instance Connect** (browser terminal)
4. Paste and run this command:

```bash
# Fix MongoDB on EC2-DB
docker stop mongo 2>/dev/null || true
docker rm mongo 2>/dev/null || true
docker volume create mongo_data 2>/dev/null || true

docker run -d --name mongo \
  -p 0.0.0.0:27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  -v mongo_data:/data/db \
  mongo:6.0 \
  --auth --bind_ip_all

echo "⏳ Waiting for MongoDB..."
sleep 10
docker ps -a -f name=mongo
```

5. Then SSH to **EC2-CORE** (3.236.220.99) and paste:

```bash
# Fix Microservices on EC2-CORE
docker network create core-net 2>/dev/null || true

docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

docker run -d --name micro-auth --network core-net -p 3000:3000 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/auth?authSource=admin' \
  -e PORT=3000 -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-auth:latest

docker run -d --name micro-estudiantes --network core-net -p 3001:3001 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/estudiantes?authSource=admin' \
  -e PORT=3001 -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-estudiantes:latest

docker run -d --name micro-maestros --network core-net -p 3002:3002 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/maestros?authSource=admin' \
  -e PORT=3002 -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-maestros:latest

echo "⏳ Waiting..."
sleep 10
docker ps -a -f name=micro
```

### Option 2: Automated Fix via GitHub Actions Workflow

1. Push changes to git:
```bash
git add manual-fix.sh
git commit -m "Add manual infrastructure fix script"
git push origin main
```

2. Go to GitHub Actions
3. Select workflow: **Deploy All Services v2 (Auto-Fix)**
4. Click **Run workflow**
5. Wait ~10 minutes for all phases to complete

## Verification ✅

After running the fix, test in 3 ways:

### Test 1: API Endpoints
```bash
# Health checks (should be instant)
curl http://35.168.216.132:8080/health
curl http://35.168.216.132:8080/auth/health

# Register endpoint (should NOT timeout)
curl -X POST http://35.168.216.132:8080/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"test-'$(date +%s)'@example.com",
    "password":"Test123!",
    "name":"Test"
  }'

# Expected response (201 Created):
# {"success":true,"user":{"userId":"...","email":"test@...","name":"Test","role":"student"}}
```

### Test 2: Browser Frontend Login
```
1. Open: http://3.231.12.130:5500
2. Try to register new user
3. Try to login
4. If successful: project is FIXED! ✅
```

### Test 3: Check Logs (if tests fail)
```bash
# SSH to EC2-DB
ssh -i your-key.pem ubuntu@44.192.33.182
docker logs mongo | tail -20

# SSH to EC2-CORE  
ssh -i your-key.pem ubuntu@3.236.220.99
docker logs micro-auth | tail -30
```

## What Each Fix Does

### MongoDB Fix
- ✅ Stops any existing MongoDB container
- ✅ Removes MongoDB container
- ✅ Creates fresh `mongo_data` volume
- ✅ Starts new MongoDB with:
  - Root credentials: root/example
  - Ports: 27017 on all interfaces (0.0.0.0:27017:27017)
  - Auth enabled (--auth)
  - Bind all IPs (--bind_ip_all)

### Microservices Fix
- ✅ Creates `core-net` Docker network
- ✅ Stops old microservices
- ✅ Starts new microservices with:
  - Explicit MONGODB_URI pointing to private IP (172.31.65.122)
  - HOST environment variable set
  - Port mappings (3000, 3001, 3002)
  - add-host for DNS resolution

## Expected After Fix

| Endpoint | Before | After |
|----------|--------|-------|
| GET /health | ✅ 200 OK | ✅ 200 OK |
| GET /auth/health | ✅ 200 OK | ✅ 200 OK |
| POST /auth/register | ❌ TIMEOUT | ✅ 201 Created |
| POST /auth/login | ❌ TIMEOUT | ✅ 200 OK + JWT |
| Frontend Login | ❌ Hangs | ✅ Works |

## Troubleshooting If Still Not Working

### MongoDB not starting
```bash
docker logs mongo  # Check error logs
docker inspect mongo  # Check container config
```

### Microservices can't reach MongoDB
```bash
docker logs micro-auth  # Look for MongoDB connection errors
docker exec micro-auth cat /proc/net/tcp  # Check open connections
```

### Network connectivity issues
```bash
docker network inspect core-net  # Check network
docker exec micro-auth ping 172.31.65.122  # Test network ping
```

## Files Modified

- ✅ `manual-fix.sh` - Bash commands to run manually
- ✅ `.github/workflows/deploy-v2-auto-fix.yml` - Automated workflow
- ✅ `config/instance_ips.json` - Infrastructure IPs (already updated)

## Success Indicators

🎉 **You're done when:**
- [x] POST /auth/register returns 201 Created (not timeout)
- [x] POST /auth/login returns 200 with JWT token
- [x] Frontend at http://3.231.12.130:5500 allows login
- [x] No timeout errors in browser console

Then you can test the full application! 🚀
