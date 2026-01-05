# 🚀 AWS Deployment Configuration - January 5, 2026

## 📊 Current EC2 Instances & Public IPs

| Instance | ID | Public IP | Service | Port(s) | Status |
|----------|----|-----------|---------|---------|----|
| **EC2-Notificaciones** | i-08afeaf9b54dca2ad | `34.226.244.81` | Notifications | 5006/5008 | ✅ Running |
| **EC2-DB** | i-0e6780a31c5abf480 | `98.84.26.109` | MongoDB, PostgreSQL, Redis | 27017/5432/6379 | ✅ Running |
| **EC2-CORE** | i-0b353cae374a257a5 | `100.24.118.233` | Auth, Estudiantes, Maestros | 3000/3001/3002 | ✅ Running |
| **EC2-Reportes** | i-02556f3271003e9d1 | `3.237.2.173` | Reporting Services | 5003/5004/5007 | ✅ Running |
| **EC2-Monitoring** | i-0c33cc7afc44e3013 | `3.227.251.203` | Prometheus, Grafana | 9090/3000 | ✅ Running |
| **EC2-Frontend** | i-0624e35a4b56fcf5b | `44.210.241.99` | Frontend Web | 80/3000 | ✅ Running |
| **EC2-Messaging** | i-0878ac1cdeb8a3bdb | `44.210.147.51` | Kafka, RabbitMQ, Zookeeper | 9092/5672/2181 | ✅ Running |
| **EC2-API-Gateway** | i-0aeb75c2af94e626d | `100.49.159.65` | API Gateway | 8080 | ✅ Running |

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (44.210.241.99:80)                                 │
│ User Registration/Login Interface                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ API GATEWAY (100.49.159.65:8080)                            │
│ Request Routing & Load Balancing                            │
└──────────┬──────────────────┬──────────────────┬────────────┘
           │                  │                  │
    ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ AUTH SVC   │ │ ESTUDIANTES│ │ MAESTROS   │
│ 3000       │ │ 3001       │ │ 3002       │
│ (100.24... │ │ (100.24... │ │ (100.24... │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │
      └──────────────┬──────────────┘
                     │
                     ▼
      ┌──────────────────────────────┐
      │  DATABASES (98.84.26.109)    │
      │  MongoDB, PostgreSQL, Redis  │
      │  27017, 5432, 6379           │
      └──────────────────────────────┘
```

## ✅ Active Workflows

### 1. **final-fix.yml** - Microservices Deployment
**Purpose**: Rebuild and restart microservices with correct configs
- **Target**: EC2-CORE (100.24.118.233)
- **Services**: Auth (3000), Estudiantes (3001), Maestros (3002)
- **Database**: EC2-DB (98.84.26.109)
- **Status**: ✅ Ready to run

### 2. **restart-api-gateway.yml** - API Gateway Deployment
**Purpose**: Restart API Gateway with correct microservice URLs
- **Target**: EC2-API-Gateway (100.49.159.65)
- **Microservices**: Route to 100.24.118.233:3000/3001/3002
- **Status**: ✅ Ready to run

## 🔧 How to Deploy/Fix Issues

### Step 1: Deploy Microservices
```bash
# Go to GitHub Actions
# Select: "FINAL FIX - Rebuild and Restart All Microservices"
# Click: "Run workflow"
# Wait: ~5-10 minutes
```

### Step 2: Deploy API Gateway
```bash
# Go to GitHub Actions
# Select: "Restart API Gateway with Public IPs"
# Click: "Run workflow"
# Wait: ~3-5 minutes
```

### Step 3: Test System
```bash
# Test Frontend
curl http://44.210.241.99

# Test API Gateway Health
curl http://100.49.159.65:8080/health

# Test User Registration
curl -X POST http://100.49.159.65:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@example.com","password":"123456","rol":"Estudiante"}'
```

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://44.210.241.99 | User registration & login |
| **API Gateway** | http://100.49.159.65:8080 | API endpoints |
| **Prometheus** | http://3.227.251.203:9090 | Metrics & monitoring |
| **Grafana** | http://3.227.251.203:3000 | Dashboards |

## 🔐 Database Credentials

Located in: `databases/docker-compose.yml`

| Database | Username | Password | Host | Port |
|----------|----------|----------|------|------|
| MongoDB | (none) | (none) | 98.84.26.109 | 27017 |
| PostgreSQL | postgres | example | 98.84.26.109 | 5432 |
| Redis | (none) | (none) | 98.84.26.109 | 6379 |

## 📋 Environment Variables by Service

### Microservices (EC2-CORE)
```bash
PORT=3000/3001/3002          # Service-specific
DB_HOST=98.84.26.109         # Database server
DB_USER=postgres/root        # DB username
DB_PASS=example/password     # DB password
REDIS_HOST=98.84.26.109      # Redis server
REDIS_PORT=6379              # Redis port
MONGO_URI=mongodb://98.84.26.109:27017/authdb
```

### API Gateway (EC2-API-Gateway)
```bash
PORT=8080                                    # Gateway port
AUTH_SERVICE_URL=http://100.24.118.233:3000
MAESTROS_SERVICE_URL=http://100.24.118.233:3002
ESTUDIANTES_SERVICE_URL=http://100.24.118.233:3001
```

## 🐛 Troubleshooting

### Problem: "Couldn't connect to server"
**Cause**: API Gateway can't reach microservices
**Solution**: 
1. Check IP addresses in final-fix.yml and restart-api-gateway.yml
2. Ensure microservices are running: `docker ps` on EC2-CORE
3. Re-run workflows in order: final-fix first, then restart-api-gateway

### Problem: "Authentication failed"
**Cause**: Database credentials or connectivity issue
**Solution**:
1. Verify DB_HOST, DB_USER, DB_PASS environment variables
2. SSH to EC2-DB and test: `docker exec postgres psql -U postgres -c "SELECT 1"`
3. Check container logs: `docker logs micro-auth`

### Problem: Frontend shows 503 Error
**Cause**: Microservices not responding or API Gateway down
**Solution**:
1. Test microservice health: `curl http://100.24.118.233:3000/health`
2. Test API Gateway: `curl http://100.49.159.65:8080/health`
3. Check logs on both instances

## 📈 Next Steps

1. ✅ Run **FINAL FIX** workflow to deploy microservices
2. ✅ Run **Restart API Gateway** workflow to update routing
3. ✅ Test user registration at http://44.210.241.99
4. ⏳ Deploy remaining services (Notificaciones, Reportes, Messaging) if needed
5. ⏳ Configure SSL/TLS certificates
6. ⏳ Set up monitoring alerts

---

**Last Updated**: January 5, 2026 (12:00 UTC)
**Configuration Status**: ✅ Ready for Deployment
