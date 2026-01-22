# 🚀 EC2 Deployment Architecture & Workflow

## 📊 Service Deployment Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AWS Infrastructure                                 │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         ALB (Load Balancer)                          │  │
│  │                      (HTTP: 80, HTTPS: 443)                          │  │
│  └──────────────┬─────────────────────────────────────────────────────┬─┘  │
│                 │                                                      │     │
│    ┌────────────┴─────────────────────────────────────────────────────┴──┐ │
│    │                     VPC: core-net (Default)                         │ │
│    │                                                                      │ │
│    ├─ ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │ │
│    │  │    EC2-DB        │  │    EC2-API       │  │   EC2-CORE       │ │ │
│    │  │  (t3.small)      │  │  (t3.small)      │  │  (t3.small)      │ │ │
│    │  │                  │  │                  │  │                  │ │ │
│    │  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │ │ │
│    │  │ │  MongoDB     │ │  │ │ api-gateway  │ │  │ │ micro-auth   │ │ │ │
│    │  │ │  :27017      │ │  │ │ :3000        │ │  │ │ :5000        │ │ │ │
│    │  │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │ │ │
│    │  │                  │  │     Routes:      │  │                  │ │ │
│    │  │ ┌──────────────┐ │  │  • /auth    →    │  │ micro-estudian │ │ │ │
│    │  │ │ PostgreSQL   │ │  │  • /estudiantes  │  │ :5001          │ │ │ │
│    │  │ │ :5432        │ │  │  • /maestros     │  │                  │ │ │
│    │  │ └──────────────┘ │  │  • /reportes     │  │ micro-maestros │ │ │ │
│    │  │                  │  │  • /analytics    │  │ :5002          │ │ │ │
│    │  │ ┌──────────────┐ │  │  • /messaging    │  │                  │ │ │
│    │  │ │  Redis       │ │  │                  │  │ micro-core     │ │ │ │
│    │  │ │ :6379→6380   │ │  │                  │  │ :5003          │ │ │ │
│    │  │ └──────────────┘ │  │                  │  │                  │ │ │
│    │  │                  │  │                  │  │ micro-soap-br  │ │ │ │
│    │  │ Network:         │  │  Network:        │  │ :5004          │ │ │ │
│    │  │ core-net         │  │  core-net        │  │                  │ │ │
│    │  │                  │  │                  │  │ Network:       │ │ │ │
│    │  │ Volumes:         │  │                  │  │ core-net       │ │ │ │
│    │  │ • mongo_data     │  │                  │  │                  │ │ │
│    │  │ • postgres_data  │  │                  │  │ Volumes:       │ │ │ │
│    │  │ • redis_data     │  │                  │  │ • shared-vol   │ │ │
│    │  │                  │  │                  │  │                  │ │ │
│    │  └──────────────────┘  └──────────────────┘  └──────────────────┘ │ │
│    │         ▲                      │                      │              │ │
│    │         │                      │                      │              │ │
│    │         └──────────────────────┼──────────────────────┘              │ │
│    │         Connected via core-net bridge network                        │ │
│    │                                                                      │ │
│    └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Deployment Workflow Sequence

