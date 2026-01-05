# 🔧 API COMMUNICATION FIX - Frontend to Backend Routing

## Problem Identified

The frontend was getting HTTP 500/503 errors when trying to fetch data from:
- `/api/estudiantes/reservas/estudiante/{id}` - 500/503 errors
- `/api/horarios` - 500 errors
- `/api/reportes/...` - errors

**Error Messages:**
```
GET http://44.210.241.99/api/estudiantes/reservas/estudiante/695bc30… 500 (Internal Server Error)
GET http://44.210.241.99/api/horarios 500 (Internal Server Error)
```

## Root Cause

The frontend and API Gateway are on **different IP addresses**:
- **Frontend**: http://44.210.241.99:80
- **API Gateway**: http://100.49.159.65:8080

The frontend was configured to call the API Gateway directly, but:
1. Requests were being made to different IPs (CORS issues)
2. The API Gateway URL wasn't correctly configured in the frontend
3. Frontend was calling `baseURL` which defaulted to `http://localhost:8080`

## Solution Implemented

### 1. **Configured Frontend as API Proxy**
The frontend server (Node.js) already has built-in API proxying!
- All requests to `/api/*` are proxied to the API Gateway
- **Advantage**: No CORS issues, single entry point for frontend

### 2. **Updated Configuration Files**

**`frontend-web/js/config.js`** - Changed to use `/api` proxy:
```javascript
// Before: Used direct API Gateway URL
API_BASE = `http://${window.location.hostname}:8080`;

// After: Use frontend server proxy
let API_BASE = '/api';
```

**`frontend-web/js/estudiante-auth.js`** - Changed to use `/api`:
```javascript
// Before:
this.baseURL = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';

// After:
this.baseURL = '/api';
```

### 3. **How It Works Now**

```
Frontend Browser (44.210.241.99)
        ↓ HTTP Request (no CORS issues)
Frontend Server (Node.js port 80)
        ↓ Proxies to
API Gateway (100.49.159.65:8080)
        ↓ Routes to
Microservices (:3000, :3001, :3002)
        ↓ Access
Database
```

**Request Flow Example:**
1. Frontend makes: `POST /api/auth/login`
2. Frontend server receives: `/api/auth/login`
3. Frontend server proxies to: `http://100.49.159.65:8080/auth/login`
4. API Gateway forwards to: Auth Service (100.24.118.233:3000)
5. Auth Service returns response

## Deployment Steps

### To Deploy the Fix:

1. **Go to GitHub Actions**
2. **Find workflow**: "Redeploy Frontend (Quick Fix)"
3. **Click**: "Run workflow"
4. **Wait**: 3-5 minutes

**What the workflow does:**
- ✅ Pulls latest frontend code (with API config fixes)
- ✅ Rebuilds frontend Docker image
- ✅ Stops old container
- ✅ Starts new container
- ✅ Verifies it's working

### After Redeploy:

**Test the system:**
```bash
# Visit frontend
http://44.210.241.99

# Try registering a new user
# Use credentials: test@example.com / password123

# Try logging in
# Should work without errors
```

**Check Console for Logs:**
```javascript
// Open browser DevTools (F12) → Console
// Should see:
// [API Config] Using frontend server proxy: /api
// [API Config] API Base URL: /api
```

## API Endpoints Now Working

All these should work after the redeploy:

```bash
# Registration
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "rol": "Estudiante"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Get student reservations
GET /api/estudiantes/reservas/estudiante/{userId}

# Get available horarios
GET /api/horarios

# Get reports
GET /api/reportes/estudiantes/reporte/{userId}
```

## Testing Checklist

After redeploy:
- [ ] Frontend loads at http://44.210.241.99
- [ ] Can register new user (no 500 errors)
- [ ] Can login with credentials
- [ ] Dashboard loads without errors
- [ ] Can see student reservations
- [ ] Can see available horarios
- [ ] Can make reservations
- [ ] Can view reports

## If Issues Persist

### 1. Check Frontend Logs
```bash
ssh -i key.pem ubuntu@44.210.241.99
docker logs acompanamiento-frontend -f
```

**Look for:**
- `[API Config] Using frontend server proxy: /api` - should see this
- Any error messages about proxying

### 2. Check API Gateway Logs
```bash
ssh -i key.pem ubuntu@100.49.159.65
docker logs acompanamiento-gateway -f
```

**Look for:**
- Successful route requests
- No 404 errors for endpoints

### 3. Test API Gateway Directly (from your computer)
```bash
# This should work:
curl http://100.49.159.65:8080/health

# This should return data:
curl -X POST http://100.49.159.65:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### 4. Test Frontend Proxy (from browser or curl)
```bash
# This should work after redeploy:
curl http://44.210.241.99/api/health

# Should return same response as API Gateway
```

## Technical Details

### Why This Approach?

1. **No CORS Issues** - Same origin for frontend and API proxy
2. **Firewall Friendly** - Frontend server acts as gateway proxy
3. **Flexible** - Can change API Gateway URL by updating environment variable
4. **Performant** - Node.js handles proxy efficiently
5. **Secure** - Internal microservice IPs not exposed to client

### Environment Variables Used

- `API_GATEWAY_URL` - Set in Docker run command
  - Example: `http://100.49.159.65:8080`
  - Default: `http://api-gateway:8080` (for Docker Compose)

### Frontend Server Proxy Code

Location: `frontend-web/server.js` (lines 12-36)
```javascript
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:8080';

if (req.url.startsWith('/api/')) {
    const endpoint = req.url.substring(4); // Remove '/api' prefix
    const targetUrl = new URL(endpoint, API_GATEWAY_URL);
    // Proxy request to API Gateway
}
```

## Files Modified

- ✅ `frontend-web/js/config.js` - Use `/api` proxy
- ✅ `frontend-web/js/estudiante-auth.js` - Use `/api` prefix
- ✅ `.github/workflows/redeploy-frontend.yml` - New workflow

## Next Steps

1. **Run the redeploy workflow**
2. **Test the frontend** at http://44.210.241.99
3. **Report any remaining issues**

---

**Status**: Ready for redeploy
**Estimated Time**: 5 minutes
**Expected Result**: All frontend features working, no API errors
