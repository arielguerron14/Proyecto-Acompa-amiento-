# IP Routing Strategy: Teoría y Práctica

## Tu Situación Actual

```
AWS Account
├─ VPC: 172.31.0.0/16 (default VPC)
│
├─ EC2-CORE
│  ├─ Public IP:  3.236.51.29
│  ├─ Private IP: 172.31.79.241  ← Used for internal communication
│  └─ Services:
│     ├─ micro-auth:3000
│     ├─ micro-estudiantes:3001
│     ├─ micro-maestros:3002
│     ├─ micro-reportes:5003-5004
│     └─ MongoDB + PostgreSQL
│
└─ EC2-API-GATEWAY
   ├─ Public IP:  52.7.168.4
   ├─ Private IP: 172.31.79.241  (same subnet)
   └─ Service: api-gateway:8080
      └─ Routes to CORE services (ver abajo)
```

## ¿Por Qué IP Privada Para Comunicación Intra-VPC?

### Regla de Oro en AWS

```
DENTRO DE LA MISMA VPC
  → Siempre usa IP PRIVADA
  
FUERA DE LA VPC (internet público)
  → Usa IP PÚBLICA
```

### Ventajas de Usar IP Privada

| Aspecto | IP Privada | IP Pública |
|--------|-----------|-----------|
| **Costo** | ✅ Gratis | ❌ Data transfer cost |
| **Seguridad** | ✅ No expuesta a internet | ❌ Expuesta públicamente |
| **Latencia** | ✅ Más rápida (network directo) | ⚠️ Va a internet y vuelve |
| **Estabilidad** | ❌ Puede cambiar si reinicia | ❌ Cambia si reinicia |
| **Routing** | ✅ AWS maneja automáticamente | ⚠️ Requiere Internet Gateway |

## Arquitectura Correcta Para Tu Proyecto

### ANTES (Incorrecto - Lo que intentaste)

```
GitHub Actions Runner (internet)
         │
         ├──→ SSH via PUBLIC IP ✅
         │
EC2-API-GATEWAY
         │
         └──→ Intenta conectar a 172.31.79.241:3000 ❌
              (Intenta hablar desde FUERA del contenedor)
              
Docker Network (core-net)
└─ micro-auth escucha en 127.0.0.1:3000 ❌
   (SOLO accesible dentro del contenedor)
```

### AHORA (Correcto - Lo que implementé)

```
GitHub Actions Runner
         │
         ├──→ SSH via PUBLIC IP (3.236.51.29) ✅
         │
EC2-CORE/EC2-API-GATEWAY (same VPC)
         │
         ├──→ Comunicación interna via PRIVATE IP (172.31.79.241) ✅
         │
Docker/Microservices
└─ Escuchan en 0.0.0.0:puerto (accesible externamente dentro del container) ✅
```

## Cómo Funciona el Routing

### Paso 1: GitHub Actions detecta IPs

```bash
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].{
    Name:Tags[?Key=='Name'].Value|[0],
    PublicIP:PublicIpAddress,
    PrivateIP:PrivateIpAddress
  }"
```

**Output:**
```json
{
  "Name": "EC2-CORE",
  "PublicIP": "3.236.51.29",
  "PrivateIP": "172.31.79.241"
}
```

### Paso 2: SSH via Public IP

```bash
ssh -i ~/.ssh/id_rsa ubuntu@3.236.51.29
```

**Ruta de red:**
```
GitHub Runner (203.0.113.45)
    ↓
Internet
    ↓
AWS Public IP: 3.236.51.29
    ↓
EC2 Security Group (allows port 22)
    ↓
SSH Server en EC2
```

### Paso 3: Configurar servicios con Private IP

Dentro del SSH (en EC2):

```bash
# Actualizar docker-compose.yml con Private IP
sed -i "s|CORE_URL=.*|CORE_URL=http://172.31.79.241|g" .env

# Ou si es API Gateway:
sed -i "s|AUTH_SERVICE=.*|AUTH_SERVICE=http://172.31.79.241:3000|g" docker-compose.yml
```

