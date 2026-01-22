# EC2 Deployment Automation Summary

## ✅ Created Components

### 1️⃣ GitHub Actions Workflow
**File:** `.github/workflows/deploy-ec2-db.yml`

**Features:**
- ✓ SSH connection to EC2-DB instance
- ✓ SSH key from GitHub secrets (SSH_PRIVATE_KEY)
- ✓ Docker image building for MongoDB, PostgreSQL, Redis
- ✓ Service startup and verification
- ✓ Automated health checks for each database
- ✓ Deployment report generation
- ✓ Artifact upload for download

**Triggers:**
- Manual: `workflow_dispatch` with parameters
- Parameters:
  - `instance_ip`: EC2-DB instance IP address
  - `instance_name`: Instance name (default: EC2-DB)
  - `skip_verification`: Skip health checks (default: false)

**Execution Flow:**
1. Checkout repository
2. Setup SSH connection
3. Verify SSH connectivity
4. Detect instance configuration
5. Deploy and configure services
6. Health check - MongoDB
7. Health check - PostgreSQL
8. Health check - Redis
9. Final service status report
10. Generate and upload deployment report

---

### 2️⃣ Bash Deployment Script
**File:** `scripts/deploy-ec2-db.sh`

**Usage:**
```bash
./scripts/deploy-ec2-db.sh <EC2-DB-IP> [instance_name]
# Example: ./scripts/deploy-ec2-db.sh 10.0.1.50 EC2-DB
```

**Features:**
- ✓ Color-coded output (red, green, yellow, blue)
- ✓ Input validation
- ✓ SSH setup and verification
- ✓ Instance detection (hostname, IP, instance type, region)
- ✓ Complete service deployment
- ✓ Health checks with retries
- ✓ Deployment report generation
- ✓ Error handling and troubleshooting info

**Requirements:**
- SSH access to EC2-DB instance
- Private key at: `~/.ssh/id_rsa` (or set SSH_PRIVATE_KEY_PATH)
- SSH port 22 open in security group

---

### 3️⃣ Instance Service Mapper
**File:** `scripts/instance-service-mapper.sh`

**Usage:**
```bash
./scripts/instance-service-mapper.sh
```

**Output Generated:**
1. **Service Mapping**
   - EC2-DB → mongo, postgres, redis
   - EC2-API → api-gateway
   - EC2-CORE → micro-auth, micro-estudiantes, micro-maestros, micro-core, micro-soap-bridge
   - EC2-ANALYTICS → micro-analytics, micro-reportes-estudiantes, micro-reportes-maestros
   - EC2-MESSAGING → micro-messaging, micro-notificaciones
   - EC2-MONITORING → prometheus, grafana

2. **Deployment Plan** (`/tmp/deployment-plan.md`)
   - Detailed phase descriptions
   - Dependencies between phases
   - Network communication requirements
   - Environment configuration templates

3. **Environment Configs** (`/tmp/env-configs/`)
   - `.env.db` - Database credentials
   - `.env.api` - API Gateway configuration
   - `.env.core` - Core services configuration
   - `.env.analytics` - Analytics configuration
   - `.env.messaging` - Messaging configuration

4. **Communication Matrix** (`/tmp/service-communication.txt`)
   - Service-to-service communication
   - Read/Write/Metrics permissions
   - External API integrations

---

### 4️⃣ Comprehensive Documentation

#### EC2-DB Deployment Guide
**File:** `docs/EC2-DB-DEPLOYMENT.md`

**Sections:**
- Overview & Architecture
- Quick Start (3 deployment options)
- Configuration Details
- Health Checks (automatic & manual)
- Service Lifecycle
- Troubleshooting Guide
- Next Phases (EC2-API, EC2-CORE, etc.)
- Scaling Considerations
- Security Notes

#### Deployment Architecture
**File:** `docs/DEPLOYMENT-ARCHITECTURE.md`

**Sections:**
- Service Deployment Overview (visual diagrams)
- Deployment Workflow Sequence (all 6 phases)
- Service Communication Patterns
- Deployment Checklist
- Credential Management
- Quick Reference
- Performance Metrics

---

## 🎯 How to Use

### Option 1: GitHub Actions (Recommended for Production)

1. **Prepare EC2-DB Instance:**
   - Get instance IP from AWS console or Terraform output
   - Ensure security group allows SSH (port 22)
   - Ensure security group allows MongoDB (27017), PostgreSQL (5432), Redis (6380)

2. **Trigger Workflow:**
   ```
   Repository → Actions → Deploy EC2-DB Services
   Click: Run workflow
   Fill in:
     - instance_ip: <EC2-DB-IP>
     - instance_name: EC2-DB
     - skip_verification: false
   ```

3. **Monitor:**
   - Watch live logs in GitHub Actions
   - Download deployment report artifact when complete

4. **Verify:**
   - SSH to instance and run: `docker-compose ps`
   - All 3 services should show "Up"

---

### Option 2: Manual Bash Script

1. **Prepare:**
   ```bash
   cd Proyecto-Acompa-amiento-
   chmod +x scripts/deploy-ec2-db.sh
   ```

2. **Run:**
   ```bash
   ./scripts/deploy-ec2-db.sh <EC2-DB-IP> EC2-DB
   # Example: ./scripts/deploy-ec2-db.sh 10.0.1.50 EC2-DB
   ```

3. **Follow Output:**
   - Color-coded messages show progress
   - Automatic health checks validate deployment

---

### Option 3: Plan First, Then Deploy

1. **Generate Service Map:**
   ```bash
   chmod +x scripts/instance-service-mapper.sh
   ./scripts/instance-service-mapper.sh
   ```

