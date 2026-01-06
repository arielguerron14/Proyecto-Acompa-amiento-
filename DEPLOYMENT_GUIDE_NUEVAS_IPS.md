# 🚀 GUÍA DE DEPLOYMENT - INSTANCIAS SEPARADAS

## 📋 Tabla de Contenidos
1. [Resumen de IPs](#resumen-de-ips)
2. [Pre-requisitos](#pre-requisitos)
3. [Paso a Paso del Deployment](#paso-a-paso-del-deployment)
4. [Validación Post-Deployment](#validación-post-deployment)
5. [Troubleshooting](#troubleshooting)
6. [Rollback](#rollback)

---

## 🎯 Resumen de IPs

```
┌─────────────────────┬─────────────────┬─────────────────┬────────────┐
│ Instancia           │ IP Pública      │ IP Privada      │ Elastic IP │
├─────────────────────┼─────────────────┼─────────────────┼────────────┤
│ EC2-CORE            │ 13.216.12.61    │ 172.31.78.183   │ ✅ Sí      │
│ EC2-API-Gateway     │ 52.71.188.181   │ 172.31.76.105   │ ✅ Sí      │
│ EC2-Frontend        │ 107.21.124.81   │ 172.31.69.203   │ ✅ Sí      │
│ EC2-Reportes        │ 54.175.62.79    │ 172.31.69.133   │ ✅ Sí      │
│ EC2-Notificaciones  │ 100.31.143.213  │ 172.31.65.57    │ ❌ No      │
│ EC2-Messaging       │ 3.235.24.36     │ 172.31.73.6     │ ❌ No      │
│ EC2-Monitoring      │ 54.198.235.28   │ 172.31.71.151   │ ✅ Sí      │
│ EC2-DB              │ 44.222.119.15   │ 172.31.79.193   │ ❌ No      │
└─────────────────────┴─────────────────┴─────────────────┴────────────┘
```

---

## ✅ Pre-requisitos

### 1. En tu máquina local

```bash
# Clonar repositorio
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-

# Verificar archivos de configuración
ls -la infrastructure-instances.config.js
ls -la docker-compose.*.yml
```

### 2. Preparar credenciales AWS

```bash
# Exportar credenciales
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_DEFAULT_REGION=us-east-1

# Verificar acceso
aws ec2 describe-instances --region us-east-1
```

### 3. Preparar claves SSH

```bash
# Copiar claves privadas a ~/.ssh/
mkdir -p ~/.ssh
cp /path/to/your/keys/* ~/.ssh/
chmod 600 ~/.ssh/*

# Testear acceso a una instancia
ssh -i ~/.ssh/your-key.pem ec2-user@13.216.12.61 "echo 'Conexión OK'"
```

### 4. Variables de entorno

```bash
# Crear .env con variables sensibles
cat > .env << EOF
JWT_SECRET=tu-secreto-jwt-super-seguro
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-app
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
EOF

# Copiar a todas las instancias (se hace en cada paso)
```

---

## 🚀 Paso a Paso del Deployment

### PASO 1: Deploy Base de Datos (EC2-DB)

**⚠️ PRIMERO**: Bases de datos deben estar up antes de los servicios

```bash
#!/bin/bash
# deploy-db.sh

INSTANCE_IP="44.222.119.15"
PRIVATE_IP="172.31.79.193"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🔧 [1/3] Conectar a EC2-DB..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Actualizar sistema
  sudo yum update -y
  
  # Instalar Docker
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Instalar Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

echo "📁 [2/3] Copiar archivos..."
scp -i $KEY_FILE docker-compose.databases.yml $USER@$INSTANCE_IP:/tmp/
scp -i $KEY_FILE databases/docker-compose.yml $USER@$INSTANCE_IP:/tmp/

echo "🚀 [3/3] Iniciar servicios..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  cd /tmp
  docker-compose -f docker-compose.databases.yml up -d
  
  # Esperar a que esté listo
  sleep 30
  
  # Verificar estado
  docker ps
  
EOF

echo "✅ EC2-DB Deployment Complete"
```

**Ejecutar**:
```bash
chmod +x deploy-db.sh
./deploy-db.sh
```

**Validar**:
```bash
ssh -i ~/.ssh/your-key.pem ec2-user@172.31.79.193 "docker ps"
# Debe mostrar MongoDB, PostgreSQL, Redis corriendo
```

---

### PASO 2: Deploy Messaging (EC2-Messaging)

**⚠️ ANTES DE** servicios que usan Kafka/RabbitMQ

```bash
#!/bin/bash
# deploy-messaging.sh

INSTANCE_IP="3.235.24.36"
PRIVATE_IP="172.31.73.6"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🔧 [1/3] Conectar a EC2-Messaging..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Actualizar sistema
  sudo yum update -y
  
  # Instalar Docker
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Instalar Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

echo "📁 [2/3] Copiar archivos..."
scp -i $KEY_FILE docker-compose.messaging.yml $USER@$INSTANCE_IP:/tmp/

echo "🚀 [3/3] Iniciar servicios..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  cd /tmp
  docker-compose -f docker-compose.messaging.yml up -d
  
  # Esperar a que Zookeeper inicie
  sleep 15
  
  # Verificar estado
  docker ps
  
EOF

echo "✅ EC2-Messaging Deployment Complete"
```

**Ejecutar**:
```bash
chmod +x deploy-messaging.sh
./deploy-messaging.sh
```

---

### PASO 3: Deploy Monitoring (EC2-Monitoring)

```bash
#!/bin/bash
# deploy-monitoring.sh

INSTANCE_IP="54.198.235.28"
PRIVATE_IP="172.31.71.151"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🔧 Conectar a EC2-Monitoring..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Preparar instancia
  sudo yum update -y
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

echo "📁 Copiar archivos..."
scp -i $KEY_FILE docker-compose.monitoring.yml $USER@$INSTANCE_IP:/tmp/
scp -i $KEY_FILE monitoring/prometheus.yml $USER@$INSTANCE_IP:/tmp/ 2>/dev/null || echo "Crear prometheus.yml en EC2"

echo "🚀 Iniciar servicios..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  cd /tmp
  docker-compose -f docker-compose.monitoring.yml up -d
  sleep 10
  docker ps
  
EOF

echo "✅ EC2-Monitoring Deployment Complete"
echo "🔍 Acceder a: http://54.198.235.28:9090 (Prometheus)"
echo "📊 Acceder a: http://54.198.235.28:3001 (Grafana)"
```

---

### PASO 4: Deploy EC2-CORE (Microservicios)

```bash
#!/bin/bash
# deploy-core.sh

INSTANCE_IP="13.216.12.61"
PRIVATE_IP="172.31.78.183"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🔧 Conectar a EC2-CORE..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Preparar instancia
  sudo yum update -y
  sudo yum install -y docker git
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

echo "📁 Copiar archivos..."
scp -i $KEY_FILE docker-compose.core.yml $USER@$INSTANCE_IP:/tmp/
scp -i $KEY_FILE .env $USER@$INSTANCE_IP:/tmp/ 2>/dev/null || echo "⚠️ .env no encontrado"

echo "🚀 Iniciar servicios..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  cd /tmp
  cp .env .env.local 2>/dev/null || true
  
  docker-compose -f docker-compose.core.yml up -d
  sleep 20
  docker ps
  
  # Verificar logs
  docker logs micro-auth | tail -20
  
EOF

echo "✅ EC2-CORE Deployment Complete"
echo "🔐 auth disponible en: http://13.216.12.61:3000"
echo "👥 estudiantes disponible en: http://13.216.12.61:3001"
echo "👨‍🏫 maestros disponible en: http://13.216.12.61:3002"
```

---

### PASO 5: Deploy EC2-API-Gateway

```bash
#!/bin/bash
# deploy-api-gateway.sh

INSTANCE_IP="52.71.188.181"
PRIVATE_IP="172.31.76.105"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🔧 Conectar a EC2-API-Gateway..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Preparar instancia
  sudo yum update -y
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

echo "📁 Copiar archivos..."
scp -i $KEY_FILE docker-compose.api-gateway.yml $USER@$INSTANCE_IP:/tmp/
scp -i $KEY_FILE .env $USER@$INSTANCE_IP:/tmp/ 2>/dev/null || true

echo "🚀 Iniciar servicios..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  cd /tmp
  cp .env .env.local 2>/dev/null || true
  
  docker-compose -f docker-compose.api-gateway.yml up -d
  sleep 15
  docker ps
  
  # Verificar logs
  docker logs api-gateway | tail -20
  
EOF

echo "✅ EC2-API-Gateway Deployment Complete"
echo "🔗 API Gateway disponible en: http://52.71.188.181:8080"
```

---

### PASO 6: Deploy EC2-Frontend

```bash
#!/bin/bash
# deploy-frontend.sh

INSTANCE_IP="107.21.124.81"
PRIVATE_IP="172.31.69.203"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🔧 Conectar a EC2-Frontend..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Preparar instancia
  sudo yum update -y
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

echo "📁 Copiar archivos..."
scp -i $KEY_FILE docker-compose.frontend.yml $USER@$INSTANCE_IP:/tmp/
scp -r -i $KEY_FILE frontend-web $USER@$INSTANCE_IP:/tmp/

echo "🚀 Iniciar servicios..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  cd /tmp
  docker-compose -f docker-compose.frontend.yml up -d
  sleep 15
  docker ps
  
EOF

echo "✅ EC2-Frontend Deployment Complete"
echo "🌐 Frontend disponible en: http://107.21.124.81"
```

---

### PASO 7: Deploy EC2-Reportes

```bash
#!/bin/bash
# deploy-reportes.sh

INSTANCE_IP="54.175.62.79"
PRIVATE_IP="172.31.69.133"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🚀 Deploying EC2-Reportes..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Setup
  sudo yum update -y
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

scp -i $KEY_FILE docker-compose.reportes.yml $USER@$INSTANCE_IP:/tmp/
scp -i $KEY_FILE .env $USER@$INSTANCE_IP:/tmp/ 2>/dev/null || true

ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'
  cd /tmp
  docker-compose -f docker-compose.reportes.yml up -d
  sleep 15
  docker ps
EOF

echo "✅ EC2-Reportes Deployment Complete"
```

---

### PASO 8: Deploy EC2-Notificaciones

```bash
#!/bin/bash
# deploy-notificaciones.sh

INSTANCE_IP="100.31.143.213"
PRIVATE_IP="172.31.65.57"
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

echo "🚀 Deploying EC2-Notificaciones..."
ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'

  # Setup
  sudo yum update -y
  sudo yum install -y docker
  sudo systemctl start docker
  sudo usermod -aG docker ec2-user
  
  # Docker Compose
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  
EOF

scp -i $KEY_FILE docker-compose.notificaciones.yml $USER@$INSTANCE_IP:/tmp/
scp -i $KEY_FILE .env $USER@$INSTANCE_IP:/tmp/ 2>/dev/null || true

ssh -i $KEY_FILE $USER@$INSTANCE_IP << 'EOF'
  cd /tmp
  docker-compose -f docker-compose.notificaciones.yml up -d
  sleep 15
  docker ps
EOF

echo "✅ EC2-Notificaciones Deployment Complete"
```

---

## 📊 Validación Post-Deployment

### Checklist de Validación

```bash
#!/bin/bash
# validate-deployment.sh

echo "🔍 VALIDACIÓN DE DEPLOYMENT"
echo "================================"

# 1. Validar EC2-DB
echo "✓ Validando EC2-DB..."
ssh -i ~/.ssh/your-key.pem ec2-user@44.222.119.15 "docker ps | grep -E 'mongo|postgres|redis'" && echo "  ✅ BD corriendo" || echo "  ❌ BD FALLÓ"

# 2. Validar EC2-CORE
echo "✓ Validando EC2-CORE..."
curl -s http://13.216.12.61:3000/health | jq . > /dev/null 2>&1 && echo "  ✅ Servicios OK" || echo "  ❌ Servicios FALLÓ"

# 3. Validar EC2-API-Gateway
echo "✓ Validando EC2-API-Gateway..."
curl -s http://52.71.188.181:8080/health | jq . > /dev/null 2>&1 && echo "  ✅ Gateway OK" || echo "  ❌ Gateway FALLÓ"

# 4. Validar EC2-Frontend
echo "✓ Validando EC2-Frontend..."
curl -s http://107.21.124.81 | grep -q "<!DOCTYPE" && echo "  ✅ Frontend OK" || echo "  ❌ Frontend FALLÓ"

# 5. Validar EC2-Monitoring
echo "✓ Validando EC2-Monitoring..."
curl -s http://54.198.235.28:9090/-/healthy | grep -q "Prometheus" && echo "  ✅ Prometheus OK" || echo "  ❌ Prometheus FALLÓ"

echo ""
echo "================================"
echo "✅ VALIDACIÓN COMPLETADA"
```

---

## 🔧 Troubleshooting

### Error: "Connection refused"

```bash
# Verificar si el servicio está corriendo
ssh -i ~/.ssh/your-key.pem ec2-user@IP "docker ps"

# Revisar logs
ssh -i ~/.ssh/your-key.pem ec2-user@IP "docker logs nombre-servicio"

# Reintentar
ssh -i ~/.ssh/your-key.pem ec2-user@IP "docker-compose up -d"
```

### Error: "No route to host"

```bash
# Verificar security groups en AWS
aws ec2 describe-security-groups --filters Name=group-name,Values=default

# Agregar regla de entrada (ej. para puerto 3000)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxx \
  --protocol tcp \
  --port 3000 \
  --source-group sg-yyyyyy
```

### Error: "Database connection refused"

```bash
# Verificar que EC2-DB está running
ssh -i ~/.ssh/your-key.pem ec2-user@44.222.119.15 "docker ps"

# Testear conectividad desde otro servicio
ssh -i ~/.ssh/your-key.pem ec2-user@13.216.12.61 "nc -zv 172.31.79.193 5432"
```

---

## ↩️ Rollback

### Rollback de una instancia

```bash
#!/bin/bash
# rollback.sh INSTANCE_IP SERVICE_NAME

INSTANCE_IP=$1
SERVICE_NAME=$2
KEY_FILE="~/.ssh/your-key.pem"
USER="ec2-user"

ssh -i $KEY_FILE $USER@$INSTANCE_IP << EOF
  docker-compose down
  # Restaurar versión anterior si está en git
  git reset --hard HEAD~1
  docker-compose up -d
EOF
```

**Uso**:
```bash
./rollback.sh 13.216.12.61 micro-auth
```

---

## 📝 Resumen de Deployment Order

```
1️⃣  EC2-DB              (Base de datos)
2️⃣  EC2-Messaging       (Kafka, RabbitMQ)
3️⃣  EC2-Monitoring      (Prometheus, Grafana)
4️⃣  EC2-CORE            (micro-auth, estudiantes, maestros)
5️⃣  EC2-API-Gateway     (Proxy reverso)
6️⃣  EC2-Frontend        (Sitio web)
7️⃣  EC2-Reportes        (Reportes)
8️⃣  EC2-Notificaciones  (Notificaciones)
```

---

**Versión**: 2.0  
**Actualizado**: Enero 2026  
**Status**: 🟢 Listo para usar
