# Deployment Instructions

## Current Status
The API Gateway and Reportes services need to be deployed with the routing fixes. However, the GitHub Actions workflow requires SSH access to the EC2 instances.

## Option 1: Configure GitHub Secrets (RECOMMENDED)

To enable the GitHub Actions workflow to deploy:

1. **Generate or obtain your EC2 SSH private key**
   - You should have this from when you created the EC2 instances
   - Typically named something like `aws-key.pem` or `ec2-keypair.pem`

2. **Add the SSH key to GitHub Secrets:**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Create a new secret named `AWS_EC2_DB_SSH_PRIVATE_KEY`
   - Copy the entire contents of your private key file and paste it as the secret value
   - Include the `-----BEGIN` and `-----END` lines

3. **Run the Workflow:**
   - Go to Actions tab
   - Select "Fix Reportes Routing in API Gateway"
   - Click "Run workflow"
   - The workflow will now have access to deploy

## Option 2: Manual Deployment (If you have SSH access)

If you can SSH to the servers directly, run:

```bash
# Deploy API Gateway
ssh -i /path/to/key.pem ubuntu@100.49.159.65 << 'EOF'
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-
docker build -t api-gateway:latest -f api-gateway/Dockerfile .
docker stop api-gateway 2>/dev/null || true
docker kill api-gateway 2>/dev/null || true
sleep 1
docker rm -f api-gateway 2>/dev/null || true
sleep 2
docker system prune -f 2>/dev/null || true
sleep 3
docker run -d --name api-gateway --restart unless-stopped \
  -p 8080:8080 \
  -e PORT=8080 \
  -e AUTH_SERVICE=http://100.24.118.233:3000 \
  -e MAESTROS_SERVICE=http://100.24.118.233:3002 \
  -e ESTUDIANTES_SERVICE=http://100.24.118.233:3001 \
  -e REPORTES_EST_SERVICE=http://98.84.26.109:5003 \
  -e REPORTES_MAEST_SERVICE=http://98.84.26.109:5004 \
  api-gateway:latest
sleep 5
EOF

# Deploy Reportes Services
ssh -i /path/to/key.pem ubuntu@98.84.26.109 << 'EOF'
cd /tmp
rm -rf Proyecto-Acompa-amiento-
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-
docker build -t micro-reportes-estudiantes:latest -f micro-reportes-estudiantes/Dockerfile .
docker build -t micro-reportes-maestros:latest -f micro-reportes-maestros/Dockerfile .
docker stop micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
docker kill micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
sleep 1
docker rm -f micro-reportes-estudiantes micro-reportes-maestros 2>/dev/null || true
sleep 2
docker run -d --name micro-reportes-estudiantes --restart unless-stopped \
  -p 5003:5003 \
  -e PORT=5003 \
  -e MONGO_URI=mongodb://localhost:27017/micro-reportes-estudiantes \
  micro-reportes-estudiantes:latest
docker run -d --name micro-reportes-maestros --restart unless-stopped \
  -p 5004:5004 \
  -e PORT=5004 \
  -e MONGO_URI=mongodb://localhost:27017/micro-reportes-maestros \
  micro-reportes-maestros:latest
sleep 8
EOF
```

## Option 3: Use AWS Systems Manager Session Manager

If you have AWS credentials configured, you can use AWS SSM to connect without SSH:

```bash
# Install AWS CLI and Session Manager plugin
# Then connect without SSH keys
aws ssm start-session --target i-xxxxx
```

## Verifying Deployment

After deployment, verify the services are running:

```bash
# API Gateway
curl http://100.49.159.65:8080/health

# Reportes Services
curl http://98.84.26.109:5003/health
curl http://98.84.26.109:5004/health

# Frontend access
curl http://100.49.159.65:8080/api/reportes/estudiantes/reporte/695bc30a04644ed82199e4b6
```

## What Was Changed

1. **API Gateway** (`api-gateway/server.js`)
   - Added `/api/reportes` route proxy
   - Points to reportes services on 98.84.26.109:5003

2. **Reportes Services Routes**
   - `micro-reportes-estudiantes/src/routes/reportesEstRoutes.js`: Added `/api/reportes/estudiantes/*` routes
   - `micro-reportes-maestros/src/routes/reportesMaestroRoutes.js`: Added `/api/reportes/maestros/*` routes

3. **GitHub Workflow**
   - `.github/workflows/fix-reportes-routing.yml`: Automated deployment workflow

## Next Steps

1. **Get your EC2 SSH private key** (if not already done)
2. **Add it to GitHub Secrets** as `AWS_EC2_DB_SSH_PRIVATE_KEY`
3. **Run the workflow** from GitHub Actions
4. **Verify endpoints** are working