```
PHASE 1: DATABASE SERVICES (EC2-DB) [BLOCKING - ALL DEPEND ON THIS]
═════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ Trigger: GitHub Actions → deploy-ec2-db.yml                    │
│          OR Manual: ./scripts/deploy-ec2-db.sh <IP>             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Instance Detection                                      │
│ ├─ Identify EC2-DB instance                                    │
│ ├─ Retrieve SSH keys (GitHub secret: SSH_PRIVATE_KEY)          │
│ ├─ Verify network connectivity (SSH port 22)                   │
│ └─ Confirm instance status                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Environment Configuration                               │
│ ├─ Create .env.db with credentials                             │
│ ├─ Set Docker network: core-net                                │
│ ├─ Configure volume mounts                                      │
│ └─ Prepare docker-compose configuration                         │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Docker Setup & Build                                    │
│ ├─ Install Docker (if needed)                                   │
│ ├─ Clone/update repository                                      │
│ ├─ docker-compose build mongo   [17.9s]                        │
│ ├─ docker-compose build postgres [45s]                         │
│ ├─ docker-compose build redis   [8s]                           │
│ └─ Total build time: ~70 seconds                                │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Service Deployment                                      │
│ ├─ Stop existing services: docker-compose down -v              │
│ ├─ Start services: docker-compose up -d mongo postgres redis   │
│ ├─ Wait for initialization: 30 seconds                          │
│ └─ Verify: docker-compose ps                                    │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Health Verification                                     │
│ ├─ MongoDB:   mongosh --eval "db.adminCommand('ping')"          │
│ ├─ PostgreSQL: pg_isready -U postgres                           │
│ ├─ Redis:    redis-cli ping                                     │
│ └─ Retries: 10 attempts × 3 seconds = 30 seconds max            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
    ✅ SUCCESS!
    All database services running
    Ready for Phase 2-6 deployment


PHASE 2: API GATEWAY (EC2-API) [DEPENDS ON PHASE 1]
════════════════════════════════════════════════════

    deploy-ec2-api.yml
         │
         ├─ Verify EC2-DB connectivity (mongo:27017, postgres:5432)
         ├─ Build api-gateway image
         ├─ Start api-gateway service
         ├─ Configure routes to microservices
         └─ Health check: curl http://localhost:3000/health


PHASE 3: CORE SERVICES (EC2-CORE) [DEPENDS ON PHASE 1]
════════════════════════════════════════════════════════

    deploy-ec2-core.yml
         │
         ├─ Build images:
         │  ├─ micro-auth (5000)
         │  ├─ micro-estudiantes (5001)
         │  ├─ micro-maestros (5002)
         │  ├─ micro-core (5003)
         │  └─ micro-soap-bridge (5004)
         │
         ├─ Start all services
         └─ Health checks for each service


PHASE 4: ANALYTICS SERVICES (EC2-ANALYTICS) [DEPENDS ON PHASE 1]
═════════════════════════════════════════════════════════════════

    deploy-ec2-analytics.yml
         │
         ├─ Build images:
         │  ├─ micro-analytics (5007)
         │  ├─ micro-reportes-estudiantes (5008)
         │  └─ micro-reportes-maestros (5009)
         │
         ├─ Start all services
         └─ Health checks for each service


PHASE 5: MESSAGING SERVICES (EC2-MESSAGING) [DEPENDS ON PHASE 1]
═════════════════════════════════════════════════════════════════

    deploy-ec2-messaging.yml
         │
         ├─ Build images:
         │  ├─ micro-messaging (5005)
         │  └─ micro-notificaciones (5006)
         │
         ├─ Start services
         ├─ Connect to message broker (RabbitMQ/Kafka)
         └─ Health checks


PHASE 6: MONITORING (EC2-MONITORING) [DEPENDS ON ALL PHASES]
═════════════════════════════════════════════════════════════

    deploy-ec2-monitoring.yml
         │
         ├─ Deploy Prometheus (9090)
         │  └─ Configure scrape targets (all services)
         │
         ├─ Deploy Grafana (3001)
         │  └─ Connect Prometheus data source
         │
         └─ Setup alerts & dashboards
```

## 🔌 Service Communication Patterns

### Database Access from All Services
```
┌──────────────────────┐
│   Any EC2 Instance   │
│ (API, CORE, etc)     │
└──────────┬───────────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │   Service Code (Node.js)             │
    │                                      │
    │  const mongo = require('mongodb');   │
    │  // Connection:                      │
    │  // If same instance: mongo:27017    │
    │  // If cross-instance:               │
    │  //   <EC2-DB-IP>:27017              │
    └──────────┬───────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        │             │          │
        ▼             ▼          ▼
    ┌────────┐  ┌──────────┐  ┌───────┐
    │ MongoDB│  │PostgreSQL│  │ Redis │
    │:27017  │  │  :5432   │  │:6379  │
    └────────┘  └──────────┘  └───────┘
    (EC2-DB)    (EC2-DB)      (EC2-DB)
```

