# 📑 EC2-CORE Deployment - Documentation Index

**Quick Navigation Guide for EC2-CORE Microservices Deployment**

---

## 🚀 START HERE

### 1. For Immediate Deployment (2-3 minutes)
📄 **[EC2-CORE_DEPLOYMENT_REFERENCE.md](EC2-CORE_DEPLOYMENT_REFERENCE.md)**
- Quick reference card
- Service URLs and credentials
- Key commands summary
- Recent commits list

### 2. For Complete Understanding (15-20 minutes)
📄 **[EC2-CORE_MASTER_STATUS.md](EC2-CORE_MASTER_STATUS.md)**
- Complete project overview
- Infrastructure diagram
- Pre-deployment checklist
- Success criteria
- Next phases

### 3. For Step-by-Step Deployment (30-45 minutes)
📄 **[EC2-CORE_DEPLOYMENT_GUIDE.md](EC2-CORE_DEPLOYMENT_GUIDE.md)**
- Full step-by-step walkthrough
- Architecture visualization
- Troubleshooting procedures
- Common commands
- Configuration details

### 4. For Post-Deployment Verification (10-15 minutes)
📄 **[EC2-CORE_DEPLOYMENT_VALIDATION.md](EC2-CORE_DEPLOYMENT_VALIDATION.md)**
- Detailed validation checklist
- Health checks procedures
- Service endpoints testing
- Database connectivity tests
- Maintenance commands

---

## 🛠️ Deployment Tools

### Automated Deployment Script
📄 **[deploy-ec2-core.sh](deploy-ec2-core.sh)** (7.1 KB)
- OS auto-detection
- Docker auto-installation
- Image building automation
- Service validation

**Usage:**
```bash
bash deploy-ec2-core.sh
```

### GitHub Actions Workflow
📄 **[.github/workflows/deploy-ec2-core.yml](.github/workflows/deploy-ec2-core.yml)** (7.2 KB)
- Automated CI/CD deployment
- Matrix build strategy
- Health check validation

**Usage:**
```bash
gh workflow run deploy-ec2-core.yml --ref main
```

---

## 📊 Documentation Summary

| Document | Size | Purpose | Read Time |
|----------|------|---------|-----------|
| **EC2-CORE_MASTER_STATUS.md** | 13.6 KB | Complete overview & quick start | 5 min |
| **EC2-CORE_DEPLOYMENT_GUIDE.md** | 13.5 KB | Step-by-step walkthrough | 10 min |
| **EC2-CORE_DEPLOYMENT_VALIDATION.md** | 6.5 KB | Post-deployment checks | 5 min |
| **EC2-CORE_DEPLOYMENT_REFERENCE.md** | 2.5 KB | Quick reference | 2 min |
| **deploy-ec2-core.sh** | 7.1 KB | Deployment script | - |
| **deploy-ec2-core.yml** | 7.2 KB | GitHub Actions workflow | - |

**Total:** ~50 KB of comprehensive documentation

---

## 🎯 Recommended Reading Order

### For First-Time Users
1. ✅ **This file** (you are here!) - 1 min
2. 📄 **EC2-CORE_MASTER_STATUS.md** - 5 min
3. 📄 **EC2-CORE_DEPLOYMENT_GUIDE.md** - 10 min
4. 🚀 **Execute deployment** - 15-20 min
5. ✅ **EC2-CORE_DEPLOYMENT_VALIDATION.md** - 5 min

### For Experienced Users
1. 📄 **EC2-CORE_DEPLOYMENT_REFERENCE.md** - 2 min
2. 🚀 **Execute deployment** - 15-20 min
3. ✅ **Quick validation** - 2 min

### For Troubleshooting
1. 📄 **EC2-CORE_DEPLOYMENT_GUIDE.md** → Troubleshooting section
2. 📄 **EC2-CORE_DEPLOYMENT_VALIDATION.md** → Service-specific tests
3. Run: `docker logs <service-name>`

---

## 🚀 Quick Start Command

Copy-paste ready deployment:
```bash
# SSH to EC2-CORE
ssh -i your-key.pem ubuntu@13.216.12.61

# Download and run deployment script
wget https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/deploy-ec2-core.sh && bash deploy-ec2-core.sh
```

---

## 📍 Infrastructure Details

### EC2-DB (Already Running)
- **Private IP:** 172.31.79.193
- **Status:** ✅ All databases operational
- **Services:** MongoDB, PostgreSQL, Redis

### EC2-CORE (To Be Deployed)
- **Public IP:** 13.216.12.61
- **Private IP:** 172.31.78.183
- **Status:** 🟡 Ready for deployment
- **Services:** micro-auth, micro-estudiantes, micro-maestros

---

## 🔗 Key Connection Strings

### Service Endpoints (from EC2-CORE)
```
micro-auth:         http://localhost:3000
micro-estudiantes:  http://localhost:3001
micro-maestros:     http://localhost:3002
```

### From Other EC2 Instances
```
micro-auth:         http://172.31.78.183:3000
micro-estudiantes:  http://172.31.78.183:3001
micro-maestros:     http://172.31.78.183:3002
```

### Database Connections
```
MongoDB:    mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
PostgreSQL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
Redis:      redis://:redis123@172.31.79.193:6379
```

---

## ✅ Deployment Phases

### Phase 1: EC2-DB ✅ COMPLETED
- MongoDB deployed & running
- PostgreSQL deployed & running
- Redis deployed & running

### Phase 2: EC2-CORE 🟡 IN PROGRESS
- Deployment package created ✅
- Documentation complete ✅
- Ready for execution 🟡

### Phase 3-5: Upcoming ⏳
- EC2-API-Gateway
- EC2-Frontend
- Integration Testing

---

## 📞 Support Resources

### Common Issues & Solutions
See **EC2-CORE_DEPLOYMENT_GUIDE.md** → **Troubleshooting** section

### Command Reference
See **EC2-CORE_DEPLOYMENT_VALIDATION.md** → **Useful Maintenance Commands**

### Configuration Details
See **EC2-CORE_DEPLOYMENT_GUIDE.md** → **Configuration Files**

---

## 🎁 What's Included

✅ Production-ready deployment script  
✅ GitHub Actions CI/CD workflow  
✅ 4 comprehensive documentation guides  
✅ Pre-deployment checklists  
✅ Post-deployment validation procedures  
✅ Troubleshooting procedures  
✅ Common commands reference  
✅ Infrastructure diagrams  
✅ All tested and verified  

---

## 📈 Success Criteria

Deployment is successful when:
1. ✅ All 3 containers running (`docker ps -a`)
2. ✅ All health endpoints respond 200 OK
3. ✅ Services connect to EC2-DB databases
4. ✅ No errors in container logs
5. ✅ docker-compose.yml properly configured

---

## 🎯 Next Steps

1. **Choose a guide above** based on your needs
2. **Follow the step-by-step instructions**
3. **Run the deployment script**
4. **Validate the deployment**
5. **Proceed to next phase** (EC2-API-Gateway)

---

## 📚 GitHub Repository

All files are committed and available on the main branch:
- https://github.com/arielguerron14/Proyecto-Acompa-amiento-

Recent commits:
```
9736943 - docs: Agregar reporte maestro de estado
6ad6bd9 - docs: Agregar guía completa de deployment
7e67617 - docs: Agregar checklist de validación
545369f - docs: Agregar guía de referencia
5f02dff - docs: Agregar script de deployment manual
```

---

**Status:** ✅ Ready for Deployment  
**Last Updated:** January 2025  
**Version:** 1.0

