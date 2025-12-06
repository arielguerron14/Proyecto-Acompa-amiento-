# JWT + Cache Authentication - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
# API Gateway
cd api-gateway
npm install

# Micro-Auth Service
cd ../micro-auth
npm install
```

### Step 2: Set Environment Variables
Create `.env` files:

**api-gateway/.env**
```
PORT=8080
MICRO_AUTH_URL=http://localhost:3002
JWT_SECRET=dev-jwt-secret
REFRESH_SECRET=dev-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

**micro-auth/.env**
```
PORT=3002
JWT_SECRET=dev-jwt-secret
REFRESH_SECRET=dev-refresh-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

### Step 3: Start Services
```bash
# Terminal 1: Start Micro-Auth
cd micro-auth
npm start

# Terminal 2: Start API Gateway
cd api-gateway
npm start
```

✅ Services should be running:
- API Gateway: http://localhost:8080
- Micro-Auth: http://localhost:3002

---

## 🧪 Test Authentication Flow

### 1. Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudiante@example.com",
    "password": "pass123"
  }'
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m",
  "user": {
    "userId": "EST001",
    "email": "estudiante@example.com",
    "role": "estudiante"
  }
}
```

Save the `accessToken` for next step.

---

### 2. Use Token (Protected Route)
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "EST001",
    "role": "estudiante",
    "email": "estudiante@example.com"
  }
}
```

---

### 3. Refresh Token
```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN",
    "oldAccessToken": "YOUR_OLD_ACCESS_TOKEN"
  }'
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m"
}
```

---

### 4. Logout
```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ACCESS_TOKEN"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

After logout, the token is **removed from cache** and cannot be used.

---

### 5. Register New User
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newestudiante@example.com",
    "password": "pass123",
    "name": "Nuevo Estudiante",
    "role": "estudiante"
  }'
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m",
  "user": {
    "userId": "est-1694523450000",
    "email": "newestudiante@example.com",
    "role": "estudiante",
    "name": "Nuevo Estudiante"
  }
}
```

---

## 📚 Test Users

Use these credentials for testing:

| Email | Password | Role |
|-------|----------|------|
| `estudiante@example.com` | `pass123` | estudiante |
| `maestro@example.com` | `pass123` | maestro |
| `admin@example.com` | `pass123` | admin |

---

## 🔍 How It Works

### Login Flow
```
1. Client sends email + password
   ↓
2. Micro-Auth verifies credentials
   ↓
3. Generates JWT tokens (access + refresh)
   ↓
4. CACHES access token in memory
   ↓
5. Returns tokens + user info to client
```

### Token Validation Flow
```
1. Client includes token in Authorization header
   ↓
2. API Gateway middleware extracts token
   ↓
3. Verifies JWT signature + expiry
   ↓
4. Sets req.user with decoded payload
   ↓
5. Route handler processes request
```

### Logout Flow
```
1. Client sends accessToken
   ↓
2. Micro-Auth receives logout request
   ↓
3. REMOVES token from cache
   ↓
4. Token is now invalid for any request
   ↓
5. Client receives success response
```

---

## 🛡️ Security Features

### ✅ JWT Validation
- Token is cryptographically signed
- Signature is verified on every request
- Expiry time is enforced
- Cannot be forged or modified

### ✅ Session Management
- Active sessions tracked in memory cache
- Logout immediately invalidates session
- No stale session data
- Cache can be shared across servers (with Redis)

### ✅ Token Refresh
- Access token short-lived (15 minutes)
- Refresh token longer-lived (7 days)
- Refresh removes old token, adds new token
- Minimizes damage if token is compromised

---

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login` | None | Login with email/password |
| POST | `/auth/refresh` | None | Refresh access token |
| POST | `/auth/logout` | None | Logout and invalidate token |
| POST | `/auth/register` | None | Register new user |

### Token Management
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/verify-token` | None | Check if token is valid |
| POST | `/auth/validate-permission` | Yes | Check user permissions |
| GET | `/auth/me` | Yes | Get current user info |

### Role Management
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/auth/roles` | None | List all roles |
| GET | `/auth/roles/:roleId/permissions` | None | Get role permissions |

---

## 🐛 Troubleshooting

### "Token required" Error
**Issue**: Authorization header not sent
**Solution**: 
```bash
curl -H "Authorization: Bearer YOUR_TOKEN"
```

### "Invalid token" Error
**Issue**: Token signature is invalid or expired
**Solution**: 
- Get new token by logging in again
- Use refresh endpoint to get new token

### "Token not in active session cache" Error
**Issue**: Token was logged out or cache was cleared
**Solution**: 
- Login again to get new token
- Check if logout was called

### "Credentials inválidas" Error
**Issue**: Email/password combination is wrong
**Solution**: 
- Use test credentials above
- Check email spelling
- Verify password is correct

---

## 📝 Next Steps

### Development
- [ ] Test authentication with your frontend
- [ ] Implement token storage (localStorage/sessionStorage)
- [ ] Add token refresh on 401 response
- [ ] Handle logout on button click

### Production
- [ ] Replace cache with Redis
- [ ] Hash passwords with bcrypt
- [ ] Move users to database
- [ ] Enable HTTPS only
- [ ] Set secure JWT secrets
- [ ] Add rate limiting
- [ ] Enable CORS properly
- [ ] Add audit logging

---

## 📖 Documentation

For more detailed information, see:
- `JWT_CACHE_IMPLEMENTATION_SUMMARY.md` - Comprehensive overview
- `JWT_CACHE_CODE_REFERENCE.md` - Code examples and reference
- `VERIFICATION_CHECKLIST.md` - Implementation verification

---

## ✅ System Status

| Component | Status | Port |
|-----------|--------|------|
| API Gateway | ✅ Ready | 8080 |
| Micro-Auth | ✅ Ready | 3002 |
| Token Cache | ✅ In-Memory | N/A |
| JWT Validation | ✅ Active | N/A |

System is **ready for testing and development**!

---

## 🎯 Common Tasks

### Get Tokens
```bash
# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"estudiante@example.com","password":"pass123"}' \
  | jq .
```

### Use Tokens in Frontend
```javascript
// Save tokens from login response
const { accessToken, refreshToken } = loginResponse;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Use token in requests
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
};

// Refresh when expired
const newToken = await refreshAccessToken();
localStorage.setItem('accessToken', newToken);
```

### Check Token Expiry
```javascript
// Decode JWT to check expiry
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

const token = localStorage.getItem('accessToken');
const decoded = parseJwt(token);
console.log('Expires:', new Date(decoded.exp * 1000));
```

---

**System is ready! Start testing now! 🚀**
