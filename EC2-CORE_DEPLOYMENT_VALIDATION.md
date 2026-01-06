# ✅ EC2-CORE Deployment Validation Checklist

## Pre-Deployment ✔️

### Prerequisites
- [ ] EC2-CORE instance is running and accessible
- [ ] Security group allows SSH (port 22)
- [ ] EC2-DB instance is running with all databases healthy
- [ ] SSH key pair available locally
- [ ] GitHub repository accessible

### Connection Verification
```bash
# Test SSH connectivity
ssh -i your-key.pem ubuntu@13.216.12.61

# Test database connectivity from EC2-CORE (once connected)
docker run --rm mongo:6 mongosh --host 172.31.79.193 --username admin --password mongodb123 --eval "db.adminCommand('ping')"
```

---

## Deployment Execution 🚀

### Option A: Manual Script Deployment

#### Step 1: Connect to EC2-CORE
```bash
ssh -i your-key.pem ubuntu@13.216.12.61
```

#### Step 2: Download Script
```bash
wget https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/deploy-ec2-core.sh
chmod +x deploy-ec2-core.sh
```

#### Step 3: Execute Script
```bash
bash deploy-ec2-core.sh
```

**Expected Output:**
- Directories created
- Old deployments cleaned
- Repository cloned/updated
- Docker images built (3 images)
- docker-compose.yml generated
- Services started
- Status validation

**Time estimate:** 15-20 minutes

---

## Post-Deployment Validation ✅

### Step 1: Verify Container Status
```bash
docker ps -a
```

**Expected Output:**
```
CONTAINER ID   IMAGE                      STATUS
xxxxx         micro-auth:latest          Up XX seconds
xxxxx         micro-estudiantes:latest   Up XX seconds
xxxxx         micro-maestros:latest      Up XX seconds
```

**Checklist:**
- [ ] 3 containers running
- [ ] All showing "Up XX seconds"
- [ ] No containers in "Exited" state
- [ ] No restart loops

### Step 2: Check Container Logs
```bash
# Auth service
docker logs micro-auth
# Should show: "✅ Server running on port 3000"

# Estudiantes service
docker logs micro-estudiantes
# Should show: "✅ Server running on port 3001"

# Maestros service
docker logs micro-maestros
# Should show: "✅ Server running on port 3002"
```

**Checklist:**
- [ ] No error messages in logs
- [ ] Each service shows "Server running on port XXXX"
- [ ] Database connections established (if logged)

### Step 3: Test Health Endpoints
```bash
# From EC2-CORE instance
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX"
}
```

**Checklist:**
- [ ] Auth service responds 200 OK
- [ ] Estudiantes service responds 200 OK
- [ ] Maestros service responds 200 OK

### Step 4: Verify Database Connectivity
```bash
# Check if services can connect to databases
docker exec micro-auth curl http://localhost:3000/health
docker exec micro-estudiantes curl http://localhost:3001/health
docker exec micro-maestros curl http://localhost:3002/health
```

**Checklist:**
- [ ] All services responding
- [ ] No connection errors in logs

### Step 5: Inspect Docker Compose Configuration
```bash
cat /opt/microservices/docker-compose.yml
```

**Should show:**
- [ ] All 3 services defined
- [ ] Correct ports (3000, 3001, 3002)
- [ ] Correct environment variables
- [ ] Correct database connection strings
- [ ] Health checks configured

### Step 6: Network Connectivity Test
```bash
# Test inter-service communication
docker exec micro-auth curl http://micro-estudiantes:3001/health
docker exec micro-estudiantes curl http://micro-maestros:3002/health
```

**Expected:** All requests return 200 OK

---

## Performance Checks 📊

### CPU and Memory Usage
```bash
docker stats
```

**Expected Behavior:**
- Memory usage: Each container ~50-150MB
- CPU: Minimal when idle

### Disk Space
```bash
df -h
docker system df
```

**Expected:**
- At least 10GB free space
- Docker images: ~1-2GB total

---

## Troubleshooting 🔧

### Issue: "docker command not found"
```bash
# Install Docker and Docker Compose
sudo yum install docker docker-compose  # Amazon Linux
# or
sudo apt-get install docker.io docker-compose  # Ubuntu
```

### Issue: Container exits immediately
```bash
# Check container logs
docker logs micro-auth

# Common causes:
# - Port already in use
# - Environment variable not set
# - Database connection failed
```

### Issue: Cannot connect to EC2-DB
```bash
# Test database connectivity
docker run --rm -it mongo:6 mongosh --host 172.31.79.193 --username admin --password mongodb123 --eval "db.adminCommand('ping')"

# Check network connectivity
ping 172.31.79.193
```

### Issue: GitHub workflow caching problems
Use manual script instead:
```bash
bash deploy-ec2-core.sh
```

---

## Service Endpoints

### Internal (from EC2-CORE)
- Auth: `http://localhost:3000`
- Estudiantes: `http://localhost:3001`
- Maestros: `http://localhost:3002`

### From other EC2 instances in VPC
- Auth: `http://172.31.78.183:3000`
- Estudiantes: `http://172.31.78.183:3001`
- Maestros: `http://172.31.78.183:3002`

---

## Database Connection Strings

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

## Useful Maintenance Commands

### View Configuration
```bash
cat /opt/microservices/docker-compose.yml
env | grep -E "MONGO|POSTGRES|REDIS"
```

### Service Management
```bash
# Restart a specific service
docker-compose restart micro-auth

# Restart all services
docker-compose restart

# View service logs
docker-compose logs -f micro-auth

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

### Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused volumes
docker volume prune
```

---

## Success Criteria ✨

Deploy is successful when:
1. ✅ All 3 containers are running
2. ✅ All health endpoints respond with 200 OK
3. ✅ Services can connect to EC2-DB databases
4. ✅ No error messages in logs
5. ✅ docker-compose.yml is properly configured
6. ✅ Inter-service communication works

---

## Next Steps

1. ✅ Deploy EC2-CORE (this checklist)
2. ➡️ Deploy EC2-API-Gateway
3. ➡️ Deploy Frontend
4. ➡️ System integration testing
5. ➡️ Production readiness review

