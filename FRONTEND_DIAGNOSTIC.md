# 🔍 Frontend Issue - Diagnostic Report

## Status

- ✅ Deployment workflow ejecutado exitosamente (✓ 26 segundos)
- ✅ docker-compose.ec2-frontend.yml actualizado a puerto 3000
- ❌ Frontend aún no responde en http://52.72.57.10:3000
- ⚠️ Posible: contenedor no está corriendo o puerto no está mapeado

## Root Cause Analysis

El deployment workflow **aparentemente ejecutó con éxito**, pero el contenedor del frontend probablemente:

1. **No se levantó correctamente** - Error en la aplicación Node.js
2. **No tiene el puerto mapeado** - docker-compose puede tener aún la vieja config
3. **No descargó el archivo correcto** - curl falló silenciosamente
4. **Security Group** - Puerto 3000 no está abierto

## Next Steps - Verify Container Status

### Step 1: SSH to Instance via AWS Systems Manager Session Manager

```bash
# Go to AWS Console > EC2 > Instances
# Find EC2-Frontend (52.72.57.10 / i-048232c6d4879895f)
# Click Connect > Session Manager > Connect

# In the terminal:
cd /tmp
ls -la docker-compose*.yml
```

### Step 2: Check Container Status

```bash
# See all containers
docker ps -a | grep -E "frontend|CONTAINER"

# Check if frontend container exists
docker container inspect frontend

# See logs
docker logs frontend --tail 50
```

### Step 3: Manual Redeploy if Needed

```bash
# Stop old container
docker stop frontend 2>/dev/null || true
docker rm frontend 2>/dev/null || true

# Download fresh config
curl -s https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/docker-compose.ec2-frontend.yml > docker-compose.ec2-frontend.yml

# Verify config has port 3000
grep -A2 'ports:' docker-compose.ec2-frontend.yml

# Deploy
docker-compose -f docker-compose.ec2-frontend.yml up -d --no-build

# Verify
sleep 3
docker ps | grep frontend
docker logs frontend
```

### Step 4: Test Connectivity

```bash
# From inside the container
docker exec frontend curl http://localhost:3000

# From the instance (should work)
curl http://localhost:3000

# Check port mapping
docker port frontend

# Check if port 3000 is listening
netstat -tlnp | grep 3000
```

### Step 5: Check Security Group

```bash
# In AWS Console:
# EC2 > Security Groups > Search for frontend/default
# Inbound rules must allow port 3000 from 0.0.0.0/0 or your IP

# Or via AWS CLI:
aws ec2 describe-security-groups \
  --query 'SecurityGroups[?Tags[?Key==`Name`]].IpPermissions[]' \
  --output table
```

## Configuration Reference

**docker-compose.ec2-frontend.yml should have:**

```yaml
services:
  frontend:
    container_name: frontend
    image: frontend-web:latest
    ports:
      - "3000:3000"    # ← CRITICAL: Must be 3000, not 80/443
    environment:
      NODE_ENV: production
      API_GATEWAY_URL: http://98.86.94.92:8080
      API_GATEWAY_HOST: 98.86.94.92
```

## URLs to Test

Once frontend is working:

1. **Frontend**: http://52.72.57.10:3000
2. **API Health**: http://98.86.94.92:8080/health
3. **Core API**: http://100.49.160.199:3001
4. **Monitoring**: http://54.205.158.101:3000 (Grafana: admin/admin)

## Automated Fix Available

If manual steps don't work, run:

```bash
cd Proyecto-Acompa-amiento-
python3 fix-frontend-direct.py
# or
bash fix-frontend-bastion.sh
```

---

**Last Updated**: 2026-01-19
**Instance**: i-048232c6d4879895f (EC2-Frontend)
**Public IP**: 52.72.57.10
**Private IP**: 172.31.65.89
