# Manual AWS Deployment Guide - EC2 Instances

## Prerequisitos

- Acceso SSH a todas las instancias EC2
- Docker y Docker Compose instalados en cada instancia
- Permisos para `sudo docker` (usuario ubuntu debe estar en grupo docker)

## Despliegue Manual (sin GitHub Actions)

### Paso 1: Preparar archivos en tu máquina local

```bash
# Clonar o actualizar el repo
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

# Ver los .env disponibles
ls -la .env.prod.*

# El archivo .env.prod.core ya contiene IPs hardcodeadas para EC2-CORE
cat .env.prod.core
```

### Paso 2: Construir imágenes Docker localmente

```bash
# Construir cada imagen
docker build -f api-gateway/Dockerfile -t api-gateway:latest .
docker build -f micro-auth/Dockerfile -t micro-auth:latest .
docker build -f micro-estudiantes/Dockerfile -t micro-estudiantes:latest .
docker build -f micro-maestros/Dockerfile -t micro-maestros:latest .

# Guardar como tar para transferencia
docker save api-gateway:latest -o api-gateway.tar
docker save micro-auth:latest -o micro-auth.tar
docker save micro-estudiantes:latest -o micro-estudiantes.tar
docker save micro-maestros:latest -o micro-maestros.tar

ls -lh *.tar
```

### Paso 3: Transferir archivos a EC2-CORE

```bash
# Variables
EC2_IP=13.216.12.61  # IP elástica de EC2-CORE
SSH_KEY=~/.ssh/ec2-core-key.pem  # Tu clave SSH
SSH_USER=ubuntu

# Transferir imágenes Docker
scp -i $SSH_KEY *.tar $SSH_USER@$EC2_IP:~/

# Transferir .env
scp -i $SSH_KEY .env.prod.core $SSH_USER@$EC2_IP:~/.env

# Transferir docker-compose.prod.yml (lo crearemos después)
scp -i $SSH_KEY docker-compose.prod.yml $SSH_USER@$EC2_IP:~/
```

### Paso 4: Acceder a EC2-CORE y desplegar

```bash
# Conectarse a EC2-CORE
ssh -i $SSH_KEY $SSH_USER@$EC2_IP

# Una vez dentro de EC2:
cd ~

# Verificar archivos
ls -lh *.tar .env docker-compose.prod.yml

# Cargar imágenes Docker
docker load -i api-gateway.tar
docker load -i micro-auth.tar
docker load -i micro-estudiantes.tar
docker load -i micro-maestros.tar

# Verificar que las imágenes se cargaron
docker images | grep -E "api-gateway|micro"

# Detener contenedores antiguos (si existen)
docker-compose down 2>/dev/null || true
docker stop api-gateway micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm api-gateway micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que se inicien
sleep 10

# Ver estado
docker-compose ps
```

### Paso 5: Verificar health checks

```bash
# Desde EC2-CORE
echo "Verificando micro-auth..."
curl http://localhost:3000/health

echo "Verificando micro-estudiantes..."
curl http://localhost:3001/health

echo "Verificando micro-maestros..."
curl http://localhost:3002/health

echo "Verificando api-gateway..."
curl http://localhost:8080/health

# Desde tu máquina (externo)
curl http://13.216.12.61:8080/health
```

### Paso 6: Ver logs

```bash
# Dentro de EC2-CORE
docker-compose logs -f api-gateway
docker-compose logs -f micro-estudiantes
docker logs micro-auth -f

# O en tu máquina
ssh -i $SSH_KEY $SSH_USER@$EC2_IP "docker-compose logs --tail 100"
```

---

## Despliegue con GitHub Actions (Automático)

Si tienes GitHub Actions configurado:

### 1. Agregar SSH Key como Secret en GitHub

```bash
# En tu máquina
cat ~/.ssh/ec2-core-key.pem | base64

# En GitHub:
# Settings → Secrets → New Repository Secret
# Nombre: EC2_CORE_SSH_KEY
# Valor: (el base64 de arriba)
```

### 2. Triggerear el workflow

- Push a `main` (automático si hay cambios en api-gateway/*, micro-*/*):
  ```bash
  git add .
  git commit -m "Update services"
  git push origin main
  ```

