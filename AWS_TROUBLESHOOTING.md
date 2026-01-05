# 🔧 AWS Deployment Troubleshooting Guide

Guía rápida para resolver problemas comunes en despliegue de AWS EC2.

---

## 🚨 Problemas Comunes

### 1. "Permission denied (publickey)" al SSH

**Síntomas:**
```
Permission denied (publickey).
```

**Causas posibles:**
- Archivo .pem no tiene permisos correctos
- Usuario SSH incorrecto
- IP pública incorrecta
- Security Group no permite SSH

**Soluciones:**

```bash
# 1. Verificar permisos del .pem (Mac/Linux)
chmod 600 ~/.ssh/my-key.pem
ls -la ~/.ssh/my-key.pem
# Debe verse: -rw------- (solo lectura para propietario)

# 2. Verificar permisos del .pem (Windows)
# Revisar propiedades del archivo .pem
# El usuario actual debe ser el único con permisos

# 3. Usar usuario correcto (casi siempre es ec2-user)
ssh -i my-key.pem ec2-user@IP_PUBLICA
# NO usar: root@IP, ubuntu@IP, etc.

# 4. Verificar IP pública
aws ec2 describe-instances --query 'Reservations[0].Instances[0].PublicIpAddress'

# 5. Verificar Security Group permite SSH (puerto 22)
aws ec2 describe-security-groups --group-ids sg-xxxxx
# Buscar: IpProtocol: tcp, FromPort: 22
```

---

### 2. "Connection refused" al conectar a bases de datos

**Síntomas:**
```
Error: connect ECONNREFUSED 172.31.79.193:27017
```

**Causas posibles:**
- BD no está corriendo en EC2-DB
- IP privada incorrecta en .env
- Security Group no permite tráfico
- Puerto incorrecto

**Soluciones:**

```bash
# En EC2-DB, verificar contenedores
ssh -i my-key.pem ec2-user@IP_PUBLICA_EC2_DB

# Listar contenedores
docker ps
# Debe mostrar: mongo, postgres, redis corriendo

# Si no están corriendo
docker-compose -f docker-compose.yml ps

# Ver logs de un servicio
docker logs <container_name>
docker logs mongo
docker logs postgres
docker logs redis

# Verificar que el servicio está escuchando
docker exec mongo mongosh --eval "db.adminCommand('ping')"
docker exec postgres pg_isready
docker exec redis redis-cli ping

# Si todo está bien pero aún falla conectividad:
# 1. Verificar IP privada
hostname -I
# Copiar esta IP a .env en EC2-Microservicios

# 2. Verificar iptables/firewall
sudo iptables -L
sudo systemctl status firewalld  # Si usa firewalld

# 3. Abrir puertos (si es necesario)
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --reload
```

---

### 3. "Contenedores en EC2-Microservicios no arrancan"

**Síntomas:**
```
docker-compose up -d

# Pero docker ps muestra "Exited (1)"
```

**Causas posibles:**
- Variables de ambiente incorrectas en .env
- Imagen Docker no existe
- Puerto ya está en uso
- Recursos insuficientes

**Soluciones:**

```bash
# En EC2-Microservicios

# 1. Ver qué está pasando
docker-compose -f docker-compose.aws.yml logs
docker-compose -f docker-compose.aws.yml logs api-gateway
docker-compose -f docker-compose.aws.yml logs -f  # en tiempo real

# 2. Verificar variables de ambiente
cat .env | grep MONGO_URI
cat .env | grep POSTGRES_HOST
# Deben mostrar: mongodb://172.31.79.193:...

# 3. Rebuild si hay cambios
docker-compose -f docker-compose.aws.yml build --no-cache
docker-compose -f docker-compose.aws.yml up -d

# 4. Verificar puertos disponibles
netstat -tuln | grep LISTEN
# Ver si los puertos 8080, 5001-5008, 5500 están en uso

# 5. Ver recursos disponibles
free -h        # memoria
df -h           # disco
docker stats    # uso en tiempo real

# 6. Si todo falla, remove y recrear
docker-compose -f docker-compose.aws.yml down
docker-compose -f docker-compose.aws.yml up -d
```

