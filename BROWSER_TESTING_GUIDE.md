# 🌐 Testing the Project - Browser Access Guide

## Current Infrastructure Status

✅ **Infrastructure**: Deployed and Running
✅ **Configuration**: Auto-discovered and Updated  
✅ **Services**: Ready for manual deployment

## Option 1: Direct Access via Public IPs (Recommended)

### Access Points

Once services are deployed, you can access them via:

#### **Frontend**
```
http://[EC2-FRONTEND-PUBLIC-IP]:3000
```

#### **API Gateway**
```
http://[EC2-API-GATEWAY-PUBLIC-IP]:8080
```

#### **Core Services**
```
http://[EC2-CORE-PUBLIC-IP]:3000
```

### Current Public IPs from Infrastructure

Check your latest deployment by running:
```bash
gh run list --workflow=discover-and-update.yml --limit 1
cat infrastructure-instances.config.js
```

## Option 2: Access via Load Balancer (ALB)

### ALB Endpoint
The Application Load Balancer provides unified access:

```
http://[ALB-DNS-NAME]/
```

To get the ALB DNS:
```bash
aws elbv2 describe-load-balancers \
  --names lab-alb \
  --query 'LoadBalancers[].DNSName' \
  --output text
```

## Option 3: Local Testing with Docker Compose

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed

### Steps to Deploy Locally

1. **Clone and Setup**
   ```bash
   cd Proyecto-Acompa-amiento-
   npm install  # if needed
   ```

2. **Deploy Core Service Locally**
   ```bash
   docker-compose -f docker-compose.core.yml up -d
   ```

3. **Deploy API Gateway**
   ```bash
   docker-compose -f docker-compose.api-gateway.yml up -d
   ```

4. **Deploy Frontend**
   ```bash
   docker-compose -f docker-compose.frontend.yml up -d
   ```

5. **Access Locally**
   - Frontend: `http://localhost:3000`
   - API Gateway: `http://localhost:8080`
   - Core Services: `http://localhost:3001`

### View Logs
```bash
docker-compose -f docker-compose.core.yml logs -f
docker-compose -f docker-compose.api-gateway.yml logs -f
docker-compose -f docker-compose.frontend.yml logs -f
```

## Option 4: SSH Access via Bastion

### Prerequisites
- SSH key configured
- Bastion instance running
- Security group allows SSH (port 22)

### Steps

1. **SSH to Bastion**
   ```bash
   ssh -i ~/.ssh/bastion_key.pem ubuntu@[BASTION-PUBLIC-IP]
   ```

2. **From Bastion, SSH to EC2 Instance**
   ```bash
   ssh -i ~/.ssh/internal_key.pem ubuntu@[EC2-PRIVATE-IP]
   ```

3. **Deploy Service on Instance**
   ```bash
   cd /home/ubuntu/Proyecto-Acompa-amiento-
   docker-compose -f docker-compose.core.yml up -d
   ```

4. **Check Service Health**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:8080/health
   ```

## Service Health Check URLs

Once deployed, check service status:

### Core Service
```
GET http://[SERVICE-IP]:3000/health
```

### API Gateway
```
GET http://[SERVICE-IP]:8080/health
GET http://[SERVICE-IP]:8080/api/health
```

### Frontend
```
GET http://[SERVICE-IP]:80/health
GET http://[SERVICE-IP]:3000/health
```

### Database Service
```
PostgreSQL: postgresql://[DB-IP]:5432/acompanamiento
```

## Environment Variables for Testing

The `.env.generated` file contains all necessary environment variables:

```bash
cat .env.generated
```

Key variables:
- `FRONTEND_PRIVATE` - Frontend private IP
- `API_PRIVATE` - API Gateway private IP
- `CORE_PRIVATE` - Core service private IP
- `DB_PRIVATE` - Database private IP
- `DATABASE_HOST` - Database connection host
- `DATABASE_PORT` - Database connection port
- `DATABASE_URL` - Full database connection string

## Troubleshooting

### Services Not Accessible

1. **Check AWS Instances**
   ```bash
   aws ec2 describe-instances \
     --filters "Name=tag:Project,Values=lab-8-ec2" \
     --query 'Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress]'
   ```

2. **Check Security Group**
   ```bash
   aws ec2 describe-security-groups \
     --group-names lab-web-sg \
     --query 'SecurityGroups[].IpPermissions'
   ```

3. **Test Connectivity**
   ```bash
   # From your local machine
   curl -v http://[INSTANCE-IP]:3000
   
   # From Bastion
   ssh -i ~/.ssh/bastion_key.pem ubuntu@[BASTION-IP]
   curl http://[INSTANCE-PRIVATE-IP]:3000
   ```

### Docker Compose Issues

1. **Check Logs**
   ```bash
   docker-compose -f docker-compose.core.yml logs
   ```

2. **Rebuild Containers**
   ```bash
   docker-compose -f docker-compose.core.yml build --no-cache
   docker-compose -f docker-compose.core.yml up -d
   ```

3. **Check Port Conflicts**
   ```bash
   docker ps
   docker port [CONTAINER-ID]
   ```

### Database Connection Issues

1. **Verify Database is Running**
   ```bash
   docker-compose -f docker-compose.infrastructure.yml ps
   ```

2. **Test Connection**
   ```bash
   psql -h [DB-IP] -U user -d acompanamiento -c "SELECT 1"
   ```

3. **Check Network**
   ```bash
   docker network ls
   docker network inspect [NETWORK-NAME]
   ```

## Automated Testing

### Health Check Script

Run the health check script to verify all services:

```bash
bash scripts/verify-deployment-health.sh
```

### Collect Logs

Gather logs from all services:

```bash
bash scripts/collect-deployment-logs.sh
```

## Browser Testing Checklist

- [ ] Frontend loads at http://[INSTANCE-IP]:3000
- [ ] API Gateway responds at http://[INSTANCE-IP]:8080/health
- [ ] Core services accessible at http://[INSTANCE-IP]:3000
- [ ] Database connections work (check logs)
- [ ] Inter-service communication working
- [ ] Authentication service responding
- [ ] Load Balancer distributing traffic
- [ ] Health endpoints returning 200 OK

## Getting Latest IP Addresses

To ensure you have the latest IPs:

```bash
# Run IP discovery workflow
gh workflow run discover-and-update.yml

# Wait for completion
sleep 45

# View current configuration
cat infrastructure-instances.config.js
cat .env.generated
```

## Next Steps

1. **Get Latest IPs**
   ```bash
   gh workflow run discover-and-update.yml
   ```

2. **Deploy Services** (choose one)
   - Local: `docker-compose up -d`
   - Via SSH: SSH to instance and deploy
   - Via Bastion: SSH jump to instance and deploy

3. **Test in Browser**
   - Use public IP address of instance
   - Or use ALB DNS name
   - Check service health endpoints

4. **Monitor Services**
   ```bash
   docker-compose logs -f
   aws ec2 describe-instances  # Check status
   ```

---

**Last Updated**: 2026-01-14  
**Status**: Infrastructure Ready, Awaiting Service Deployment  
**Next Action**: Deploy services, then access via browser
