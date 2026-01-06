# 📋 EC2-CORE Complete Deployment Guide

## 🎯 Overview

This guide walks you through the complete deployment of the **EC2-CORE** microservices tier, which includes:
- **micro-auth**: Authentication service (Port 3000)
- **micro-estudiantes**: Student management service (Port 3001)
- **micro-maestros**: Teacher management service (Port 3002)

**Prerequisite**: EC2-DB (database tier) must be running and healthy ✅

---

## 📊 Infrastructure Map

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    AWS VPC (ap-southeast-1)                │
│                    172.31.0.0/16                           │
│                                                             │
│  ┌──────────────────────┐    ┌─────────────────────────┐   │
│  │   EC2-API-GATEWAY    │    │     EC2-FRONTEND        │   │
│  │   (upcoming)         │    │     (upcoming)          │   │
│  └──────────┬───────────┘    └──────────┬──────────────┘   │
│             │                           │                  │
│             └───────────────┬───────────┘                  │
│                             │                              │
│                             ▼                              │
│          ┌──────────────────────────────────┐             │
│          │      EC2-CORE MICROSERVICES      │             │
│          │      13.216.12.61               │             │
│          │      172.31.78.183              │             │
│          │                                  │             │
│          │  ┌───────────────────────────┐  │             │
│          │  │ micro-auth (3000)         │  │             │
│          │  │ micro-estudiantes (3001)  │  │             │
│          │  │ micro-maestros (3002)     │  │             │
│          │  └───────────┬───────────────┘  │             │
│          └──────────────┼──────────────────┘             │
│                         │                                │
│                         ▼                                │
│          ┌──────────────────────────────────┐            │
│          │        EC2-DB DATABASES          │            │
│          │        3.236.45.128             │            │
│          │        172.31.79.193            │            │
│          │                                  │            │
│          │  ┌──────────────────────────┐   │            │
│          │  │ MongoDB (27017)          │   │            │
│          │  │ PostgreSQL (5432)        │   │            │
│          │  │ Redis (6379)             │   │            │
│          │  └──────────────────────────┘   │            │
│          └──────────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Pre-Deployment Checklist

Before starting deployment, verify:

```
EC2-DB Status:
[ ] MongoDB is running (test: docker ps on EC2-DB)
[ ] PostgreSQL is running
[ ] Redis is running
[ ] SSH connectivity to EC2-DB works

EC2-CORE Status:
[ ] Instance is running
[ ] SSH key is available
[ ] Security group allows SSH (port 22)
[ ] At least 20GB free disk space
[ ] Docker will be installed by script

Repository:
[ ] All files are committed and pushed
[ ] Main branch is up to date
[ ] deploy-ec2-core.sh exists and is accessible
```

---

## 🚀 Deployment Methods

### Method 1: Manual Script (RECOMMENDED ⭐)

#### 1.1 Connect to EC2-CORE
```bash
ssh -i your-key.pem ubuntu@13.216.12.61
```

If using Amazon Linux:
```bash
ssh -i your-key.pem ec2-user@13.216.12.61
```

#### 1.2 Download Deployment Script
```bash
wget https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/deploy-ec2-core.sh
chmod +x deploy-ec2-core.sh
```

#### 1.3 Review Script (Optional)
```bash
less deploy-ec2-core.sh
```

#### 1.4 Execute Deployment
```bash
bash deploy-ec2-core.sh
```

**What the script does:**
1. Detects OS (Ubuntu or Amazon Linux)
2. Installs Docker & Docker Compose
3. Creates deployment directory (`/opt/microservices`)
4. Clones/updates repository
5. Builds 3 Docker images:
   - micro-auth:latest
   - micro-estudiantes:latest
   - micro-maestros:latest
6. Creates docker-compose.yml with proper configuration
7. Starts all services
8. Validates deployment
9. Displays summary with useful commands

**Time estimate:** 15-20 minutes

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║       EC2-CORE MICROSERVICES DEPLOYMENT                ║
╚════════════════════════════════════════════════════════╝

📝 Configuration:
  → Deployment directory: /opt/microservices
  → EC2-CORE: 172.31.78.183
  → EC2-DB: 172.31.79.193

📁 Creating directories...
✅ Directories created

🧹 Cleaning old deployments...
✅ Old deployments cleaned

[... more output ...]

✅ Deployment completed successfully!

📊 Microservices Status:
  ✅ micro-auth (3000) - healthy
  ✅ micro-estudiantes (3001) - healthy
  ✅ micro-maestros (3002) - healthy
```

---

### Method 2: GitHub Actions Workflow

**Note:** Use this only if method 1 doesn't work

```bash
gh workflow run deploy-ec2-core.yml --ref main
```

Check workflow status:
```bash
gh run list --workflow deploy-ec2-core.yml --limit 1
```

View workflow output:
```bash
gh run view <run-id> --log
```

---

## ✅ Post-Deployment Validation

### Step 1: Verify Containers Running
```bash
docker ps -a
```

Expected output:
```
CONTAINER ID   IMAGE                      NAMES                STATUS
a1b2c3d4e5f6   micro-auth:latest         micro-auth          Up 2 minutes
b2c3d4e5f6g7   micro-estudiantes:latest  micro-estudiantes   Up 2 minutes
c3d4e5f6g7h8   micro-maestros:latest     micro-maestros      Up 2 minutes
```

**Must have:**
- 3 containers running
- Status shows "Up XXX"
- No containers in "Exited" state

### Step 2: Check Service Logs
```bash
# Auth service logs
docker logs micro-auth | tail -20

