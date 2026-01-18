# 🚨 TROUBLESHOOTING: /auth/login Returns 500 & Endpoints Timeout

## Current Status

```
✅ Working:
   - API Gateway: 35.168.216.132:8080/health → 200 OK
   - micro-auth: /auth/health → 200 OK
   - Frontend: Loads correctly
   
❌ Not Working:
   - /auth/register → TIMEOUT (15+ seconds)
   - /auth/login → TIMEOUT (15+ seconds)
   - These endpoints never return
```

## Root Cause Analysis

The timeout indicates microservices are trying to connect to MongoDB but failing.

**Symptom**: `/health` works (no DB needed) but `/register` and `/login` timeout (need DB)

**Likely causes**:
1. ❌ MongoDB container exited on EC2-DB
2. ❌ MongoDB not binding to correct IP (172.31.65.122)
3. ❌ Network connectivity blocked between EC2-CORE and EC2-DB
4. ❌ Microservices don't have correct MONGODB_URI environment variable

## Solution Steps

### Step 1: SSH to EC2-DB to Check MongoDB

```bash
# From your local machine, SSH to Bastion first, then to EC2-DB
# Bastion IP: 54.91.218.98
# EC2-DB Private IP: 172.31.65.122
# EC2-DB Public IP: 44.192.33.182

# SSH Key: ssh-key-ec2.pem

ssh -i ssh-key-ec2.pem ec2-user@54.91.218.98  # Connect to Bastion
ssh -i ssh-key-ec2.pem ec2-user@172.31.65.122  # From Bastion, connect to DB
```

### Step 2: Check MongoDB Container Status

```bash
# Once SSH'd into EC2-DB:
docker ps -a | grep mongo

# Expected output: mongo container with status "Up"
# If not running, see Step 3
```

### Step 3: Check MongoDB Logs

```bash
docker logs mongo | tail -50

# Look for errors like:
# - "mongod shutdown complete"
# - "Address already in use"
# - Authentication failures
```

### Step 4: Restart MongoDB if Needed

```bash
# Stop and remove old container
docker stop mongo 2>/dev/null || true
docker rm mongo 2>/dev/null || true

# Remove volume if corrupted (WARNING: loses data)
# docker volume rm mongo_data 2>/dev/null || true

# Recreate MongoDB with correct settings
docker run -d --name mongo \
  -p 0.0.0.0:27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  -v mongo_data:/data/db \
  mongo:6.0 --auth --bind_ip_all

# Wait 10 seconds
sleep 10

# Verify it's running
docker ps | grep mongo
docker logs mongo | tail -10
```

### Step 5: SSH to EC2-CORE and Check Microservices

```bash
# SSH to EC2-CORE
# EC2-CORE Public IP: 3.236.220.99
# EC2-CORE Private IP: 172.31.65.0

ssh -i ssh-key-ec2.pem ec2-user@3.236.220.99
```

### Step 6: Verify Microservices Have Correct MongoDB URI

```bash
# Check environment variables in running containers
docker inspect micro-auth | grep -A 10 "Env"

# Should include:
# MONGODB_URI=mongodb://root:example@172.31.65.122:27017/auth?authSource=admin

# Or check container logs
docker logs micro-auth | grep -i "mongo\|connected\|error" | head -20
```

### Step 7: Restart Microservices if MongoDB URI Missing

```bash
# Stop old containers
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

# Restart with correct MongoDB URI
docker network create core-net 2>/dev/null || true

docker run -d --name micro-auth --network core-net \
  -p 3000:3000 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/auth?authSource=admin' \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-auth:latest

docker run -d --name micro-estudiantes --network core-net \
  -p 3001:3001 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/estudiantes?authSource=admin' \
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \
  -e PORT=3001 \
  -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-estudiantes:latest

docker run -d --name micro-maestros --network core-net \
  -p 3002:3002 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/maestros?authSource=admin' \
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \
  -e PORT=3002 \
  -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-maestros:latest

# Wait for containers to start
sleep 5

# Verify
docker ps | grep micro
docker logs micro-auth | tail -10
```

### Step 8: Test MongoDB Connection from Microservice

```bash
# SSH into micro-auth container
docker exec -it micro-auth /bin/sh

# Inside container, test MongoDB connection
mongosh 'mongodb://root:example@db-host:27017/auth?authSource=admin' --eval "db.adminCommand('ping')"

# Should return: { "ok": 1 }

# Exit container
exit
```

### Step 9: Test Auth Endpoints Again

```bash
# From local machine, test the endpoints

# Test Register
curl -X POST http://35.168.216.132:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'

# Should return 201 Created with user data

# Test Login  
curl -X POST http://35.168.216.132:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Should return 200 with JWT token
```

## Quick Reference: All 3 Microservices Restart Command

```bash
#!/bin/bash
set -e

echo "🔄 Restarting all microservices..."

# Stop
docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

# Network
docker network create core-net 2>/dev/null || true

# micro-auth
docker run -d --name micro-auth --network core-net -p 3000:3000 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/auth?authSource=admin' \
  -e PORT=3000 \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-auth:latest

# micro-estudiantes
docker run -d --name micro-estudiantes --network core-net -p 3001:3001 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/estudiantes?authSource=admin' \
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \
  -e PORT=3001 \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-estudiantes:latest

# micro-maestros
docker run -d --name micro-maestros --network core-net -p 3002:3002 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/maestros?authSource=admin' \
  -e AUTH_SERVICE_URL='http://micro-auth:3000' \
  -e PORT=3002 \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-maestros:latest

sleep 5
docker ps | grep micro
echo "✅ Microservices restarted!"
```

## Network Troubleshooting

If MongoDB is running but microservices still can't connect:

```bash
# Test connectivity from EC2-CORE to EC2-DB MongoDB
nc -zv 172.31.65.122 27017

# Should show: Connection successful!

# Check EC2 security groups allow port 27017 traffic
# AWS Console → EC2 → Security Groups → Check inbound rules
# Should allow: TCP 27017 from sg-xxxxx (CORE security group)

# Check MongoDB is actually listening
netstat -tlnp | grep 27017
# Or inside mongo container:
docker exec mongo netstat -tlnp | grep 27017
```

## If Still Not Working

1. **Check AWS Security Groups** - Verify EC2-CORE and EC2-DB are in same VPC and security groups allow communication
2. **MongoDB Credentials** - Ensure exact match: `root:example` and `?authSource=admin` in URI
3. **Restart All Services** - Kill all containers and docker daemon: `docker system prune -af && systemctl restart docker`
4. **Re-run Auto-Deploy Workflow** - GitHub Actions has the complete automation

## See Also

- Repository: c:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-
- API Gateway IP: 35.168.216.132:8080
- Frontend IP: 3.231.12.130:5500
- Bastion Jump Host: 54.91.218.98