2. **Review Generated Files:**
   - `/tmp/deployment-plan.md` - Full deployment phases
   - `/tmp/env-configs/` - Environment templates
   - `/tmp/service-communication.txt` - Communication matrix

3. **Deploy When Ready:**
   ```bash
   ./scripts/deploy-ec2-db.sh <EC2-DB-IP>
   ```

---

## 📊 Deployment Phases Summary

| Phase | Instance | Services | Duration | Dependencies |
|-------|----------|----------|----------|--------------|
| 1 | EC2-DB | MongoDB, PostgreSQL, Redis | ~2-3 min | None (blocking) |
| 2 | EC2-API | API Gateway | ~1 min | EC2-DB |
| 3 | EC2-CORE | Auth, Estudiantes, Maestros, Core, SOAP | ~2-3 min | EC2-DB |
| 4 | EC2-ANALYTICS | Analytics, Reports | ~2 min | EC2-DB |
| 5 | EC2-MESSAGING | Messaging, Notifications | ~1.5 min | EC2-DB |
| 6 | EC2-MONITORING | Prometheus, Grafana | ~1.5 min | All phases |

**Total Time:** ~8-12 minutes for full deployment

---

## 🔒 Security Features

✓ SSH private key stored as GitHub secret
✓ No hardcoded credentials in code
✓ Environment variables for sensitive data
✓ Default credentials marked for production changes
✓ Connection validation before deployment
✓ Health checks confirm service functionality

---

## 🛠️ Services Deployed on EC2-DB

### MongoDB
- **Port:** 27017
- **Authentication:** root:example
- **Volume:** mongo_data
- **Purpose:** NoSQL data storage, sessions, documents
- **Health Check:** `db.adminCommand('ping')`

### PostgreSQL
- **Port:** 5432
- **User:** postgres / Password: example
- **Database:** acompanamiento
- **Volume:** postgres_data
- **Purpose:** Relational data, structured records
- **Health Check:** `pg_isready`

### Redis
- **Port:** 6379 (internal) → 6380 (host)
- **Volume:** redis_data
- **Persistence:** RDB + AOF
- **Purpose:** Caching, sessions, real-time data
- **Health Check:** `redis-cli ping`

---

## 📝 Configuration Files

### Environment Variables (.env.db)
```
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
POSTGRES_USER=postgres
POSTGRES_PASSWORD=example
POSTGRES_DB=acompanamiento
REDIS_PASSWORD=
DOCKER_HOST=unix:///var/run/docker.sock
```

### Connection Strings (Internal)
```
MongoDB:   mongodb://root:example@mongo:27017
PostgreSQL: postgresql://postgres:example@postgres:5432/acompanamiento
Redis:     redis://redis:6379
```

### Connection Strings (Cross-Instance)
```
MongoDB:   mongodb://root:example@<EC2-DB-IP>:27017
PostgreSQL: postgresql://postgres:example@<EC2-DB-IP>:5432/acompanamiento
Redis:     redis://<EC2-DB-IP>:6380
```

---

## ✅ Verification Steps

After deployment, SSH to EC2-DB and run:

```bash
# Check all services running
docker-compose ps

# Test MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Test PostgreSQL
docker-compose exec postgres psql -U postgres -d acompanamiento -c "SELECT version();"

# Test Redis
docker-compose exec redis redis-cli ping

# View logs
docker-compose logs

# Check volumes
docker volume ls | grep -E "mongo|postgres|redis"

# Check network
docker network inspect core-net
```

---

## 🚀 Next Steps

1. **Deploy EC2-DB** (this phase)
   ```bash
   ./scripts/deploy-ec2-db.sh <EC2-DB-IP>
   ```

2. **Deploy EC2-API**
   ```bash
   ./scripts/deploy-ec2-api.sh <EC2-API-IP>
   ```

3. **Deploy EC2-CORE**
   ```bash
   ./scripts/deploy-ec2-core.sh <EC2-CORE-IP>
   ```

4. **Deploy EC2-Analytics, Messaging, Monitoring** (in parallel)

5. **Validate End-to-End**
   - Test via ALB DNS
   - Verify metrics in Prometheus
   - Check dashboards in Grafana

---

## 📞 Troubleshooting

### SSH Connection Issues
```bash
# Test connectivity
ping <EC2-DB-IP>
ssh -vvv ubuntu@<EC2-DB-IP>

# Check security group allows SSH (port 22)
# Check network ACLs allow SSH
# Verify key pair matches instance
```

### Docker Issues
```bash
# Check Docker status
systemctl status docker

# View Docker logs
journalctl -u docker -f

# Reset Docker
docker system prune -a
docker volume prune
```

### Database Connection Issues
```bash
# Check if containers are running
docker-compose ps

# View service logs
docker-compose logs mongo
docker-compose logs postgres
docker-compose logs redis

# Test connection from host
telnet localhost 27017    # MongoDB
telnet localhost 5432     # PostgreSQL
telnet localhost 6380     # Redis
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-ec2-db.yml` | GitHub Actions workflow |
| `scripts/deploy-ec2-db.sh` | Manual deployment script |
| `scripts/instance-service-mapper.sh` | Service mapping generator |
| `docs/EC2-DB-DEPLOYMENT.md` | EC2-DB deployment guide |
| `docs/DEPLOYMENT-ARCHITECTURE.md` | Full architecture & workflow |

---

**Created:** January 21, 2026
**Status:** ✅ Ready for deployment
**Next Action:** Run EC2-DB deployment with instance IP
