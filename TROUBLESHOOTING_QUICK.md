# 🔧 QUICK TROUBLESHOOTING GUIDE

## Common Issues & Solutions

### 🚨 Issue: Deployment Fails - "Connection timed out"

**Symptoms**:
```
ssh: connect to host X port 22: Connection timed out
Error: Failed to connect to EC2 instance
```

**Possible Causes**:
1. EC2 instance is stopped or terminated
2. Security group doesn't allow inbound SSH (port 22)
3. Network route to bastion is broken
4. Bastion instance is down

**Fix Steps**:

```bash
# 1. Check instance status
aws ec2 describe-instances --instance-ids <INSTANCE_ID> \
  --region us-east-1 | grep State

# 2. Check security group allows SSH
aws ec2 describe-security-groups \
  --group-ids <SECURITY_GROUP_ID> \
  --region us-east-1 | grep -A5 "IpPermissions"

# 3. Verify bastion is reachable
ping 52.6.170.44

# 4. Test SSH to bastion directly
ssh ubuntu@52.6.170.44

# 5. From bastion, test route to target instance
ssh -i <KEY_PATH> ubuntu@52.6.170.44
ping 172.31.X.X  # Replace with target IP

# 6. If bastion is down, restart it via AWS Console
aws ec2 start-instances --instance-ids i-0g7h8i9j0k1l2m3n --region us-east-1
```

---

### 🚨 Issue: Deployment Fails - "Host key verification failed"

**Symptoms**:
```
Host key verification failed
ssh: connect to host X port 22: Operation refused
```

**Possible Causes**:
1. Known hosts file issue
2. SSH key permissions incorrect
3. SSH agent not configured

**Fix Steps**:

```bash
# 1. Fix SSH key permissions
chmod 600 ~/.ssh/ec2-key.pem

# 2. Disable host key verification for testing
ssh -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -i ~/.ssh/ec2-key.pem ubuntu@52.6.170.44

# 3. Add SSH key to agent
ssh-add ~/.ssh/ec2-key.pem

# 4. Verify key is in agent
ssh-add -l

# 5. If using GitHub Actions, verify secret is set correctly
gh secret list | grep EC2
```

---

### 🚨 Issue: Docker Container Fails to Start

**Symptoms**:
```
docker: Error response from daemon: driver failed
Container exited with code 1
docker logs show startup errors
```

**Possible Causes**:
1. Port already in use
2. Volume/mount issues
3. Missing environment variables
4. Resource limits exceeded

**Fix Steps**:

```bash
# 1. SSH to the EC2 instance
ssh -i <KEY> -o ProxyCommand="ssh -i <KEY> -W %h:%p ubuntu@52.6.170.44" \
    ec2-user@172.31.X.X

# 2. Check container status
docker ps -a | grep <SERVICE_NAME>

# 3. View container logs
docker logs <CONTAINER_ID>

# 4. Check port conflicts
sudo netstat -tlnp | grep LISTEN
netstat -an | grep 3000  # Example port

# 5. Remove and restart container
docker stop <CONTAINER_ID>
docker rm <CONTAINER_ID>
docker-compose -f docker-compose.<SERVICE>.yml up -d

# 6. Check resource limits
docker stats <CONTAINER_ID>
```

---

### 🚨 Issue: Services Can't Communicate (Network Error)

**Symptoms**:
```
Cannot connect to DB: Connection refused
API Gateway can't reach microservices
timeout connecting to service
```

**Possible Causes**:
1. Service not running on target instance
2. Port not exposed in docker-compose
3. Network/firewall blocking traffic
4. Wrong IP address in configuration
5. Docker network misconfiguration

**Fix Steps**:

