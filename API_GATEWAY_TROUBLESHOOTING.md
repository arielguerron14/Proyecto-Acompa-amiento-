# 🔍 API GATEWAY TROUBLESHOOTING GUIDE

## Current Issue

**Symptom:** API Gateway returns `{"error":"Endpoint not found"}` for registration
```
POST http://100.49.159.65:8080/auth/register
↓
{"error":"Endpoint not found"}
```

**Health Check:** ✅ Works
```
GET http://100.49.159.65:8080/health
↓
HTTP 200 OK
```

## Root Cause Analysis

The issue is one of these:

1. **Auth routes not being mounted** - The `/auth` prefix isn't registered in Express
2. **Old Docker image still running** - Code changes weren't picked up by Docker
3. **Module loading failure** - authRoutes.js or httpForward.js failed to load silently

## Debugging Steps (Run in Order)

### 1. Run Debug & Rebuild Workflow
This workflow will:
- Check current container logs
- Identify if auth routes are registered
- Rebuild from scratch with new code
- Show startup logs to confirm routes are mounted

**Steps:**
1. Go to GitHub Actions
2. Find workflow: **"Debug & Rebuild API Gateway"**
3. Click **"Run workflow"**
4. Wait 5-10 minutes

**What to look for in the output:**
- Should see: `✅ Auth routes mounted via internal forwarder (with JSON parser)`
- Should see: `📍 Available auth endpoints: /auth/register, /auth/login, /auth/logout, /auth/verify-token, /auth/me`
- Should see: `🎉 API Gateway listening on port 8080`

### 2. Check Container Logs Manually
If the workflow doesn't help, SSH into the gateway and check:

```bash
# SSH to gateway
ssh -i your-key ubuntu@100.49.159.65

# See all logs
docker logs acompanamiento-gateway

# Follow logs in real-time
docker logs -f acompanamiento-gateway

# Search for specific messages
docker logs acompanamiento-gateway | grep -i "auth\|mounted\|listening"
```

**Expected log output on startup:**
```
🚀 Starting API Gateway server...
🔗 Configured Services:
  Auth: http://100.24.118.233:3000
  Maestros: http://100.24.118.233:3002
  Estudiantes: http://100.24.118.233:3001
✅ authRoutes module loaded successfully
✅ Auth routes mounted via internal forwarder (with JSON parser)
📍 Available auth endpoints: /auth/register, /auth/login, /auth/logout, /auth/verify-token, /auth/me
🎉 API Gateway listening on port 8080
```

### 3. Verify Environment Variables
Check if the correct env vars are set in the container:

```bash
# SSH into gateway
ssh -i your-key ubuntu@100.49.159.65

# Check env vars
docker inspect acompanamiento-gateway | grep -E "AUTH_SERVICE|MAESTROS_SERVICE|ESTUDIANTES_SERVICE|NODE_ENV|PORT"

# Expected output:
# "AUTH_SERVICE=http://100.24.118.233:3000",
# "MAESTROS_SERVICE=http://100.24.118.233:3002",
# "ESTUDIANTES_SERVICE=http://100.24.118.233:3001",
# "NODE_ENV=production",
# "PORT=8080"
```

### 4. Test Endpoint with Verbose Output
Use curl with verbose to see exactly what's happening:

```bash
# Test with verbose output
curl -v -X POST http://100.49.159.65:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@example.com","password":"123456","rol":"Estudiante"}'

# Should see:
# < HTTP/1.1 200 OK (if auth service responds)
# or
# < HTTP/1.1 503 (if auth service unreachable)
# but NOT
# < HTTP/1.1 404 (which means endpoint not found)
```

### 5. Verify Auth Microservice is Running
The gateway might be routing but the auth microservice might be down:

```bash
# Test auth microservice directly
curl -v http://100.24.118.233:3000/health

# Expected: HTTP 200 OK
# If not working, redeploy microservices with "final-fix.yml" workflow
```

### 6. Check API Gateway Dockerfile
Make sure it's copying all required files:

```bash
# Check Dockerfile includes src/routes and src/utils
cat api-gateway/Dockerfile

# Should have:
# COPY src/ /app/src/
# or
# COPY . .
```

### 7. Manual Container Rebuild
If automatic workflow fails, manually rebuild:

```bash
# SSH to gateway server
ssh -i your-key ubuntu@100.49.159.65

# Stop old container
docker stop acompanamiento-gateway
docker rm acompanamiento-gateway
docker rmi api-gateway:latest

# Get latest code
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

# Rebuild
docker build -t api-gateway:latest -f api-gateway/Dockerfile ./api-gateway

# Start with correct env vars
docker run -d \
  --name acompanamiento-gateway \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e AUTH_SERVICE=http://100.24.118.233:3000 \
  -e MAESTROS_SERVICE=http://100.24.118.233:3002 \
  -e ESTUDIANTES_SERVICE=http://100.24.118.233:3001 \
  api-gateway:latest

# Check logs
docker logs acompanamiento-gateway
```

## Common Issues & Solutions

### Issue 1: "Endpoint not found" for all routes
**Cause:** Express routes not being registered
**Solution:** 
- Run Debug & Rebuild workflow
- Check logs for "Auth routes mounted" message
- If not present, check if authRoutes.js can be required

### Issue 2: "Auth service unavailable"
**Cause:** Auth microservice is down or unreachable
**Solution:**
- Test auth microservice: `curl http://100.24.118.233:3000/health`
- If not working, run "final-fix.yml" workflow to redeploy microservices
- Check network connectivity: `ping 100.24.118.233` from gateway

### Issue 3: Wrong response format
**Cause:** Response is coming from wrong handler
**Solution:**
- If response has extra `{"error":"..."}`, it's hitting 404 handler
- If response is `{"error":"Auth service unavailable"}`, microservice is down
- If response is actual data, request is being forwarded successfully

## Expected Behavior After Fix

### ✅ Registration Request
```bash
curl -X POST http://100.49.159.65:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@example.com","password":"123456","rol":"Estudiante"}'

# Should return user object with 200 OK (not 404)
# Example:
# {
#   "id": "507f1f77bcf86cd799439011",
#   "nombre": "Test",
#   "email": "test@example.com",
#   "rol": "Estudiante"
# }
```

### ✅ Login Request
```bash
curl -X POST http://100.49.159.65:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Should return:
# {
#   "success": true,
#   "token": "eyJhbGc...",
#   "user": { ... }
# }
```

## Files Modified (Latest Session)

- ✅ `api-gateway/server.js` - Added detailed logging
- ✅ `.github/workflows/debug-rebuild-api-gateway.yml` - New debug workflow
- ✅ `DEPLOYMENT_NEXT_STEPS.md` - Documentation

## Next Steps

1. **Run "Debug & Rebuild API Gateway" workflow**
   - Will show exact reason why routes aren't working
   - Will rebuild with latest code

2. **If Debug workflow succeeds:**
   - Test registration endpoint
   - Run "Deploy Frontend with New IPs" workflow
   - Access frontend at http://44.210.241.99

3. **If Debug workflow fails:**
   - SSH into gateway and run manual rebuild steps
   - Check container logs for error messages
   - Verify Docker files are present

## Quick Reference

| Component | Status | URL |
|-----------|--------|-----|
| Health Check | ✅ | http://100.49.159.65:8080/health |
| Registration | ❌ | http://100.49.159.65:8080/auth/register |
| Login | ❌ | http://100.49.159.65:8080/auth/login |
| Auth Service (backend) | ✅ | http://100.24.118.233:3000/health |

---

**Last Updated:** January 5, 2026
**Status:** 🔧 Debugging in progress