**Ruta de red (desde API-GATEWAY a CORE):**
```
EC2-API-GATEWAY
    │ (Private IP: 172.31.79.241)
    │
VPC Internal Network (172.31.0.0/16)
    │
EC2-CORE
    │ (Private IP: 172.31.79.241)
    │
Docker Service (listening on 0.0.0.0:3000)
```

## El Problema Original

### ¿Por qué "Connection refused" al intentar usar 172.31.79.241?

```bash
# De EC2-API-GATEWAY, intenta conectar a micro-auth
curl http://172.31.79.241:3000/health

# ❌ Connection refused
# ¿Por qué?
```

**Razones posibles:**

1. **Docker service escucha en localhost (127.0.0.1)**
   ```dockerfile
   # En micro-auth/server.js
   app.listen(3000, "127.0.0.1")  # ❌ INCORRECTO
   app.listen(3000, "0.0.0.0")     # ✅ CORRECTO
   ```

2. **Security Group no permite tráfico entre EC2s**
   ```
   EC2-CORE Security Group:
   ├─ Inbound rule: TCP 3000 from 0.0.0.0/0 ✅ (abierto)
   └─ Inbound rule: TCP 3000 from 172.31.0.0/16 ✅ (VPC)
   ```

3. **El servicio no está exponiendo el puerto**
   ```bash
   # En EC2-CORE
   docker port micro-auth
   # Output: 3000/tcp -> 0.0.0.0:3000 ✅
   ```

## Solución: docker-compose con "0.0.0.0"

### docker-compose.ec2-core.yml (CORRECTO)

```yaml
version: '3.8'

networks:
  core-net:
    driver: bridge

services:
  micro-auth:
    build:
      context: .
      dockerfile: ./micro-auth/Dockerfile
    container_name: micro-auth
    ports:
      - "3000:3000"  # Expone hacia 0.0.0.0:3000
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URL=mongodb://mongo:27017/auth
    networks:
      - core-net
    depends_on:
      - mongo
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mongo:
    image: mongo:6
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    networks:
      - core-net

volumes:
  mongo_data:
```

**Análisis:**
- ✅ `ports: "3000:3000"` → Docker expone a `0.0.0.0:3000` por defecto
- ✅ `networks: core-net` → Interno puede usar DNS `micro-auth` o `localhost`
- ✅ Externamente accesible via `PRIVATE_IP:3000`

## Comunicación: Comparación

### Desde DENTRO del Docker Network (core-net)

```bash
# Container: micro-estudiantes
curl http://micro-auth:3000/health  ✅ (usa DNS de Docker)
curl http://127.0.0.1:3000/health   ✅ (localhost funciona)
curl http://172.31.79.241:3000/health ⚠️ (sale de la red docker, no recomendado)
```

### Desde EC2-API-GATEWAY (diferente red Docker)

```bash
# INCORRECTO:
curl http://localhost:3000/health          ❌ (es su propio localhost)
curl http://micro-auth:3000/health         ❌ (DNS no existe en su red)

# CORRECTO:
curl http://172.31.79.241:3000/health      ✅ (Private IP del CORE)
```

## Actualización Automática en el Workflow

### Parte 1: Detectar IPs (Una sola vez)

```bash
# En GitHub Actions
aws ec2 describe-instances ... → PUBLIC_IP="3.236.51.29"
                             → PRIVATE_IP="172.31.79.241"
```

### Parte 2: Usar en SSH

```bash
# SSH a EC2 usando PUBLIC_IP
ssh ubuntu@$PUBLIC_IP
```

### Parte 3: Configurar con PRIVATE_IP

```bash
# Dentro de EC2, actualizar configuración
sed -i "s|CORE_URL=.*|CORE_URL=http://$PRIVATE_IP:3000|g" .env
```

### Parte 4: Servicios dentro de Docker