```bash
# 1. Verify service is running
docker ps | grep <SERVICE_NAME>

# 2. Check listening ports
docker exec <CONTAINER_ID> netstat -tlnp

# 3. Test port connectivity from another container
docker exec <OTHER_CONTAINER> nc -zv 172.31.X.X 3000

# 4. Check docker network
docker network ls
docker network inspect bridge

# 5. Verify IP address is correct
docker inspect <CONTAINER_ID> | grep IPAddress

# 6. Check docker-compose port mappings
cat docker-compose.<SERVICE>.yml | grep -A5 ports

# 7. Test from local machine (via bastion)
ssh -i <KEY> -o ProxyCommand="ssh -i <KEY> -W %h:%p ubuntu@52.6.170.44" \
    ec2-user@172.31.X.X
nc -zv 172.31.X.X 3000
```

---

### 🚨 Issue: Deployment Script Hangs / Timeout

**Symptoms**:
```
Waiting for service to start...
timeout waiting for health check
script hangs at deployment step
```

**Possible Causes**:
1. Service startup is very slow
2. Infinite loop in startup scripts
3. SSH connection dropped
4. Resource constraints (CPU/Memory)

**Fix Steps**:

```bash
# 1. Increase timeout in deploy_all_services.py
# Find the service definition and increase "timeout" value
timeout: 30  # Increase from default

# 2. Check service logs for errors
ssh -i <KEY> -o ProxyCommand="..." ec2-user@172.31.X.X
docker logs <CONTAINER_ID> --tail 50

# 3. Check instance resources
free -h  # Memory
df -h    # Disk space
top      # CPU usage

# 4. Manually test deployment
cat docker-compose.<SERVICE>.yml | \
ssh -o ProxyCommand="..." ec2-user@172.31.X.X \
    'cat > /tmp/docker-compose.yml && cd /tmp && docker-compose up -d'

# 5. Check network connectivity
ping 172.31.X.X
traceroute 172.31.X.X
```

---

### 🚨 Issue: GitHub Actions Workflow Fails

**Symptoms**:
```
Workflow run fails in GitHub Actions UI
Red X on workflow execution
Error in job logs
```

**Possible Causes**:
1. SSH key not configured in secrets
2. AWS credentials invalid
3. Python script has errors
4. Missing permissions for GitHub Actions runner

**Fix Steps**:

```bash
# 1. Check GitHub secrets are set
gh secret list | grep EC2

# 2. Verify secret format (should be valid private key)
gh secret view EC2_SSH_KEY | head -5

# 3. Check workflow file syntax
gh workflow list

# 4. View workflow logs
gh run list --workflow="deploy-py-orchestrator.yml" --limit 1
gh run view <RUN_ID> --log

# 5. Validate Python script locally
python deploy_all_services.py --help

# 6. Test SSH key locally
ssh -i ~/.ssh/ec2-key.pem ubuntu@52.6.170.44

# 7. Trigger workflow with debug
gh workflow run deploy-py-orchestrator.yml -f debug=true
```

---

## ✅ Health Check Commands

### Quick Service Status Check

```bash
#!/bin/bash
# Save as check-deployment.sh

BASTION_IP="52.6.170.44"
SSH_KEY="$HOME/.ssh/ec2-key.pem"

echo "🔍 Checking deployment status..."

# List of services and their IPs
declare -A SERVICES=(
    ["EC2-CORE"]="172.31.77.22"
    ["EC2-API-Gateway"]="172.31.77.50"
    ["EC2-DB"]="172.31.75.200"
    ["EC2-Messaging"]="172.31.75.210"
)

for SERVICE in "${!SERVICES[@]}"; do
    IP="${SERVICES[$SERVICE]}"
    echo -n "Checking $SERVICE ($IP)... "
    
    if ssh -i "$SSH_KEY" \
        -o StrictHostKeyChecking=no \
        -o ProxyCommand="ssh -i $SSH_KEY -W %h:%p ubuntu@$BASTION_IP" \
        ec2-user@$IP "docker ps -q | wc -l" &>/dev/null; then
        CONTAINERS=$(ssh -i "$SSH_KEY" \
            -o StrictHostKeyChecking=no \
            -o ProxyCommand="ssh -i $SSH_KEY -W %h:%p ubuntu@$BASTION_IP" \
            ec2-user@$IP "docker ps -q | wc -l")
        echo "✅ OK ($CONTAINERS containers)"
    else
        echo "❌ FAILED"
    fi
done
```

