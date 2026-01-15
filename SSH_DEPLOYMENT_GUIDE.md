# 🚀 DEPLOYMENT MANUAL INSTRUCTIONS

## SSH Connection to EC2 Instances

### Step 1: Get the SSH Key

The SSH key is stored in GitHub Secrets as `EC2_SSH_KEY`. You can retrieve it from:

**Option A: Using GitHub CLI (recommended)**
```powershell
gh secret get EC2_SSH_KEY | Out-File labsuser.pem -Encoding ASCII
```

**Option B: Using Git Bash**
```bash
gh secret get EC2_SSH_KEY > labsuser.pem
chmod 600 labsuser.pem
```

**Option C: Download directly**
- Go to https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions
- Copy the `EC2_SSH_KEY` value
- Paste it into a file named `labsuser.pem` in your project directory

### Step 2: Fix SSH Key Permissions

**On Linux/Mac:**
```bash
chmod 600 labsuser.pem
```

**On Windows (using PowerShell as Administrator):**
```powershell
icacls labsuser.pem /inheritance:r
icacls labsuser.pem /grant:r "$($env:USERNAME):(F)"
icacls labsuser.pem /remove "BUILTIN\Users"
```

### Step 3: Deploy Services to Each Instance

#### Frontend (44.220.126.89)
```bash
ssh -i labsuser.pem ubuntu@44.220.126.89 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.frontend.yml up -d && \
docker ps
EOF
```

#### API Gateway (52.7.168.4)
```bash
ssh -i labsuser.pem ubuntu@52.7.168.4 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.api-gateway.yml up -d && \
docker ps
EOF
```

#### Core Services (13.222.63.75)
```bash
ssh -i labsuser.pem ubuntu@13.222.63.75 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.core.yml up -d && \
docker ps
EOF
```

#### Database (100.31.104.252)
```bash
ssh -i labsuser.pem ubuntu@100.31.104.252 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.infrastructure.yml up -d && \
docker ps
EOF
```

#### Messaging (98.93.37.132)
```bash
ssh -i labsuser.pem ubuntu@98.93.37.132 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.messaging.yml up -d && \
docker ps
EOF
```

#### Notificaciones (3.236.139.55)
```bash
ssh -i labsuser.pem ubuntu@3.236.139.55 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.notificaciones.yml up -d && \
docker ps
EOF
```

#### Reportes (52.200.32.56)
```bash
ssh -i labsuser.pem ubuntu@52.200.32.56 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.notificaciones.yml up -d && \
docker ps
EOF
```

#### Monitoring (98.88.93.98)
```bash
ssh -i labsuser.pem ubuntu@98.88.93.98 << 'EOF'
cd ~/Proyecto-Acompa-amiento- && \
git pull && \
docker-compose -f docker-compose.prod.yml up -d && \
docker ps
EOF
```

### Step 4: Verify Services are Running

Once deployed, check if containers are running:
```bash
ssh -i labsuser.pem ubuntu@<IP> "docker ps"
```

Check logs:
```bash
ssh -i labsuser.pem ubuntu@<IP> "docker logs -f <container_name>"
```

## All Services URLs

- **Frontend**: http://44.220.126.89
- **API Gateway**: http://52.7.168.4:8080
- **Auth Service**: http://13.222.63.75:3000
- **Students Service**: http://13.222.63.75:3001
- **Teachers Service**: http://13.222.63.75:3002
- **Notifications**: http://3.236.139.55:5006
- **Reports**: http://52.200.32.56:5003
- **Monitoring**: http://98.88.93.98:9090
- **Database**: postgresql://100.31.104.252:5432/acompanamiento

## Troubleshooting

### SSH Permission Denied
- Make sure the key file has correct permissions (600 on Linux/Mac)
- On Windows, remove BUILTIN\Users and add only your user

### Docker Not Found
- Ensure Docker is installed on the instance
- Run: `sudo apt update && sudo apt install -y docker.io docker-compose`

### Containers Won't Start
- Check docker logs: `docker logs <container_id>`
- Verify environment variables: Check `.env.generated` is correct
- Check disk space: `df -h`
- Check Docker daemon: `sudo systemctl status docker`

