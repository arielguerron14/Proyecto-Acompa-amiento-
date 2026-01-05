# 🔍 Root Cause Analysis & Solution

## Problem Identified
The `micro-estudiantes` and `micro-maestros` services were failing with **500 errors** when accessed through the frontend.

### Error in Logs
```
error: getaddrinfo ENOTFOUND mongo
```

## Root Cause
The microservices were trying to connect to MongoDB using the hostname `mongo` (Docker Compose container name) instead of the actual database server IP address `98.84.26.109`.

**Why it happened:**
1. Development setup uses Docker Compose with container names for DNS resolution
2. Production deployment is on EC2 instances without Docker Compose networking
3. Microservices had hardcoded fallback IP addresses that were outdated: `172.31.67.47` 
4. The workflow was passing `DB_HOST` but microservices needed `MONGO_URI` environment variable

## Solution Applied

### 1. **Updated Workflow** (`.github/workflows/final-fix.yml`)
- Added `MONGO_URI` environment variable to `micro-estudiantes` and `micro-maestros` docker run commands
- Format: `mongodb://98.84.26.109:27017/{database_name}`

### 2. **Updated Config Files**
Changed default MongoDB host from `172.31.67.47` to `98.84.26.109` in:
- `micro-auth/src/config/index.js`
- `micro-estudiantes/src/config/index.js`
- `micro-maestros/src/config/index.js`

Also updated default Redis host to `98.84.26.109`

### 3. **Why This Works**
- Microservices now have explicit `MONGO_URI` env var pointing to correct IP
- If env var not set, fallback default is now correct: `98.84.26.109`
- Services can connect to MongoDB on the database server EC2 instance
- No more DNS resolution failures

## Next Steps

### ✅ Changes Committed
All fixes have been committed and pushed to GitHub main branch:
- Commit: `f7bc7f3`
- Files: 
  - `.github/workflows/final-fix.yml`
  - `micro-auth/src/config/index.js`
  - `micro-estudiantes/src/config/index.js`
  - `micro-maestros/src/config/index.js`

### 🚀 To Apply Fix

**Option 1: Run GitHub Actions Workflow (Recommended)**
1. Go to GitHub → Actions
2. Find "FINAL FIX - Rebuild and Restart All Microservices" workflow
3. Click "Run workflow"
4. Wait 5-10 minutes for completion

**Option 2: Manual Fix (SSH into microservices instance)**
```bash
ssh -i key.pem ubuntu@100.24.118.233

# Stop and remove old containers
docker stop micro-auth micro-estudiantes micro-maestros
docker rm micro-auth micro-estudiantes micro-maestros

# Clone latest code
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

# Rebuild images
docker build -t micro-auth:latest -f micro-auth/Dockerfile .
docker build -t micro-estudiantes:latest -f micro-estudiantes/Dockerfile .
docker build -t micro-maestros:latest -f micro-maestros/Dockerfile .

# Start with correct MongoDB URIs
docker run -d --name micro-auth --restart unless-stopped \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=98.84.26.109 \
  -e DB_USER=root \
  -e DB_PASS=password \
  -e REDIS_HOST=98.84.26.109 \
  -e REDIS_PORT=6379 \
  -e MONGO_URI=mongodb://98.84.26.109:27017/authdb \
  micro-auth:latest

docker run -d --name micro-estudiantes --restart unless-stopped \
  -p 3001:3001 \
  -e PORT=3001 \
  -e DB_HOST=98.84.26.109 \
  -e DB_USER=postgres \
  -e DB_PASS=example \
  -e REDIS_HOST=98.84.26.109 \
  -e REDIS_PORT=6379 \
  -e MONGO_URI=mongodb://98.84.26.109:27017/estudiantesdb \
  micro-estudiantes:latest

docker run -d --name micro-maestros --restart unless-stopped \
  -p 3002:3002 \
  -e PORT=3002 \
  -e DB_HOST=98.84.26.109 \
  -e DB_USER=postgres \
  -e DB_PASS=example \
  -e REDIS_HOST=98.84.26.109 \
  -e REDIS_PORT=6379 \
  -e MONGO_URI=mongodb://98.84.26.109:27017/maestrosdb \
  micro-maestros:latest
```

## Expected Result After Fix
✅ Services connect to MongoDB successfully  
✅ No more `ENOTFOUND mongo` errors  
✅ No more 500 errors from microservices  
✅ Frontend dashboard loads with data  
✅ Reservations and horarios display correctly  

## System Architecture After Fix
```
Frontend (44.210.241.99:80)
    ↓
[Proxy /api/* → http://100.49.159.65:8080]
    ↓
API Gateway (100.49.159.65:8080)
    ↓
Microservices (100.24.118.233)
├─ Auth Service (3000) ─┐
├─ Estudiantes (3001) ──┤→ MongoDB (98.84.26.109:27017)
└─ Maestros (3002) ─────┘
```

## Testing After Fix
Once services are restarted:
1. Check health: `curl http://100.24.118.233:3001/health`
2. Check logs: `docker logs micro-estudiantes | tail -50`
3. Test frontend: Visit http://44.210.241.99
4. Should see data loading without errors
