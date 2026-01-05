# 🔧 MICROSERVICES API ERROR TROUBLESHOOTING

## Current Issues

Frontend is getting errors when trying to access:
- `/api/estudiantes/reservas/estudiante/{id}` → **500/503 errors**
- `/api/horarios` → **500/503 errors**
- `/api/reportes/...` → **503 errors**

## Root Cause Analysis

The API Gateway is configured correctly and routes exist, but microservices are returning errors. This indicates:

1. **Option A**: Microservices aren't running
2. **Option B**: Database connections are failing
3. **Option C**: Environment variables aren't set
4. **Option D**: Microservices are crashing on startup

## 🔍 Diagnostic Workflow

I've created a **"Diagnose System Status"** workflow that will check everything.

### To Run Diagnostics:

1. **Go to GitHub Actions**
2. **Find workflow**: "Diagnose System Status"
3. **Click**: "Run workflow"
4. **Wait**: 5-10 minutes for completion
5. **Review output** for errors and issues

### What the Diagnostic Will Check:

✅ Microservices container status (running/stopped)
✅ Microservices logs for error messages
✅ Database container status
✅ API Gateway status and logs
✅ Frontend status and logs
✅ Network connectivity between services
✅ Health check endpoints

---

## 📋 Manual Troubleshooting (Without Workflow)

### Step 1: Check if Microservices Are Running

```bash
# SSH to microservices server
ssh -i your-key.pem ubuntu@100.24.118.233

# Check running containers
docker ps -a | grep micro

# Expected output should show:
# micro-auth (port 3000)
# micro-estudiantes (port 3001)
# micro-maestros (port 3002)
```

### Step 2: Check Microservice Logs

```bash
# Auth service logs
docker logs micro-auth -f

# Estudiantes service logs
docker logs micro-estudiantes -f

# Maestros service logs
docker logs micro-maestros -f

# Look for:
# ✓ "listening on port 3000/3001/3002"
# ✗ "Error connecting to database"
# ✗ "Cannot find module"
# ✗ "Connection refused"
```

### Step 3: Test Health Endpoints Directly

```bash
# From gateway or anywhere with network access
curl http://100.24.118.233:3000/health
curl http://100.24.118.233:3001/health
curl http://100.24.118.233:3002/health

# Should all return HTTP 200 with status OK
```

### Step 4: Check Database Connectivity

```bash
# SSH to database server
ssh -i your-key.pem ubuntu@98.84.26.109

# Check database containers
docker ps -a | grep -E "mongodb|postgres|redis"

# Check logs
docker logs mongodb
docker logs postgres
docker logs redis

# Test connectivity from microservices server
ssh -i your-key.pem ubuntu@100.24.118.233

# Test MongoDB
curl -v telnet://98.84.26.109:27017

# Test PostgreSQL  
curl -v telnet://98.84.26.109:5432

# Test Redis
curl -v telnet://98.84.26.109:6379
```

### Step 5: Restart All Microservices

If all containers are running but still getting errors:

```bash
# SSH to microservices server
ssh -i your-key.pem ubuntu@100.24.118.233

# Stop all microservices
docker stop micro-auth micro-estudiantes micro-maestros

# Remove containers
docker rm micro-auth micro-estudiantes micro-maestros

# Run final-fix.yml workflow to redeploy
# Or manually redeploy with docker run commands
```

---

## 🎯 Common Issues & Solutions

### Issue 1: "Service Unavailable" (503)
**Cause**: Microservice isn't running or API Gateway can't reach it

**Solution**:
1. Check if container is running: `docker ps | grep micro-`
2. Check if listening on correct port: `docker logs micro-xxx`
3. Restart container if stopped
4. Check network connectivity

### Issue 2: "Internal Server Error" (500)
**Cause**: Microservice is running but having issues (database, logic error)

**Solution**:
1. Check microservice logs: `docker logs micro-xxx -f`
2. Look for database connection errors
3. Check environment variables: `docker inspect micro-xxx`
4. Verify database is running and accessible

### Issue 3: Database Connection Errors
**Cause**: Database not running or microservice can't connect

**Solution**:
1. Check database containers: `docker ps | grep -E "mongodb|postgres"`
2. Check database logs: `docker logs mongodb`
3. Verify credentials in environment variables
4. Test network connectivity between services

### Issue 4: Module Not Found Errors
**Cause**: Dependency missing in microservice image

**Solution**:
1. Rebuild microservice image
2. Ensure all dependencies are in package.json
3. Run `npm install` in build process

---

## 🚀 Quick Redeploy (If Issues Found)

### Option 1: Use GitHub Workflows
1. Go to Actions
2. Run "final-fix.yml" workflow to redeploy everything
3. Wait 10-15 minutes

### Option 2: Manual SSH Commands

```bash
# SSH to microservices server
ssh -i your-key.pem ubuntu@100.24.118.233

# Stop old containers
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

# Get latest code
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

# Build images
docker build -t micro-auth:latest -f micro-auth/Dockerfile ./micro-auth
docker build -t micro-estudiantes:latest -f micro-estudiantes/Dockerfile ./micro-estudiantes
docker build -t micro-maestros:latest -f micro-maestros/Dockerfile ./micro-maestros

# Start with correct environment variables
docker run -d --name micro-auth --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=98.84.26.109 \
  -e DB_USER=root \
  -e DB_PASS=password \
  -e MONGO_URI=mongodb://98.84.26.109:27017/authdb \
  micro-auth:latest

# Similar for micro-estudiantes and micro-maestros with their respective ports (3001, 3002)

# Check if running
docker ps | grep micro-
```

---

## 📊 Expected Output After Fix

### Health Checks Should Return:
```json
{
  "status": "OK",
  "message": "Service is running",
  "timestamp": "2026-01-05T..."
}
```

### Frontend Should Load:
- ✅ Dashboard without errors
- ✅ Reservation list loads
- ✅ Available horarios display
- ✅ Reports load correctly

### Browser Console Should Show:
```
[API Config] Using frontend server proxy: /api
[API Config] API Base URL: /api
(no 500/503 errors)
```

---

## 📞 Next Steps

1. **Run "Diagnose System Status" workflow**
2. **Review the diagnostic output** for error messages
3. **Identify the issue** from the errors shown
4. **Apply appropriate fix** from this guide
5. **Retest** the frontend

---

## 🔗 Request Flow (For Reference)

```
Browser (44.210.241.99)
   ↓ GET /api/horarios
Frontend Server (44.210.241.99:80)
   ↓ Proxies to API_GATEWAY_URL
API Gateway (100.49.159.65:8080)
   ↓ Routes /horarios to maestros service
Maestros Service (100.24.118.233:3002)
   ↓ Queries database
Database (98.84.26.109)
   ↓ Returns horarios
Response back through chain
```

**Any failure in this chain results in 500/503 errors.**

---

## 💡 Key Points

- **503** = Service temporarily unavailable (container stopped or not responding)
- **500** = Service running but encountered an error (usually database connection or logic error)
- **400** = Bad request (frontend sending wrong format)
- **401** = Authentication required (JWT token missing/invalid)
- **404** = Endpoint not found (route doesn't exist)

---

**Status**: 🔧 Awaiting diagnostics
**Action**: Run "Diagnose System Status" workflow to identify the issue
