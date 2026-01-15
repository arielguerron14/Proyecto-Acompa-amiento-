# Service Registry Architecture - Implementation Complete ✅

## 🎯 Problem Solved

**BEFORE**: When EC2-CORE IP changed, you had to update:
- `.env` files (multiple locations)
- `docker-compose*.yml` files (multiple)
- Python deployment scripts
- Hardcoded routes in middleware
- GitHub Secrets
- Shell scripts

**AFTER**: Change ONE variable: `CORE_HOST`

```bash
export CORE_HOST="http://new-ip"
# All services automatically use new IP ✅
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUESTS                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
        GET /estudiantes/list
        GET /auth/login
        POST /maestros/create
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 8080)                   │
│                      server.js                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  proxyMiddleware - Dynamic Request Router            │   │
│  │  - Intercepts ALL requests                           │   │
│  │  - Looks up route in SERVICE_REGISTRY                │   │
│  │  - Proxies to actual microservice                    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────┬────────────────────────────────┬──────────────┘
               │                                │
        References                       References
               │                                │
               ▼                                ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  SERVICE_REGISTRY    │        │   PROXY MIDDLEWARE   │
    │  config/             │        │  middleware/         │
    │  service-registry.js │        │  proxy.js            │
    │                      │        │                      │
    │ CORE_HOST = env var  │        │ Routes using service │
    │ ✓ auth → port 3000   │        │ names from registry  │
    │ ✓ estudiantes → 3001 │        │ Forwards requests    │
    │ ✓ maestros → 3002    │        │ with axios/http      │
    │ ✓ reportes → 5003    │        │ Returns responses    │
    └──────────────────────┘        └──────────────────────┘
               ▲
               │
         Uses env var
         CORE_HOST
               │
    ┌──────────────────────┐
    │   ENVIRONMENT VAR    │
    │                      │
    │ CORE_HOST=           │
    │ http://172.31.79.241 │
    │ (change once, all    │
    │  services update)    │
    └──────────────────────┘
```

### The Key: Single Source of Truth

```javascript
// service-registry.js
const CORE_HOST = process.env.CORE_HOST || 'http://172.31.79.241'

// Changing CORE_HOST here:
// http://172.31.79.241 → http://3.236.51.29
// Automatically updates all 5 service URLs ✅
```

---

## 📂 Files Created/Modified

### ✅ NEW: `api-gateway/config/service-registry.js`
**Purpose**: Central configuration for all microservices
**Key Features**:
- `CORE_HOST` - Single source of truth
- Service definitions with ports
- Route mappings
- Helper methods to resolve services

### ✅ NEW: `api-gateway/middleware/proxy.js`
**Purpose**: Dynamic request routing
**Exports**:
- `proxyMiddleware` - Catches all requests, routes dynamically
- `configEndpoint` - Returns current configuration
- `servicesEndpoint` - Lists available services
- `healthEndpoint` - Health check with service status

### ✅ MODIFIED: `api-gateway/server.js`
**Changes**:
- Removed hardcoded proxy routes (before: 600+ lines)
- Removed http-proxy-middleware imports
- Added Service Registry initialization
- Simplified to import and mount proxyMiddleware
- Added diagnostic endpoints

**Result**: Cleaner, more maintainable code

### ✅ NEW: `SERVICE_REGISTRY_PATTERN.md`
**Purpose**: Comprehensive guide to the new pattern
**Contents**:
- How it works
- IP change procedure
- Configuration options
- API endpoints
- Troubleshooting

### ✅ NEW: `update-core-host.sh`
**Purpose**: Quick update script for Linux/Mac
**Usage**: `./update-core-host.sh 3.236.51.29`

### ✅ NEW: `update-core-host.ps1`
**Purpose**: Quick update script for Windows
**Usage**: `.\update-core-host.ps1 3.236.51.29`

---

## 🚀 How to Use

### Setup (One Time)

```bash
# 1. Ensure CORE_HOST is set in environment
export CORE_HOST="http://172.31.79.241"

# OR set in docker-compose.yml
environment:
  CORE_HOST: "http://172.31.79.241"

# 2. Start API Gateway
docker-compose up -d api-gateway

# 3. Verify
curl http://localhost:8080/health
```