### Inter-Service Communication
```
┌─────────────────┐
│  API Gateway    │
│    (3000)       │
└────────┬────────┘
         │
    ┌────┴────┬────────┬─────────────┐
    │         │        │             │
    ▼         ▼        ▼             ▼
┌────────┐┌──────────┐┌────────┐┌──────────────┐
│ Auth   ││Estudiantes││Maestros││ Reportes    │
│(5000)  ││  (5001)  ││ (5002) ││   (5008,09) │
└────────┘└──────────┘└────────┘└──────────────┘
    │         │        │             │
    └─────────┴────────┴─────────────┘
             │
        ┌────┴─────┐
        ▼          ▼
    ┌────────┐ ┌──────────┐
    │ Mongo  │ │PostgreSQL│
    └────────┘ └──────────┘
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Terraform has deployed EC2 instances
- [ ] EC2 instances are running and have public/private IPs
- [ ] SSH key (SSH_PRIVATE_KEY) stored in GitHub secrets
- [ ] AWS security groups allow:
  - [ ] SSH (port 22) from deployment IP
  - [ ] MongoDB (27017) from other EC2s
  - [ ] PostgreSQL (5432) from other EC2s
  - [ ] Redis (6380) from other EC2s
  - [ ] API Gateway (3000) from ALB
- [ ] Docker is available on the instance (auto-installed by workflow)

### Phase 1: EC2-DB Deployment
- [ ] Get EC2-DB instance IP from Terraform output or AWS console
- [ ] Trigger `deploy-ec2-db.yml` workflow with instance IP
- [ ] Monitor workflow execution in GitHub Actions
- [ ] Verify services running: `docker-compose ps`
- [ ] Test MongoDB: `docker-compose exec mongo mongosh --eval "db.version()"`
- [ ] Test PostgreSQL: `docker-compose exec postgres psql -U postgres -c "SELECT version();"`
- [ ] Test Redis: `docker-compose exec redis redis-cli ping`

### Phase 2+: Additional Services
- [ ] Verify EC2-DB connectivity from other instances
- [ ] Trigger subsequent workflows (EC2-API, EC2-CORE, etc)
- [ ] Monitor cross-instance communication
- [ ] Verify ALB routing to services

### Post-Deployment Validation
- [ ] All services responding to health checks
- [ ] Prometheus collecting metrics from all services
- [ ] Grafana dashboards displaying metrics
- [ ] Alerts configured and testing
- [ ] Backup procedures validated
- [ ] Log aggregation working

## 🔐 Credential Management

```
GitHub Secrets (Used by Workflows)
├─ AWS_ACCESS_KEY_ID          → Terraform authentication
├─ AWS_SECRET_ACCESS_KEY       → Terraform authentication
├─ AWS_SESSION_TOKEN           → Terraform authentication (temp)
└─ SSH_PRIVATE_KEY             → EC2 SSH access

Environment Variables (Set on EC2 Instances)
├─ MONGO_INITDB_ROOT_USERNAME  = root
├─ MONGO_INITDB_ROOT_PASSWORD  = example
├─ POSTGRES_USER               = postgres
├─ POSTGRES_PASSWORD           = example
├─ POSTGRES_DB                 = acompanamiento
└─ REDIS_PASSWORD              = (empty)

Instance Storage
├─ ~/.ssh/id_rsa               ← SSH private key (from secret)
└─ ~/projeto-acompanimiento/   ← Repository clone
```

## 📞 Quick Reference

### Trigger EC2-DB Deployment
```bash
# Via GitHub Actions
# Go to: Actions → Deploy EC2-DB Services → Run workflow
# Input: instance_ip = <EC2-DB-IP>

# Via CLI
cd Proyecto-Acompa-amiento-
chmod +x scripts/deploy-ec2-db.sh
./scripts/deploy-ec2-db.sh <EC2-DB-IP> EC2-DB
```

### Monitor Deployment
```bash
# SSH to instance
ssh -i ~/.ssh/id_rsa ubuntu@<EC2-DB-IP>

# Check containers
docker-compose ps

# View logs
docker-compose logs -f

# Test services
docker-compose exec mongo mongosh
docker-compose exec postgres psql -U postgres
docker-compose exec redis redis-cli
```

### Rollback
```bash
# Stop services
docker-compose down

# Remove volumes (if needed)
docker-compose down -v

# Restart services
docker-compose up -d
```

## 📊 Performance Metrics

| Phase | Service | Build Time | Startup Time | Health Check |
|-------|---------|------------|--------------|--------------|
| 1 | MongoDB | 17.9s | 15-20s | 3-5s |
| 1 | PostgreSQL | 45s | 10-15s | 2-3s |
| 1 | Redis | 8s | 2-3s | 1s |
| 2 | API Gateway | 25s | 5s | 3s |
| 3 | Micro-Auth | 20s | 5s | 3s |
| 3 | Micro-Estudiantes | 22s | 5s | 3s |

**Total Deployment Time (All Phases):** ~8-12 minutes

---

**Next Step:** Run deployment for EC2-DB instance
**Files:**
- Workflow: `.github/workflows/deploy-ec2-db.yml`
- Script: `scripts/deploy-ec2-db.sh`
- Guide: `docs/EC2-DB-DEPLOYMENT.md`
