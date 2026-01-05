# 🚀 QUICK DEPLOYMENT GUIDE - January 5, 2026

## Current Status
✅ All EC2 instances refreshed with new public IPs
✅ All workflows updated with new IPs
✅ Ready for deployment

## 📋 Deployment Sequence

### **Step 1: Deploy Microservices** (5-10 minutes)
```bash
GitHub Actions → "FINAL FIX - Rebuild and Restart All Microservices" → Run workflow
```

**What it does:**
- SSH to EC2-CORE (100.24.118.233)
- Stops/removes old microservice containers
- Rebuilds Auth, Estudiantes, Maestros microservices
- Starts them on ports 3000, 3001, 3002
- Connects to DB at 98.84.26.109

**Expected result:** ✅ All 3 microservices running and healthy

---

### **Step 2: Deploy API Gateway** (3-5 minutes)
```bash
GitHub Actions → "Restart API Gateway with Public IPs" → Run workflow
```

**What it does:**
- SSH to EC2-API-Gateway (100.49.159.65)
- Rebuilds API Gateway container
- Configures routing to microservices at 100.24.118.233:3000/3001/3002
- Starts on port 8080

**Expected result:** ✅ API Gateway responding at http://100.49.159.65:8080/health

---

### **Step 3: Deploy Frontend** (3-5 minutes)
```bash
GitHub Actions → "Deploy Frontend with New IPs" → Run workflow
```

**What it does:**
- SSH to EC2-Frontend (44.210.241.99)
- Rebuilds frontend web container
- Configures to use API Gateway at 100.49.159.65:8080
- Starts on ports 80 (http) and 3000 (dev)

**Expected result:** ✅ Frontend accessible at http://44.210.241.99

---

## ✅ Verification Tests

After all 3 deployments complete, run these tests:

### **Test 1: Microservices Health** (from EC2-CORE)
```bash
curl http://100.24.118.233:3000/health
curl http://100.24.118.233:3001/health
curl http://100.24.118.233:3002/health
# Should all return 200 OK with health status
```

### **Test 2: API Gateway Health** (from anywhere)
```bash
curl http://100.49.159.65:8080/health
# Should return 200 OK
```

### **Test 3: Frontend Access** (from browser or curl)
```bash
curl http://44.210.241.99
# Should return HTML homepage
```

### **Test 4: User Registration** (full flow test)
```bash
curl -X POST http://100.49.159.65:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre":"Test User",
    "email":"test@example.com",
    "password":"TestPassword123",
    "rol":"Estudiante"
  }'
# Should return 200 OK with user data
```

### **Test 5: Frontend Registration Form** (browser test)
```
Open: http://44.210.241.99
Click on register form
Fill in: Name, Email, Password, Role
Submit
Should see: Success message or user dashboard
```

---

## 📊 IP Reference

| Service | Public IP | Port(s) | Health Check |
|---------|-----------|---------|--------------|
| Microservices (Auth) | 100.24.118.233 | 3000 | http://100.24.118.233:3000/health |
| Microservices (Estudiantes) | 100.24.118.233 | 3001 | http://100.24.118.233:3001/health |
| Microservices (Maestros) | 100.24.118.233 | 3002 | http://100.24.118.233:3002/health |
| API Gateway | 100.49.159.65 | 8080 | http://100.49.159.65:8080/health |
| Frontend | 44.210.241.99 | 80 | http://44.210.241.99 |
| Databases | 98.84.26.109 | 27017/5432/6379 | N/A (SSH only) |

---

## 🔧 Troubleshooting

### If microservices fail to start:
1. Check DB credentials in final-fix.yml
2. Verify EC2-DB (98.84.26.109) is running
3. Check logs: `docker logs micro-auth` on EC2-CORE

### If API Gateway can't reach microservices:
1. Verify microservices are running: `docker ps` on 100.24.118.233
2. Test connectivity: `curl http://100.24.118.233:3000/health`
3. Check logs: `docker logs acompanamiento-gateway` on 100.49.159.65

### If frontend shows errors:
1. Check API Gateway is running: `curl http://100.49.159.65:8080/health`
2. Verify frontend configured correctly: `docker logs acompanamiento-frontend`
3. Open browser DevTools (F12) and check network requests

### If you get "Connection refused":
- Usually means service crashed or port mismatch
- SSH to instance and check: `docker logs CONTAINER_NAME`
- Common issues: Wrong PORT env var, wrong DB_HOST

---

## 🎯 Expected Timeline

- **Deployment total time**: ~20 minutes
- **Microservices**: 5-10 min
- **API Gateway**: 3-5 min  
- **Frontend**: 3-5 min
- **Testing & verification**: 2-3 min

---

## ✨ Next Steps After Verification

1. ✅ Verify all 3 workflows completed successfully
2. ✅ Run all 5 verification tests
3. ✅ Test user registration end-to-end
4. 📝 **Document any issues found**
5. 🔄 If issues exist, run individual workflows to fix
6. 🎯 Once working, consider:
   - Setting up SSL/TLS certificates
   - Configuring monitoring alerts
   - Deploying additional services (Notificaciones, Reportes, Messaging)

---

**Ready to deploy?** Start with Step 1: Deploy Microservices! 🚀