---

### 4. "No se puede acceder a http://IP:8080"

**Síntomas:**
```
curl http://54.123.45.67:8080/health
# Connection refused o timeout
```

**Causas posibles:**
- api-gateway no está corriendo
- Security Group no permite puerto 8080
- IP pública incorrecta

**Soluciones:**

```bash
# 1. Verificar que api-gateway está corriendo
docker ps | grep api-gateway

# 2. Si no está, revisar logs
docker logs api-gateway

# 3. Verificar puerto
netstat -tuln | grep 8080
# Si está vacío, el servicio no está escuchando

# 4. Probar desde el mismo servidor (localhost)
curl http://localhost:8080/health

# 5. Verificar Security Group
aws ec2 describe-security-groups --group-ids sg-xxxxx
# Buscar regla: 0.0.0.0/0:8080

# 6. Si necesitas agregar la regla
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 8080 \
  --cidr 0.0.0.0/0

# 7. Probar con verbose
curl -v http://54.123.45.67:8080/health
```

---

### 5. "Workflow de GitHub Actions falla al conectarse a EC2"

**Síntomas:**
```
Error: Unable to establish SSH connection
```

**Causas posibles:**
- GitHub Secret SSH_PRIVATE_KEY incorrecto
- IP incorrecta en AWS_EC2_DB_PRIVATE_IP
- EC2 no tiene conectividad de internet
- Firewall/NAT bloqueando SSH

**Soluciones:**

```bash
# 1. Verificar que el secret está bien configurado
# GitHub → Settings → Secrets
# AWS_EC2_DB_SSH_PRIVATE_KEY debe tener contenido correcto

# 2. Test manual de conectividad
# Desde tu computadora, no desde GitHub
ssh -i my-key.pem ec2-user@IP_PUBLICA_EC2_DB

# 3. Verificar EC2 tiene internet saliente
# SSH a EC2 y ejecutar
curl https://www.google.com
# Si falla, el problema es routing/NAT

# 4. Ver logs del workflow en GitHub
# GitHub → Actions → Workflow run
# Expandir paso "SSH Setup" para ver error específico

# 5. Re-crear el secret
# GitHub → Settings → Secrets
# Delete: AWS_EC2_DB_SSH_PRIVATE_KEY
# Create nuevo con contenido correcto:
# cat my-key.pem | clip  (Windows)
# cat my-key.pem | pbcopy (Mac)
# cat my-key.pem | xclip (Linux)
```

---

### 6. "PostgreSQL/MongoDB/Redis no están persistiendo datos"

**Síntomas:**
```
Después de docker restart, los datos desaparecen
```

**Causas posibles:**
- Volumen no configurado correctamente
- Volumen eliminado por error

**Soluciones:**

```bash
# En EC2-DB

# 1. Verificar volumen existe
docker volume ls | grep acompanamiento

# 2. Si no existe, crear manualmente
docker volume create acompanamiento-postgres-vol
docker volume create acompanamiento-mongo-vol
docker volume create acompanamiento-redis-vol

# 3. Verificar contenedor usa volumen
docker inspect postgres | grep -A 5 Mounts

# 4. Si el volumen está vacío
docker volume inspect acompanamiento-postgres-vol

# 5. Agregar volumen a contenedor existente
# Parar contenedor
docker stop postgres

# Crear volumen si no existe
docker volume create acompanamiento-postgres-vol

# Re-iniciar con volumen
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=password \
  -v acompanamiento-postgres-vol:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15

# 6. Backup de datos (IMPORTANTE antes de cambios)
docker exec postgres pg_dump -U postgres acompanamiento > backup.sql
```

---

### 7. "Microservicios no pueden conectar entre sí"

**Síntomas:**
```
Error: Cannot find service api-gateway
Error: Service discovery failed
```

**Causas posibles:**
- Servicios en diferentes networks
- DNS no resuelve nombres de servicios

**Soluciones:**