### Manual Full Health Check

```bash
# 1. Test bastion connectivity
ssh -i ~/.ssh/ec2-key.pem ubuntu@52.6.170.44 "echo OK"

# 2. Test EC2-CORE service
ssh -i ~/.ssh/ec2-key.pem \
    -o ProxyCommand="ssh -i ~/.ssh/ec2-key.pem -W %h:%p ubuntu@52.6.170.44" \
    ec2-user@172.31.77.22 "docker ps"

# 3. Test API Gateway
curl -X GET http://35.168.216.132:8080/health

# 4. Check all containers on EC2-CORE
ssh -i ~/.ssh/ec2-key.pem \
    -o ProxyCommand="ssh -i ~/.ssh/ec2-key.pem -W %h:%p ubuntu@52.6.170.44" \
    ec2-user@172.31.77.22 "docker ps -a"
```

---

## 🔄 Common Workflows

### Restart All Services

```bash
#!/bin/bash
# From local machine

SERVICES=("EC2-CORE" "EC2-API-Gateway" "EC2-DB" "EC2-Messaging")
SSH_KEY="~/.ssh/ec2-key.pem"
BASTION="52.6.170.44"

for SERVICE in "${SERVICES[@]}"; do
    echo "Restarting $SERVICE..."
    # Get IP from config or hardcode
    IP=$(jq -r ".\"$SERVICE\".PrivateIpAddress" config/instance_ips.json)
    
    ssh -i "$SSH_KEY" \
        -o ProxyCommand="ssh -i $SSH_KEY -W %h:%p ubuntu@$BASTION" \
        ec2-user@$IP \
        "docker-compose -f docker-compose.${SERVICE,,}.yml restart"
done
```

### View Logs from Service

```bash
SERVICE="EC2-CORE"
IP="172.31.77.22"
SSH_KEY="~/.ssh/ec2-key.pem"
BASTION="52.6.170.44"

ssh -i "$SSH_KEY" \
    -o ProxyCommand="ssh -i $SSH_KEY -W %h:%p ubuntu@$BASTION" \
    ec2-user@$IP \
    "docker-compose logs -f --tail=50"
```

### Re-deploy Single Service

```bash
SERVICE="EC2-CORE"
IP="172.31.77.22"
SSH_KEY="~/.ssh/ec2-key.pem"
BASTION="52.6.170.44"

# Read local docker-compose file
cat docker-compose.ec2-core.yml | \
ssh -i "$SSH_KEY" \
    -o ProxyCommand="ssh -i $SSH_KEY -W %h:%p ubuntu@$BASTION" \
    ec2-user@$IP \
    'cat > /tmp/docker-compose.yml && \
     cd /tmp && \
     docker-compose down && \
     docker-compose up -d'
```

---

## 🆘 Getting Help

### Check Log Files

1. **GitHub Actions logs** → Actions tab in GitHub
2. **SSH/deployment logs** → Console output from `gh run view`
3. **Docker logs** → `docker logs <container-id>`
4. **Instance system logs** → AWS Console → EC2 → Instance → System Log

### Useful Files

- `DEPLOYMENT_STATUS.md` - Current deployment state
- `DEPLOYMENT_COMPLETE.md` - How deployment works
- `deploy_all_services.py` - Main deployment script
- `config/instance_ips.json` - EC2 instance metadata

### Common GitHub CLI Commands

```bash
# List workflows
gh workflow list

# Trigger deployment
gh workflow run deploy-py-orchestrator.yml --ref main

# View recent runs
gh run list --workflow="deploy-py-orchestrator.yml"

# View specific run details
gh run view <RUN_ID> --job <JOB_ID> --log

# Download logs
gh run download <RUN_ID>
```

---

## 📚 Reference Links

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)
- [SSH ProxyCommand Tutorial](https://man.openbsd.org/ssh_config)
- [Python subprocess Documentation](https://docs.python.org/3/library/subprocess.html)

---

**Last Updated**: January 18, 2026
**Status**: Ready for troubleshooting
