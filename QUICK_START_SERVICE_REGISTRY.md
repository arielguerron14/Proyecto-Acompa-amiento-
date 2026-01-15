# 🚀 QUICK START - Service Registry Pattern

## The Problem (SOLVED ✅)

**Before**: EC2-CORE IP changed every restart → Update 6+ files  
**After**: Change 1 variable `CORE_HOST` → All services auto-update

---

## One-Minute Setup

### Step 1: Set CORE_HOST
```bash
# Find your EC2-CORE IP
export CORE_HOST="http://3.236.51.29"

# OR edit .env
echo 'CORE_HOST=http://3.236.51.29' > .env
```

### Step 2: Start Services
```bash
docker-compose up -d api-gateway
```

### Step 3: Verify
```bash
curl http://localhost:8080/health
```

Done! ✅

---

## Change IP (When EC2-CORE Restarts)

**Option 1: Quick Script** (Recommended)
```bash
./update-core-host.sh 54.123.45.67
```

**Option 2: Manual**
```bash
export CORE_HOST="http://54.123.45.67"
docker-compose up -d api-gateway
```

**Option 3: Edit Files**
```bash
# Edit .env
CORE_HOST=http://54.123.45.67

# Edit docker-compose.yml
environment:
  CORE_HOST: http://54.123.45.67

# Restart
docker-compose up -d api-gateway
```

---

## Verify It Works

```bash
# Check configuration
curl http://localhost:8080/config

# Check all services
curl http://localhost:8080/services

# Extended health check
curl http://localhost:8080/health/extended

# See available routes
curl http://localhost:8080/routes
```

---

## Example: Call a Microservice

```bash
# Call Estudiantes (through API Gateway)
curl http://localhost:8080/estudiantes/list

# Behind the scenes:
# 1. API Gateway intercepts request
# 2. Looks up "estudiantes" → port 3001
# 3. Uses CORE_HOST:3001
# 4. Routes to: http://54.123.45.67:3001/list
# 5. Returns response

# No need to know actual IP! 🎉
```

---

## What Changed?

| Aspect | Before | Now |
|--------|--------|-----|
| Hardcoded IPs | ❌ Scattered everywhere | ✅ One CORE_HOST |
| API Gateway Code | ❌ 600+ lines | ✅ ~200 lines |
| IP Change Time | ❌ 10-15 minutes | ✅ 30 seconds |
| New Service | ❌ Edit code | ✅ Edit config |

---

## Files You Need to Know

1. **`.env` or `docker-compose.yml`**
   - Define `CORE_HOST` here

2. **`api-gateway/config/service-registry.js`**
   - Central configuration
   - Don't edit IPs here, use env vars

3. **`api-gateway/server.js`**
   - Uses Service Registry + Proxy Middleware
   - Much simpler now

4. **`update-core-host.sh/.ps1`**
   - Helper script to update IP quickly

---

## Troubleshooting

### "Service unavailable"
```bash
# Check CORE_HOST is correct
curl http://localhost:8080/config | grep coreHost

# Verify EC2-CORE is up
curl http://3.236.51.29:3000/health
```

### "Route not found"
```bash
# Check available routes
curl http://localhost:8080/routes

# Check service is registered
curl http://localhost:8080/services
```

---

## Environment Variables

```bash
# Required
CORE_HOST=http://172.31.79.241

# Optional
PORT=8080                        # API Gateway port
API_GATEWAY_PORT=8080           # Alternative name
```

---

## Docker Compose Example

```yaml
api-gateway:
  image: node:18-alpine
  environment:
    CORE_HOST: http://172.31.79.241
    PORT: 8080
  ports:
    - "8080:8080"
  volumes:
    - ./api-gateway:/app
```

---

## GitHub Actions Integration

```yaml
- name: Deploy
  env:
    CORE_HOST: ${{ env.EC2_CORE_IP }}
  run: |
    export CORE_HOST
    docker-compose up -d api-gateway
```

---

## That's It! 🎉

**Key Takeaway**: 
- Service routing controlled by ONE environment variable: `CORE_HOST`
- Change it once, all services use new IP automatically
- No code changes needed

**Questions?** See `SERVICE_REGISTRY_PATTERN.md` for detailed guide.