- O manualmente:
  - Ir a GitHub Actions → AWS Deploy - EC2-CORE → Run workflow → Select branch `main` → Run

### 3. Monitorear el workflow

- GitHub Actions → AWS Deploy - EC2-CORE → (último run)
- Ver logs en tiempo real

---

## docker-compose.prod.yml (para EC2-CORE)

Crea este archivo en tu máquina local y luego transferlo a EC2:

```yaml
version: '3.8'

services:
  micro-auth:
    image: micro-auth:latest
    container_name: micro-auth
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGO_URL: mongodb://admin:MyMongoProd123!@172.31.79.193:27017/acompaamiento?authSource=admin
      JWT_SECRET: prod-jwt-secret-key-minimum-32-chars-change-this
      LOG_LEVEL: info
    networks:
      - core-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  micro-estudiantes:
    image: micro-estudiantes:latest
    container_name: micro-estudiantes
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGO_URL: mongodb://admin:MyMongoProd123!@172.31.79.193:27017/acompaamiento?authSource=admin
      REPORTES_EST_URL: http://172.31.69.133:5003
      LOG_LEVEL: info
    depends_on:
      - micro-auth
    networks:
      - core-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  micro-maestros:
    image: micro-maestros:latest
    container_name: micro-maestros
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      PORT: 3002
      MONGO_URL: mongodb://admin:MyMongoProd123!@172.31.79.193:27017/acompaamiento?authSource=admin
      LOG_LEVEL: info
    depends_on:
      - micro-auth
    networks:
      - core-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  api-gateway:
    image: api-gateway:latest
    container_name: api-gateway
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: production
      PORT: 8080
      AUTH_SERVICE: http://micro-auth:3000
      MAESTROS_SERVICE: http://micro-maestros:3002
      ESTUDIANTES_SERVICE: http://micro-estudiantes:3001
      REPORTES_EST_SERVICE: http://172.31.69.133:5003
      REPORTES_MAEST_SERVICE: http://172.31.69.133:5004
      NOTIFICACIONES_SERVICE: http://172.31.65.57:5005
      JWT_SECRET: prod-jwt-secret-key-minimum-32-chars-change-this
      CORS_ORIGIN: "http://107.21.124.81,http://172.31.69.203:5500"
      LOG_LEVEL: info
    depends_on:
      - micro-auth
      - micro-estudiantes
      - micro-maestros
    networks:
      - core-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  core-net:
    driver: bridge
```

---

## Troubleshooting

### Los contenedores no inician

```bash
# Ver logs
docker-compose logs

# Ver estado detallado
docker-compose ps -a
docker ps -a

# Revisar errores específicos
docker logs micro-auth
```

### Error de conexión a MongoDB

```bash
# Verificar que EC2-DB está corriendo y accesible
ping 172.31.79.193
telnet 172.31.79.193 27017

# O desde EC2-CORE
nc -zv 172.31.79.193 27017
```

### Health check falla

```bash
# Testear manualmente
curl -v http://localhost:3000/health
curl -v http://localhost:3001/health
curl -v http://localhost:3002/health
curl -v http://localhost:8080/health

# Ver qué puertos están escuchando
netstat -tlnp | grep LISTEN
```

### Reiniciar todos los servicios

```bash
# Dentro de EC2-CORE
docker-compose down
docker-compose up -d
docker-compose ps
```

---

## Verificar endpoints importantes

```bash
# Desde tu máquina
API="http://13.216.12.61:8080"

# Health
curl $API/health

# Horarios
curl $API/horarios/maestros | jq .

# Auth (login)
curl -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

---

## Próximos pasos (despliegue secuencial)

1. **EC2-DB**: MongoDB + PostgreSQL (ya debe estar corriendo)
2. **EC2-CORE**: ✅ Siguiendo este guía
3. **EC2-Reportes**: micro-reportes (similar a EC2-CORE)
4. **EC2-API-Gateway**: Réplica del API Gateway
5. **EC2-Frontend**: frontend-web + nginx
6. **EC2-Notificaciones**: micro-notificaciones
7. **EC2-Messaging**: MQTT Broker
8. **EC2-Monitoring**: Prometheus + Grafana

Cada instancia seguirá un patrón similar:
- Build → Transfer → Deploy → Health Check → Logs
