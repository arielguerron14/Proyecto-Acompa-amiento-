# 🔧 Frontend Fix - Troubleshooting & Manual Steps

## Problem

The frontend container is not accessible at `http://52.72.57.10:3000`. Error: **Connection Refused**

## Root Cause

The `docker-compose.ec2-frontend.yml` file was incorrectly configured with:
- ❌ Ports 80 and 443 (instead of 3000)
- ❌ Localhost API Gateway URL (doesn't work in production)

## Solution

### Option 1: Using AWS CLI (If you have AWS credentials configured)

```bash
# Set your AWS credentials
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Run the Python fix script
python3 fix-frontend-direct.py
```

### Option 2: Using SSH via Bastion

If you have the SSH private key:

```bash
# Run the Bash script (requires SSH key)
bash fix-frontend-bastion.sh
```

### Option 3: Manual SSH Commands

```bash
# Connect to Bastion first
ssh -i deployment.pem ec2-user@52.6.170.44

# From Bastion, SSH to Frontend (private network)
ssh -i /tmp/deployment.pem ec2-user@172.31.65.89

# Then on EC2-Frontend, run:
cd /tmp
docker stop frontend 2>/dev/null || true
docker rm frontend 2>/dev/null || true
docker rmi frontend-web:latest 2>/dev/null || true

# Download corrected docker-compose
curl -s https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/docker-compose.ec2-frontend.yml > docker-compose.yml

# Verify the configuration
grep -A2 'ports:' docker-compose.yml
# Should show:
#   ports:
#     - "3000:3000"

# Deploy
docker-compose up -d --no-build

# Verify
sleep 2
docker ps | grep frontend
docker logs frontend
```

### Option 4: AWS Systems Manager Session Manager (Recommended if SSM Agent is running)

```bash
# Find the instance ID
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-Frontend" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text

# Save the ID, then connect
aws ssm start-session --target i-048232c6d4879895f

# Then run the Docker commands above
```

## Expected Results After Fix

✅ Container should be running on port 3000
✅ Logs should show the application started successfully
✅ `docker ps | grep frontend` should show the container is UP
✅ `curl http://localhost:3000` should return HTML (from inside the container)
✅ External access: `http://52.72.57.10:3000` should work

## Verification

```bash
# Test from any terminal
curl http://52.72.57.10:3000

# Or open in browser
# http://52.72.57.10:3000
```

## If Still Failing

### Check Security Group

The EC2 security group must allow inbound traffic on port 3000:

```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*frontend*" \
  --query 'SecurityGroups[0].IpPermissions' \
  --output table
```

Should see port 3000 with 0.0.0.0/0 or your IP range.

### Check Docker Logs

```bash
# On the EC2 instance:
docker logs frontend
docker logs frontend --follow  # Follow in real-time
```

### Check Network Connectivity

```bash
# On the EC2 instance:
docker exec frontend curl http://localhost:3000
# Should return HTML

# From your local machine:
telnet 52.72.57.10 3000
# Or
nc -zv 52.72.57.10 3000
```

### Restart Docker

```bash
# On the EC2 instance:
systemctl restart docker
docker-compose up -d --no-build
```

## Environment Variables Configuration

The corrected `docker-compose.ec2-frontend.yml` now has:

```yaml
environment:
  NODE_ENV: production
  API_GATEWAY_URL: http://98.86.94.92:8080
  API_GATEWAY_HOST: 98.86.94.92
```

This allows the frontend to communicate with the API Gateway at `98.86.94.92:8080`.

## Next Steps After Frontend is Running

1. ✅ Test Frontend: `http://52.72.57.10:3000`
2. Test API Gateway: `http://98.86.94.92:8080/health`
3. Test Core API: `http://100.49.160.199:3001`
4. Test Analytics: `http://100.49.160.199:3004`
5. Test Monitoring: `http://54.205.158.101:3000` (Grafana)

---

**Questions?** Check the logs: `docker logs frontend`