```bash
# Dentro de docker-compose.yml para EC2-API-GATEWAY
environment:
  AUTH_SERVICE_URL: http://172.31.79.241:3000  # PRIVATE_IP
  ESTUDIANTES_SERVICE_URL: http://172.31.79.241:3001
  # etc...
```

## Security Group Verification

### Requisitos Mínimos

```
EC2-CORE Security Group:
┌─ Inbound Rules
│  ├─ SSH (22):        from 0.0.0.0/0 (para GitHub Actions)
│  ├─ HTTP (80):       from 0.0.0.0/0 (public access)
│  ├─ HTTPS (443):     from 0.0.0.0/0 (public access)
│  ├─ Microservices:   from 172.31.0.0/16 (VPC - for EC2-API-GATEWAY)
│  │  ├─ 3000-3005:    TCP from 172.31.0.0/16
│  │  └─ 27017:        TCP from 172.31.0.0/16 (MongoDB)
│  └─ Postgres (5432): from 172.31.0.0/16
│
└─ Outbound Rules (usually allow all)
   └─ All traffic to 0.0.0.0/0

EC2-API-GATEWAY Security Group:
├─ Inbound Rules
│  ├─ SSH (22):        from 0.0.0.0/0
│  └─ HTTP (8080):     from 0.0.0.0/0
└─ Outbound Rules
   └─ All traffic (to reach CORE services at 172.31.79.241)
```

**¿Cómo verificar?**

```bash
# En AWS Console
EC2 → Instances → EC2-CORE → Security → Inbound Rules

# O vía AWS CLI:
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx \
  --query 'SecurityGroups[0].IpPermissions'
```

## Flujo Completo de Despliegue

```
┌─────────────────────────────────────────────────┐
│      GitHub Actions Workflow Triggered         │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  1. Configure AWS Credentials (from Secrets)   │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  2. Query EC2 API                              │
│     → Find instances by Name tag               │
│     → Extract PUBLIC_IP & PRIVATE_IP           │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  3. SSH to Instance via PUBLIC_IP              │
│     (3.236.51.29 for EC2-CORE)                │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  4. Clone Repository                           │
│     (pulls latest code with docker-compose)    │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  5. Update Configuration                       │
│     For API-GATEWAY:                           │
│       sed "CORE_IP" → 172.31.79.241           │
│     For CORE:                                  │
│       Use internal Docker network (localhost)  │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  6. Build & Deploy                             │
│     docker-compose build                       │
│     docker-compose up -d                       │
└────────────────────┬────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  7. Verify                                     │
│     docker-compose ps                          │
│     docker-compose logs                        │
└─────────────────────────────────────────────────┘
```

## Test Manual

### Desde tu computadora:

```bash
# 1. SSH a EC2-CORE
ssh -i "tu-key.pem" ubuntu@3.236.51.29

# 2. Ya estás en EC2-CORE, verifica conectividad a EC2-API-GATEWAY
ping 172.31.79.241  # Should work (same VPC)

# 3. Si EC2-API-GATEWAY tiene un servicio corriendo:
curl http://172.31.79.241:8080/health

# 4. Si EC2-CORE tiene micro-auth:
curl http://localhost:3000/health  # Funciona localmente
curl http://172.31.79.241:3000/health  # Funciona desde otro EC2
```

### Desde EC2-API-GATEWAY:

```bash
# SSH a API-GATEWAY
ssh -i "tu-key.pem" ubuntu@52.7.168.4

# Verifica que puede alcanzar CORE
curl http://172.31.79.241:3000/health  # Should return 200 OK
```

## Conclusión

✅ **Lo importante es entender:**

1. **Dentro de la VPC**: Usa PRIVATE_IP (172.31.x.x)
2. **Desde internet**: Usa PUBLIC_IP (3.x.x.x)
3. **GitHub Actions**: SSH via PUBLIC, configura con PRIVATE
4. **Docker**: Listen en 0.0.0.0, accede via PRIVATE_IP desde afuera
5. **Workflow automático**: Detecta IPs dinámicamente, sin hardcoding

Tu workflow ahora hace exactamente eso. 🚀
