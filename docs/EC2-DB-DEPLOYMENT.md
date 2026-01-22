# EC2 Database Services Deployment Guide

## 📋 Overview

Este workflow automatiza el despliegue de servicios de base de datos (MongoDB, PostgreSQL, Redis) en la instancia EC2-DB. El flujo identifica la instancia, actualiza configuraciones, construye imágenes Docker y verifica que los servicios estén funcionando correctamente.

## 🏗️ Arquitectura

### EC2-DB Services
```
┌─────────────────────────────────────┐
│       EC2-DB Instance               │
├─────────────────────────────────────┤
│  Docker Network: core-net            │
├─────────────────────────────────────┤
│  ├─ MongoDB    (27017)              │
│  │  └─ Root authentication          │
│  │  └─ Persistent volume            │
│  │                                   │
│  ├─ PostgreSQL (5432)               │
│  │  └─ User: postgres               │
│  │  └─ Database: acompanamiento     │
│  │  └─ Persistent volume            │
│  │                                   │
│  ├─ Redis      (6379→6380)          │
│  │  └─ Persistence: RDB + AOF       │
│  │  └─ Persistent volume            │
│  │                                   │
│  └─ Networking                      │
│     └─ All services on core-net     │
│     └─ Accessible from other EC2s   │
└─────────────────────────────────────┘
```

### Service Communication
- **Internal:** mongo:27017, postgres:5432, redis:6379
- **Cross-Instance:** EC2-DB-IP:27017, EC2-DB-IP:5432, EC2-DB-IP:6380
- **All instances** connect to EC2-DB for data persistence

## 🚀 Quick Start

### Option 1: GitHub Actions Workflow (Recommended)

1. **Get EC2-DB Instance IP**
   ```bash
   # From AWS Console or:
   terraform output | grep EC2-DB
   # Or check .github/workflows/deploy-ec2-db.yml artifacts
   ```

2. **Trigger Workflow**
   - Go to: GitHub → Actions → "Deploy EC2-DB Services"
   - Click: "Run workflow"
   - Enter:
     - `instance_ip`: EC2-DB public/private IP
     - `instance_name`: EC2-DB (or your naming)
     - `skip_verification`: false (default)

3. **Monitor Execution**
   - Watch real-time logs in GitHub Actions
   - Logs show: SSH connection → deployment → health checks
   - Download artifact: `ec2-db-deployment-report`

### Option 2: Local Bash Script

1. **Setup SSH Key**
   ```bash
   # Ensure private key is accessible
   export SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
   chmod 600 ~/.ssh/id_rsa
   ```

2. **Run Deployment**
   ```bash
   cd Proyecto-Acompa-amiento-
   chmod +x scripts/deploy-ec2-db.sh
   ./scripts/deploy-ec2-db.sh <EC2-DB-IP> EC2-DB
   
   # Example:
   # ./scripts/deploy-ec2-db.sh 10.0.1.50 EC2-DB
   ```

3. **Monitor Output**
   - Color-coded logs show progress
   - Health checks validate each service
   - Final report confirms deployment success

### Option 3: Get Service Map (Planning)

1. **Generate Deployment Plan**
   ```bash
   chmod +x scripts/instance-service-mapper.sh
   ./scripts/instance-service-mapper.sh
   ```

2. **Review Output**
   - Service mapping per instance
   - Network communication matrix
   - Environment configuration templates
   - Deployment phases and dependencies

## 📝 Configuration Details

### Environment Variables (Set on EC2-DB)

**MongoDB**
```bash
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
MONGO_PORT=27017
MONGO_SERVICE_NAME=mongo
```

**PostgreSQL**
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=example
POSTGRES_DB=acompanamiento
POSTGRES_PORT=5432
POSTGRES_SERVICE_NAME=postgres
```

**Redis**
```bash
REDIS_PASSWORD=             # Empty for no auth
REDIS_PORT=6379
REDIS_HOST_PORT=6380        # Mapped port on host
REDIS_SERVICE_NAME=redis
```

### Connection Strings

**From Other Services (Internal Docker Network)**
```
MongoDB:   mongodb://root:example@mongo:27017
PostgreSQL: postgresql://postgres:example@postgres:5432/acompanamiento
Redis:     redis://redis:6379
```

**From Other EC2 Instances**
```
MongoDB:   mongodb://root:example@<EC2-DB-IP>:27017
PostgreSQL: postgresql://postgres:example@<EC2-DB-IP>:5432/acompanamiento
Redis:     redis://<EC2-DB-IP>:6380
```

### Storage Configuration

**Volumes**
- `mongo_data`: MongoDB data persistence
- `postgres_data`: PostgreSQL data persistence
- `redis_data`: Redis data persistence

**Location on EC2**
```bash
/var/lib/docker/volumes/
├── mongo_data
├── postgres_data
└── redis_data
```

## ✅ Health Checks

### Automatic Verification

The workflow automatically checks:

1. **MongoDB Connection**
   ```bash
   docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
   ```
   Expected: `{ ok: 1 }`

2. **PostgreSQL Connection**
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```
   Expected: `accepting connections`

3. **Redis Connection**
   ```bash
   docker-compose exec redis redis-cli ping
   ```
   Expected: `PONG`

### Manual Verification (After Deployment)

