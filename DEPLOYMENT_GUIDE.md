# 🚀 Docker Deployment Guide - AWS Academy Learner Lab

## ✅ SSH Configuration - CRITICAL FINDING

### Working SSH Setup
```bash
# Use this SSH user (not ec2-user)
ssh -i labsuser.pem ubuntu@<instance-ip>

# Example for EC2-Reportes
ssh -i labsuser.pem ubuntu@52.200.32.56
```

### Why This Works
- AWS Academy Learner Lab uses custom AMI with `ubuntu` user
- Default EC2 AMI uses `ec2-user`, but not these instances
- SSH key from Academy is `labsuser.pem` in Downloads folder

## 🎉 Test Deployment - SUCCESSFUL

**Instance**: EC2-Reportes (52.200.32.56)
**Container**: nginx:latest (port 8080)
**Status**: ✅ Running
**Access**: http://52.200.32.56:8080

### Deployment Command Used
```bash
ssh -i labsuser.pem ubuntu@52.200.32.56 << 'EOF'
docker pull nginx:latest
docker stop test-nginx || true
docker rm test-nginx || true
docker run -d --name test-nginx -p 8080:80 nginx:latest
docker ps
EOF
```

## 📊 Available Instances

| Name | IP | Status |
|------|--------|--------|
| EC2-Reportes | 52.200.32.56 | Ready (Nginx tested) |
| EC2-Monitoring | 98.88.93.98 | Ready |
| EC-Bastion | 34.235.224.202 | Ready |
| EC2-CORE | 98.82.116.59 | Ready |
| EC2-DB | 98.92.241.98 | Ready |
| EC2-Notificaciones | 98.92.23.187 | Ready |
| EC2-Frontend | 44.220.126.89 | Ready |
| EC2-Messaging | 100.48.101.145 | Ready |
| EC2-API-Gateway | 52.7.168.4 | Ready |

## 📝 For Actual Deployment

### Step 1: Push Docker Images
```bash
# Build and push your images to Docker Hub
docker build -t yourusername/micro-reportes-estudiantes:latest .
docker push yourusername/micro-reportes-estudiantes:latest

docker build -t yourusername/micro-reportes-maestros:latest .
docker push yourusername/micro-reportes-maestros:latest
```

### Step 2: Deploy via SSH
```bash
ssh -i labsuser.pem ubuntu@52.200.32.56 << 'EOF'
docker pull yourusername/micro-reportes-estudiantes:latest
docker pull yourusername/micro-reportes-maestros:latest
docker stop micro-reportes-estudiantes || true
docker rm micro-reportes-estudiantes || true
docker run -d --name micro-reportes-estudiantes -p 4001:3000 \
  yourusername/micro-reportes-estudiantes:latest
docker run -d --name micro-reportes-maestros -p 4002:3000 \
  yourusername/micro-reportes-maestros:latest
docker ps
EOF
```

## ⚠️ Important Notes

### What Didn't Work
- ❌ SSM (Systems Manager) - instances don't have required IAM role
- ❌ GitHub Actions with `ec2-user` - wrong user for this AMI

### What Works
- ✅ SSH with `ubuntu` user
- ✅ Direct Docker commands via SSH
- ✅ All 9 instances accessible and ready

### Credentials Security
- **Never commit AWS credentials** to git
- Use GitHub Secrets for CI/CD workflows
- Pass credentials only via environment variables, not files