```bash
# En EC2-Microservicios

# 1. Verificar network existe
docker network ls | grep acompanamiento

# 2. Verificar todos los servicios están en la misma network
docker inspect api-gateway | grep -A 3 NetworkSettings
# Debe mostrar la misma network para todos

# 3. Test de conectividad entre servicios
docker exec api-gateway curl http://micro-auth:5005/health

# 4. Si falla, revisar docker-compose.aws.yml
# Verificar que "networks:" está definido
# Verificar que todos los servicios especifican la red

# 5. Rebuild network
docker-compose -f docker-compose.aws.yml down
docker network prune
docker-compose -f docker-compose.aws.yml up -d
```

---

### 8. "GitHub Actions workflow nunca termina o timeout"

**Síntomas:**
```
Workflow running for 360 minutes...
Error: Workflow timed out after 6 hours
```

**Causas posibles:**
- SSH hang esperando input
- Docker build tomando demasiado tiempo
- Conectividad lenta

**Soluciones:**

```bash
# 1. En el workflow, agregar timeout
timeout-minutes: 30  # a nivel de job

# 2. Agregar SSH flags
# En el workflow, usar:
ssh -o ConnectTimeout=10 \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=no \
    ...

# 3. Agregar output para debug
set -x  # en scripts bash dentro del workflow

# 4. Ver progreso en GitHub
# Actions → Tu workflow → Ver logs en tiempo real

# 5. Para future runs
# Si Docker build es lento, consider:
# - Pre-built images en Docker Hub
# - Cache de layers
# - EC2 más grande (t2.large)
```

---

### 9. "Error: Dockerfile no encontrado"

**Síntomas:**
```
Error: Dockerfile not found in path
```

**Causas posibles:**
- Archivo Dockerfile no committeado
- Ruta relativa incorrecta en docker-compose
- Typo en nombre

**Soluciones:**

```bash
# 1. Verificar Dockerfile existe
ls -la api-gateway/Dockerfile
ls -la micro-auth/Dockerfile

# 2. Verificar en git
git status api-gateway/Dockerfile

# 3. Si no aparece, agregar
git add api-gateway/Dockerfile
git commit -m "Add Dockerfile"

# 4. Verificar ruta en docker-compose.aws.yml
# Debe ser:
# build:
#   context: ./api-gateway
#   dockerfile: Dockerfile

# 5. Test build local
docker build -t api-gateway:latest ./api-gateway
```

---

## 🧪 Quick Diagnostic Script

```bash
#!/bin/bash

echo "🔍 AWS Deployment Diagnostic"
echo ""

# EC2-DB checks
echo "=== EC2-DB Checks ==="
docker ps | grep -E "mongo|postgres|redis"
echo ""

# Network checks
echo "=== Network Checks ==="
docker network ls
echo ""

# Volume checks
echo "=== Volume Checks ==="
docker volume ls | grep acompanamiento
echo ""

# Connectivity checks
echo "=== Connectivity Checks ==="
docker exec mongo mongosh --eval "db.adminCommand('ping')" || echo "❌ MongoDB no responde"
docker exec postgres pg_isready || echo "❌ PostgreSQL no responde"
docker exec redis redis-cli ping || echo "❌ Redis no responde"
echo ""

# Microservices checks
echo "=== Microservices Checks ==="
docker ps | grep -c "Up" | xargs echo "Contenedores corriendo:"
docker ps --filter="status=exited" | wc -l | xargs echo "Contenedores detenidos:"
```

---

## 📞 Necesitas más ayuda?

1. **Revisa los logs detallados:**
   ```bash
   docker logs <container_name>
   docker-compose logs -f
   ```

2. **Ejecuta el post-deployment test:**
   ```bash
   ./post-deployment-test.sh IP_PUBLICA_EC2_MICRO IP_PRIVADA_EC2_DB
   ```

3. **Verifica la guía completa:**
   - [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)
   - [AWS_SETUP_README.md](./AWS_SETUP_README.md)

4. **Contacta al equipo con:**
   - Output de `docker ps -a`
   - Output de `docker logs <container>`
   - IPs configuradas (públicas y privadas)
   - Error exacto del workflow/curl

---

**Última actualización:** Enero 2026  
**Versión:** 1.0