# Estudiantes service logs
docker logs micro-estudiantes | tail -20

# Maestros service logs
docker logs micro-maestros | tail -20
```

**Look for:**
- No error messages
- Database connection successful
- Service listening on correct port

### Step 3: Test Health Endpoints
```bash
# Auth service
curl http://localhost:3000/health

# Estudiantes service
curl http://localhost:3001/health

# Maestros service
curl http://localhost:3002/health
```

**Expected response (HTTP 200):**
```json
{
  "status": "ok"
}
```

### Step 4: Full Validation Script
Run this comprehensive validation:
```bash
#!/bin/bash

echo "🔍 EC2-CORE Validation Check"
echo ""

# Check containers
echo "1️⃣ Container Status:"
docker ps -a | grep -E "micro-auth|micro-estudiantes|micro-maestros"
echo ""

# Check health endpoints
echo "2️⃣ Health Endpoints:"
for service in auth estudiantes maestros; do
  echo -n "  $service: "
  curl -s http://localhost:300${i}/health || echo "❌ Failed"
done
echo ""

# Check docker-compose config
echo "3️⃣ Docker-Compose Configuration:"
wc -l /opt/microservices/docker-compose.yml
echo ""

# Check disk usage
echo "4️⃣ Disk Usage:"
df -h | grep -E "Filesystem|/dev/.*"
echo ""

echo "✅ Validation complete!"
```

---

## 🔗 Connection Strings

Use these from other EC2 instances in the VPC:

### Service Endpoints
```
Auth Service:         http://172.31.78.183:3000
Estudiantes Service:  http://172.31.78.183:3001
Maestros Service:     http://172.31.78.183:3002
```

### Database Connections (from microservices)
```
MongoDB:
  mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin

PostgreSQL:
  postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento

Redis:
  redis://:redis123@172.31.79.193:6379
```

---

## 📝 Configuration Files

### Docker Compose Configuration
Location: `/opt/microservices/docker-compose.yml`

Key configuration:
```yaml
version: '3.8'

services:
  micro-auth:
    image: micro-auth:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      POSTGRES_URL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanimiento
      REDIS_URL: redis://:redis123@172.31.79.193:6379
    networks:
      - core-net
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Similar configuration for micro-estudiantes and micro-maestros
```

---

## 🔧 Common Commands

### Service Management
```bash
# View all running services
docker-compose ps

# View logs for a service
docker-compose logs micro-auth -f

# Restart a specific service
docker-compose restart micro-auth

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Restart everything from scratch
docker-compose down && docker-compose up -d
```

### Debugging
```bash
# Execute command in container
docker exec micro-auth ls -la

# Interactive shell
docker exec -it micro-auth bash

# View environment variables
docker exec micro-auth env | grep -E "POSTGRES|REDIS|MONGO"

# Test database connectivity
docker exec micro-auth curl http://localhost:3000/health
```

### Cleanup
```bash
# Remove all containers and rebuild
docker-compose down --rmi all
docker-compose up -d

# Remove unused images
docker image prune -a

# Remove stopped containers
docker container prune

# View disk usage
docker system df
```

---

## 🚨 Troubleshooting

### Issue: Container exits immediately
```bash
# Check logs
docker logs micro-auth

# Common causes:
# 1. Port already in use
sudo lsof -i :3000

# 2. Environment variable not set
docker exec micro-auth env | grep POSTGRES_URL

# 3. Cannot connect to database
docker exec micro-auth ping 172.31.79.193
```

### Issue: "Cannot connect to database"
```bash
# Verify EC2-DB is running
# From EC2-CORE, try connecting to database directly
docker run --rm mongo:6 mongosh --host 172.31.79.193 --username admin --password mongodb123 --eval "db.adminCommand('ping')"

# Check network connectivity
ping 172.31.79.193
```

### Issue: "Docker command not found"
```bash
# Check if Docker is installed
which docker

# If not, reinstall
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: "Permission denied" when running docker
```bash
# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker ps
```

---

## 📚 Documentation Files

All documentation is available in the repository:

1. **EC2-CORE_DEPLOYMENT_REFERENCE.md** - Quick reference guide
2. **EC2-CORE_DEPLOYMENT_VALIDATION.md** - Detailed validation checklist
3. **deploy-ec2-core.sh** - Automated deployment script
4. **.github/workflows/deploy-ec2-core.yml** - GitHub Actions workflow
5. **MICROSERVICES_GUIDE.md** - Architecture documentation

---

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All 3 containers are running (`docker ps`)
- ✅ All health endpoints respond with 200 OK
- ✅ Services can connect to EC2-DB databases
- ✅ No error messages in container logs
- ✅ docker-compose.yml is properly configured
- ✅ Inter-service communication works

---

## ➡️ Next Steps

1. ✅ Deploy EC2-CORE (you are here)
2. Deploy EC2-API-Gateway tier
3. Deploy Frontend tier
4. System integration testing
5. Production readiness review

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs: `docker logs <container-name>`
3. Verify database connectivity from EC2-CORE
4. Check GitHub Actions workflow runs
5. Consult MICROSERVICES_GUIDE.md for architecture details

