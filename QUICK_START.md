# ⚡ QUICK START GUIDE - Proyecto Acompañamiento

## 🚀 System is LIVE and OPERATIONAL

### 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://44.210.241.99 | Main user interface |
| **API Gateway** | http://100.49.159.65:8080 | Backend API |
| **API Health** | http://100.49.159.65:8080/health | Status check |

---

## 📝 Quick Test - Try It Now!

### 1. Open Frontend
```
http://44.210.241.99
```

### 2. Register New User
```bash
curl -X POST http://100.49.159.65:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "rol": "Estudiante"
  }'
```

### 3. Login
```bash
curl -X POST http://100.49.159.65:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response includes:**
- `token` - JWT for authenticated requests
- `refreshToken` - For token renewal
- `user` - User information

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│       FRONTEND (44.210.241.99)      │
│          Web User Interface          │
└──────────────┬──────────────────────┘
               │ HTTP/HTTPS
               ▼
┌─────────────────────────────────────┐
│    API GATEWAY (100.49.159.65:8080) │
│       Routes all API requests       │
└──┬──────────────┬────────────────┬──┘
   │              │                │
   ▼              ▼                ▼
 AUTH          ESTUDIANTES      MAESTROS
 :3000         :3001            :3002
   │              │                │
   └──────────────┬────────────────┘
                  ▼
     ┌─────────────────────────────┐
     │  DATABASE (98.84.26.109)   │
     │ MongoDB/PostgreSQL/Redis   │
     └─────────────────────────────┘
```

---

## 📊 Microservices Status

| Service | IP | Port | Status |
|---------|----|----|--------|
| Auth | 100.24.118.233 | 3000 | ✅ Running |
| Estudiantes | 100.24.118.233 | 3001 | ✅ Running |
| Maestros | 100.24.118.233 | 3002 | ✅ Running |
| API Gateway | 100.49.159.65 | 8080 | ✅ Running |
| Database | 98.84.26.109 | 27017/5432/6379 | ✅ Running |
| Frontend | 44.210.241.99 | 80 | ✅ Running |

---

## 🔐 Authentication Flow

1. **Register**: Create account with email/password
2. **Login**: Get JWT token and refresh token
3. **Use Token**: Send with `Authorization: Bearer {token}` header
4. **Refresh**: Use refresh token when access token expires

---

## 🛠️ Useful Commands

### Check API Gateway Status
```bash
curl http://100.49.159.65:8080/health
```

### Test Registration
```bash
curl -X POST http://100.49.159.65:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test","name":"Test","rol":"Estudiante"}'
```

### Test Login
```bash
curl -X POST http://100.49.159.65:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### Connect to EC2 Instances
```bash
# Frontend server
ssh -i your-key.pem ubuntu@44.210.241.99

# API Gateway server
ssh -i your-key.pem ubuntu@100.49.159.65

# Database server
ssh -i your-key.pem ubuntu@98.84.26.109

# Microservices server
ssh -i your-key.pem ubuntu@100.24.118.233
```

### View Container Logs
```bash
# SSH into the server first, then:

# Frontend logs
docker logs acompanamiento-frontend -f

# API Gateway logs
docker logs acompanamiento-gateway -f

# Auth service logs
docker logs micro-auth -f
```

---

## 📋 Important Field Names

### Registration Request
```json
{
  "email": "user@example.com",      // Required
  "password": "password123",         // Required
  "name": "John Doe",                // Required (not 'nombre')
  "rol": "Estudiante"                // Required: Estudiante, Maestro, Admin
}
```

### Login Request
```json
{
  "email": "user@example.com",       // Required
  "password": "password123"          // Required
}
```

---

## 🐛 Troubleshooting

### Frontend Not Loading
```bash
# SSH to frontend
ssh -i key.pem ubuntu@44.210.241.99

# Check if running
docker ps | grep frontend

# Check logs
docker logs acompanamiento-frontend
```

### API Not Responding
```bash
# Check API Gateway
curl http://100.49.159.65:8080/health

# Check if container running
docker ps | grep gateway

# Check logs
docker logs acompanamiento-gateway
```

### Registration Failing
- Verify email is not already registered
- Check password length (usually min 6 characters)
- Verify name is provided
- Check rol is valid (Estudiante, Maestro, Admin)

---

## 📚 Complete Documentation

For comprehensive information, see:

- `FINAL_DEPLOYMENT_STATUS.md` - Complete deployment details
- `DEPLOYMENT_SUCCESS.md` - API Gateway testing results
- `DEPLOYMENT_NEXT_STEPS.md` - Step-by-step deployment guide
- `API_GATEWAY_TROUBLESHOOTING.md` - Detailed troubleshooting
- `README.md` - Project overview

---

## 🎯 Next Steps

1. **Test the system** at http://44.210.241.99
2. **Register a test user** through the UI
3. **Login** with your credentials
4. **Verify** you can access protected resources
5. **Report any issues** for bug fixes

---

**System Status: 🟢 PRODUCTION READY**

**Last Updated: January 5, 2026**