```bash
# SSH into EC2-DB
ssh -i ~/.ssh/id_rsa ubuntu@<EC2-DB-IP>
cd ~/projeto-acompanimiento

# Check Docker services
docker-compose ps

# MongoDB test
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# PostgreSQL test
docker-compose exec postgres psql -U postgres -d acompanamiento -c "SELECT version();"

# Redis test
docker-compose exec redis redis-cli INFO server

# Network test (from another EC2)
telnet <EC2-DB-IP> 27017
telnet <EC2-DB-IP> 5432
telnet <EC2-DB-IP> 6380
```

## 🔄 Service Lifecycle

### Startup Sequence
1. EC2 instance boots
2. Docker daemon starts
3. Repository cloned
4. docker-compose build (if needed)
5. Services start in order:
   - MongoDB (needs time to initialize)
   - PostgreSQL (waits for startup)
   - Redis (quick startup)
6. Health checks run (30-60 seconds)
7. Services ready for connections

### Graceful Shutdown
```bash
# From EC2-DB instance
docker-compose down

# With volume cleanup (if needed)
docker-compose down -v

# Specific service
docker-compose stop mongo
docker-compose stop postgres
docker-compose stop redis
```

### Service Restart
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart mongo
docker-compose restart postgres
docker-compose restart redis

# Rebuild and restart
docker-compose up -d --build
```

## 🛠️ Troubleshooting

### Common Issues

**Issue: SSH Connection Timeout**
```bash
# Solution: Check security group
# - Verify EC2-DB security group allows inbound SSH (port 22)
# - Check network ACLs
# - Verify key pair matches instance

# Test connectivity
ping <EC2-DB-IP>
ssh -vvv ubuntu@<EC2-DB-IP>  # Verbose output
```

**Issue: Docker Not Installed**
```bash
# Workflow auto-installs Docker, but if manual:
ssh ubuntu@<EC2-DB-IP>
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker ubuntu
```

**Issue: Port Already in Use**
```bash
# Check what's using the port
sudo lsof -i :27017   # MongoDB
sudo lsof -i :5432    # PostgreSQL
sudo lsof -i :6379    # Redis

# Stop existing containers
docker-compose down -v
docker system prune -a
```

**Issue: Database Connection Refused**
```bash
# Check if container is running
docker-compose ps

# Check logs
docker-compose logs mongo
docker-compose logs postgres
docker-compose logs redis

# Verify network
docker network ls
docker network inspect core-net

# Test from container
docker-compose exec mongo mongosh
docker-compose exec postgres psql -U postgres
docker-compose exec redis redis-cli
```

**Issue: Persistence Not Working**
```bash
# Check volumes
docker volume ls
docker volume inspect <volume-name>

# Verify volume mount
docker inspect <container-id> | grep -A 10 Mounts

# Recreate volumes
docker-compose down -v
docker-compose up -d
```

### Debugging Commands

```bash
# View complete logs
docker-compose logs --tail=100

# Specific service logs
docker-compose logs mongo --follow
docker-compose logs postgres --follow
docker-compose logs redis --follow

# Check resource usage
docker stats

# Inspect network
docker network inspect core-net

# Check container details
docker inspect mongo
docker inspect postgres
docker inspect redis
```

## 📊 Next Phases

After EC2-DB is successfully deployed:

### Phase 2: Deploy EC2-API
```bash
./scripts/deploy-ec2-api.sh <EC2-API-IP>
```
Services: API Gateway → Depends on EC2-DB

### Phase 3: Deploy EC2-CORE
```bash
./scripts/deploy-ec2-core.sh <EC2-CORE-IP>
```
Services: Auth, Estudiantes, Maestros, Core → Depends on EC2-DB

### Phase 4: Deploy EC2-Analytics
```bash
./scripts/deploy-ec2-analytics.sh <EC2-ANALYTICS-IP>
```
Services: Analytics, Reports → Depends on EC2-DB

### Phase 5: Deploy EC2-Messaging
```bash
./scripts/deploy-ec2-messaging.sh <EC2-MESSAGING-IP>
```
Services: Messaging, Notifications → Depends on RabbitMQ

### Phase 6: Deploy EC2-Monitoring
```bash
./scripts/deploy-ec2-monitoring.sh <EC2-MONITORING-IP>
```
Services: Prometheus, Grafana → Depends on all services

## 📈 Scaling Considerations

### Multi-Region Deployment
- Replicate EC2-DB across regions for disaster recovery
- Use RDS instead of Docker for managed databases
- Configure cross-region replication

### High Availability
- Multi-AZ deployment for each service tier
- Load balancers for each service group
- Automated failover configurations

### Database Replication
```bash
# MongoDB Replica Set
# PostgreSQL Streaming Replication
# Redis Sentinel (for high availability)
```

## 🔐 Security Notes

- Change default passwords in production
- Use AWS Secrets Manager for credentials
- Enable encryption in transit (TLS/SSL)
- Configure database authentication per environment
- Restrict inbound traffic to specific security groups

## 📞 Support

For issues:
1. Check logs: `docker-compose logs`
2. Review deployment report: GitHub Actions artifacts
3. Verify network connectivity: `telnet <IP> <PORT>`
4. Test services individually before full integration
5. Use verbose SSH output: `ssh -vvv`

---

**Last Updated:** 2024
**Workflow Status:** ✅ Ready for EC2-DB deployment