### Change IP in Production

```bash
# EC2-CORE IP changed from 172.31.79.241 to 3.236.51.29

# Option 1: Using the helper script (easiest)
./update-core-host.sh 3.236.51.29

# Option 2: Manual environment variable
export CORE_HOST="http://3.236.51.29"
docker-compose up -d api-gateway

# Option 3: GitHub Actions (set in Secrets)
CORE_HOST = "http://3.236.51.29"

# Verify all services use new IP
curl http://localhost:8080/config | grep coreHost
```

---

## 📊 Diagnostic Endpoints

### `/health`
```bash
curl http://localhost:8080/health
# Returns: { status: "OK", coreHost: "http://..." }
```

### `/config`
```bash
curl http://localhost:8080/config
# Returns: { coreHost, services: { auth, estudiantes, ... } }
```

### `/services`
```bash
curl http://localhost:8080/services
# Returns: List of all available services with URLs
```

### `/health/extended`
```bash
curl http://localhost:8080/health/extended
# Returns: Detailed health check for each service
```

### `/routes`
```bash
curl http://localhost:8080/routes
# Returns: All registered routes
```

---

## 🎯 Request Flow Example

```
User requests: GET http://localhost:8080/estudiantes/list

1. Request hits API Gateway server.js
2. Matches route /estudiantes/*
3. proxyMiddleware intercepts
4. Looks up "estudiantes" in SERVICE_REGISTRY
5. Gets baseUrl: http://172.31.79.241:3001
6. Proxies to: http://172.31.79.241:3001/list
7. Returns response to client

✅ Total time to add new service: Update config only
✅ Total time to change IP: 1 environment variable
```

---

## 📋 Service Mappings

| Service | Route | CORE_HOST Port | Example URL |
|---------|-------|---|---|
| Auth | /auth/* | 3000 | http://CORE_HOST:3000/auth/register |
| Estudiantes | /estudiantes/* | 3001 | http://CORE_HOST:3001/estudiantes/list |
| Maestros | /maestros/* | 3002 | http://CORE_HOST:3002/maestros/list |
| Horarios | /horarios/* | 3002 | http://CORE_HOST:3002/horarios/get |
| Reportes Est | /reportes/* | 5003 | http://CORE_HOST:5003/reportes/estudiantes |
| Reportes Maest | /reportes/* | 5004 | http://CORE_HOST:5004/reportes/maestros |

---

## ✅ Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **IP Change** | Update 6+ files | Update 1 variable |
| **Code** | 600+ line server.js | ~200 lines, clean |
| **New Service** | Add hardcoded route | Add to registry |
| **Debugging** | Check multiple configs | curl /config |
| **Environment** | Multiple .env files | One CORE_HOST |
| **Errors** | Inconsistent IPs | Single source of truth |

---

## 🔐 Security Notes

- API Gateway still handles CORS centrally ✅
- All services communicate through single point ✅
- No credentials exposed in service URLs ✅
- Recommend: Use VPN for inter-service communication ✅
- Consider: Load balancer in front of API Gateway ✅

---

## 📚 Related Documentation

- See `SERVICE_REGISTRY_PATTERN.md` for detailed guide
- See workflow `.github/workflows/deploy.yml` for CI/CD integration
- See docker-compose files for environment setup

---

## 🎉 Implementation Status

✅ Service Registry created  
✅ Dynamic Proxy Middleware created  
✅ Server.js simplified  
✅ Diagnostic endpoints added  
✅ Helper scripts created  
✅ Documentation complete  

**Ready for production use!**

---

## 📞 Quick Reference

```bash
# View current configuration
curl http://localhost:8080/config

# Update IP (all platforms)
export CORE_HOST="http://new-ip"

# Or use helper scripts
./update-core-host.sh 3.236.51.29          # Linux/Mac
.\update-core-host.ps1 3.236.51.29         # Windows

# Verify services
curl http://localhost:8080/health/extended

# Check route mapping
curl http://localhost:8080/routes
```

---

**Architecture by**: Service Registry Pattern  
**Based on**: Microservices Best Practices  
**Status**: ✅ Production Ready
