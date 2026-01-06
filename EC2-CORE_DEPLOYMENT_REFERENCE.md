# 🚀 EC2-CORE Deployment - Quick Reference

## Current Status ✅

### EC2-DB (Database Tier)
- **MongoDB 6.0**: ✅ Running (Port 27017)
- **PostgreSQL 15.15**: ✅ Running (Port 5432)  
- **Redis 7-alpine**: ✅ Running (Port 6379)
- **IP**: 3.236.45.128 (Public) / 172.31.79.193 (Private)

### EC2-CORE (Microservices Tier)
- **Status**: 🟡 Ready for deployment
- **IP**: 13.216.12.61 (Public) / 172.31.78.183 (Private)
- **Microservices**:
  - micro-auth (Port 3000)
  - micro-estudiantes (Port 3001)
  - micro-maestros (Port 3002)

---

## Deployment Options

### Option 1: Manual Script (RECOMMENDED)
```bash
# SSH into EC2-CORE
ssh -i your-key.pem ubuntu@13.216.12.61

# Download and run deployment script
wget https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/deploy-ec2-core.sh
bash deploy-ec2-core.sh
```

**Time**: ~15-20 minutes
**What it does**:
- Detects OS (Ubuntu or Amazon Linux)
- Installs Docker & Docker Compose
- Clones repository
- Builds 3 Docker images
- Starts services with docker-compose
- Validates deployment

### Option 2: GitHub Actions Workflow
```bash
gh workflow run deploy-ec2-core.yml --ref main
```

**Status**: ⚠️ Some cache issues with GitHub Actions

---

## Database Connections from EC2-CORE

### MongoDB
```
mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
```

### PostgreSQL
```
postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
```

### Redis
```
redis://:redis123@172.31.79.193:6379
```

---

## Useful Commands

```bash
# Check service status
docker ps -a

# View logs
docker logs micro-auth
docker logs micro-estudiantes
docker logs micro-maestros

# Restart a service
docker-compose restart micro-auth

# Stop all services
docker-compose down

# View docker-compose file
cat /opt/microservices/docker-compose.yml
```

---

## Service URLs (Internal VPC)

- Auth: `http://172.31.78.183:3000`
- Estudiantes: `http://172.31.78.183:3001`
- Maestros: `http://172.31.78.183:3002`

---

## Recent Commits

1. **5f02dff** - Add manual deployment script
2. **9eefe64** - Rename workflow to deploy-ec2-core.yml
3. **e439460** - Cleanup problematic files
4. **8073f13** - Expand workflow with full build
5. **5490570** - Create deploy-core-microservices workflow

---

## Next Steps

1. Execute manual script on EC2-CORE
2. Verify all 3 services are running
3. Check logs for any errors
4. Deploy EC2-API-Gateway (next tier)
5. Deploy Frontend (final tier)
