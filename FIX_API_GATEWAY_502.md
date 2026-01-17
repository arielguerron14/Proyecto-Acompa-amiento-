# Fix API Gateway 502 Error - CORE_HOST Configuration

## Problem
API Gateway at `35.168.216.132:8080` was returning 502 Bad Gateway when trying to reach microservices.

**Root Cause**: The API Gateway was configured with Docker internal DNS names (`micro-auth:3000`), but the microservices are running on a different EC2 instance (EC2-CORE) and are not accessible via those DNS names.

**Error logs**:
```
[PROXY_ERROR] POST /register: getaddrinfo ENOTFOUND micro-auth
```

## Solution
Update the API Gateway to use the EC2-CORE instance's private IP address (`172.31.65.0`) instead of Docker DNS names.

## Changes Made

### 1. Updated `api-gateway/config/service-registry.js`
Changed the logic to:
- **If `CORE_HOST` is set**: Use it to connect to microservices (production in AWS)
- **If `CORE_HOST` is NOT set**: Fall back to Docker internal DNS names (development with docker-compose)

**Before**:
```javascript
const baseUrls = inDocker ? {
  auth: 'http://micro-auth:3000',  // ← Fails on separate instance
  ...
}
```

**After**:
```javascript
const baseUrls = coreHost ? {
  auth: `http://${coreHost}:3000`,  // ← Uses configured IP
  ...
} : {
  auth: 'http://micro-auth:3000',  // ← Fallback for local dev
  ...
}
```

### 2. Updated `deployment/scripts/deploy-api-gateway.sh`
Added `CORE_HOST` environment variable to the deployment:
```bash
CORE_HOST="172.31.65.0"  # EC2-CORE private IP within VPC
docker run -d --name api-gateway -p 8080:8080 \
  -e CORE_HOST=$CORE_HOST \
  -e NODE_ENV=production \
  --restart always $IMAGE
```

## Deployment Steps

### Via AWS Systems Manager (Recommended)

Execute these commands on EC2-API-Gateway:

```bash
echo "📥 Pulling Docker image..."
docker pull caguerronp/api-gateway:latest

echo "🛑 Stopping old container..."
docker stop api-gateway || true
docker rm api-gateway || true
sleep 2

echo "🚀 Starting new container with CORE_HOST..."
docker run -d --name api-gateway \
  -p 8080:8080 \
  -e CORE_HOST=172.31.65.0 \
  -e NODE_ENV=production \
  --restart always \
  caguerronp/api-gateway:latest

sleep 5

echo "🏥 Health check..."
curl -s http://localhost:8080/health 2>&1 | head -20

echo "📋 Verifying environment..."
docker exec api-gateway sh -c "echo CORE_HOST=\${CORE_HOST:-NOT_SET}"
```

### Via AWS CLI

```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --instance-ids "i-XXXXX" \  # Replace with EC2-API-Gateway instance ID
  --region "us-east-1" \
  --parameters 'commands=[
    "docker pull caguerronp/api-gateway:latest",
    "docker stop api-gateway || true",
    "docker rm api-gateway || true",
    "sleep 2",
    "docker run -d --name api-gateway -p 8080:8080 -e CORE_HOST=172.31.65.0 -e NODE_ENV=production --restart always caguerronp/api-gateway:latest",
    "sleep 5",
    "curl -s http://localhost:8080/health | head -20"
  ]'
```

## Verification

After deployment, verify the fix:

### 1. Check API Gateway health
```bash
curl http://35.168.216.132:8080/health
```

Expected output: Should return service health status

### 2. Test authentication endpoint
```bash
curl -X POST http://35.168.216.132:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

Expected: Should reach `micro-auth:3000` on EC2-CORE and return either success or a meaningful error (not 502)

### 3. Check container logs
```bash
docker logs api-gateway | tail -20
```

Expected: Should show successful proxy requests like:
```
[PROXY] POST /register → http://172.31.65.0:3000/register
```

### 4. Verify CORE_HOST is set
```bash
docker exec api-gateway sh -c 'echo "CORE_HOST=$CORE_HOST"'
```

Expected output:
```
CORE_HOST=172.31.65.0
```

## Network Details

- **API Gateway Instance**: EC2-API-Gateway (35.168.216.132 public, 172.31.64.195 private)
- **CORE Instance**: EC2-CORE (3.226.242.64 public, 172.31.65.0 private)
- **Connection**: Uses private IP (172.31.65.0) since both are in the same VPC
- **Microservices on CORE**:
  - micro-auth: port 3000
  - micro-estudiantes: port 3001
  - micro-maestros: port 3002

## Rollback

If there are issues after deployment, revert to the old container:

```bash
docker stop api-gateway
docker rm api-gateway
docker pull caguerronp/api-gateway:old  # or use the previous image tag
docker run -d --name api-gateway -p 8080:8080 --restart always caguerronp/api-gateway:old
```

## Related Configuration

The API Gateway proxy configuration is in:
- `api-gateway/config/service-registry.js` - Service endpoints and routing
- `api-gateway/index.js` - Proxy middleware setup
- `api-gateway/handlers/proxy.js` - Request forwarding logic

The `CORE_HOST` environment variable should be set during deployment. If not set, it will fall back to trying Docker internal DNS names.
