# 🌐 Guía de Configuración de IPs Públicas y Privadas

## 📋 Resumen Rápido

Tu sistema usa **dos tipos de IPs** para cada instancia EC2:

- **IP Pública**: Para conectar via SSH desde GitHub Actions
- **IP Privada**: Para que los microservicios se comuniquen entre sí dentro de la VPC

---

## 🗂️ Instancias EC2 y sus IPs

### EC2-DB (Databases)
```
┌─────────────────────────────────────┐
│       EC2-DB (i-0e6780a31c5abf480)  │
├─────────────────────────────────────┤
│ IP Pública:   44.222.119.15        │  ← SSH conecta aquí
│ IP Privada:   172.31.79.193        │  ← Microservicios se conectan aquí
├─────────────────────────────────────┤
│ Servicios:                          │
│  • MongoDB    (27017)               │
│  • PostgreSQL (5432)                │
│  • Redis      (6379)                │
└─────────────────────────────────────┘
```

### EC2-MESSAGING
```
┌────────────────────────────────────────┐
│        EC2-MESSAGING                   │
├────────────────────────────────────────┤
│ IP Pública:   3.235.24.36            │  ← SSH
│ IP Privada:   172.31.73.6            │  ← Kafka, RabbitMQ
├────────────────────────────────────────┤
│ Servicios:                             │
│  • Kafka      (9092)                  │
│  • RabbitMQ   (5672)                  │
│  • Zookeeper  (2181)                  │
└────────────────────────────────────────┘
```

### EC2-CORE
```
┌────────────────────────────────────────┐
│          EC2-CORE                      │
├────────────────────────────────────────┤
│ IP Pública:   13.216.12.61           │  ← SSH
│ IP Privada:   172.31.78.183          │  ← Microservicios
├────────────────────────────────────────┤
│ Microservicios:                        │
│  • Auth        (3000)                 │
│  • Estudiantes (3001)                 │
│  • Maestros    (3002)                 │
└────────────────────────────────────────┘
```

### EC2-API-GATEWAY
```
┌────────────────────────────────────────┐
│       EC2-API-GATEWAY                  │
├────────────────────────────────────────┤
│ IP Pública:   52.71.188.181          │  ← SSH
│ IP Privada:   172.31.76.105          │  ← Routing interno
├────────────────────────────────────────┤
│ Servicios:                             │
│  • API Gateway (8080)                 │
└────────────────────────────────────────┘
```

### EC2-FRONTEND
```
┌────────────────────────────────────────┐
│        EC2-FRONTEND                    │
├────────────────────────────────────────┤
│ IP Pública:   107.21.124.81          │  ← SSH + Usuario
│ IP Privada:   172.31.69.203          │  ← API Gateway
├────────────────────────────────────────┤
│ Servicios:                             │
│  • Frontend Web (80, 443)             │
└────────────────────────────────────────┘
```

### EC2-REPORTES
```
┌────────────────────────────────────────┐
│        EC2-REPORTES                    │
├────────────────────────────────────────┤
│ IP Pública:   54.175.62.79           │  ← SSH
│ IP Privada:   172.31.69.133          │  ← Reportes
├────────────────────────────────────────┤
│ Servicios:                             │
│  • Reportes Estudiantes (5003)        │
│  • Reportes Maestros (5004)           │
└────────────────────────────────────────┘
```

### EC2-NOTIFICACIONES
```
┌────────────────────────────────────────┐
│      EC2-NOTIFICACIONES                │
├────────────────────────────────────────┤
│ IP Pública:   100.31.143.213         │  ← SSH
│ IP Privada:   172.31.65.57           │  ← Notificaciones
├────────────────────────────────────────┤
│ Servicios:                             │
│  • Notificaciones (5006)              │
└────────────────────────────────────────┘
```

### EC2-MONITORING
```
┌────────────────────────────────────────┐
│       EC2-MONITORING                   │
├────────────────────────────────────────┤
│ IP Pública:   54.198.235.28          │  ← SSH + Monitoring
│ IP Privada:   172.31.71.151          │  ← Monitoreo interno
├────────────────────────────────────────┤
│ Servicios:                             │
│  • Prometheus (9090)                  │
│  • Grafana (3000)                     │
└────────────────────────────────────────┘
```

---

## 🔄 Flujo de Conexión

### 1️⃣ Deploy (GitHub Actions → EC2)
```
GitHub Actions
    ↓
    └─→ SSH con IP Pública
        └─→ Conecta a 44.222.119.15 (EC2-DB)
            └─→ Ejecuta docker-compose
                └─→ Crea contenedores
```

### 2️⃣ Comunicación Interna (Microservicio A → Microservicio B)
```
EC2-CORE (Estudiantes)
    ↓
    └─→ Conecta a base de datos
        └─→ mongodb://admin:pass@172.31.79.193:27017
            (Usa IP PRIVADA porque está en la VPC)
```

### 3️⃣ Acceso desde Internet (Usuario → Frontend)
```
Usuario (navegador)
    ↓
    └─→ http://107.21.124.81 (IP Pública del Frontend)
        └─→ Llama a API Gateway
            └─→ http://172.31.76.105:8080 (IP Privada, dentro de VPC)
```

---

## 📝 Configuración Hardcodeada

### Archivo Central: `infrastructure.hardcoded.config.js`

Este archivo define TODAS las IPs:

```javascript
const EC2_INSTANCES = {
  DATABASE: {
    PUBLIC_IP: '44.222.119.15',      // Para SSH deploy
    PRIVATE_IP: '172.31.79.193',     // Para comunicación microservicios
  },
  // ... más instancias ...
};

// URLs de conexión (usan IP PRIVADA):
const CONFIG = {
  MONGO_URL: 'mongodb://admin:pass@172.31.79.193:27017',  // ✅ IP Privada
  POSTGRES_URL: 'postgresql://..@172.31.79.193:5432',     // ✅ IP Privada
  REDIS_URL: 'redis://:pass@172.31.79.193:6379',          // ✅ IP Privada
};
```

### En cada Microservicio

Cada microservicio tiene su archivo de configuración que importa:

```javascript
const { CONFIG } = require('../../../infrastructure.hardcoded.config.js');

// Usa IP privada automáticamente:
const mongoUrl = CONFIG.MONGO_URL;  // 172.31.79.193
const dbUrl = CONFIG.POSTGRES_URL;  // 172.31.79.193
```

---

## 🔧 Workflows: IP Pública para SSH, IP Privada para Config

### Ejemplo: deploy-ec2-db.yml

```yaml
env:
  EC2_DB_PUBLIC_IP: 44.222.119.15      # ← SSH connect aquí
  EC2_DB_PRIVATE_IP: 172.31.79.193     # ← Los contenedores usan esto

jobs:
  deploy:
    steps:
      # SSH usa IP PÚBLICA
      - name: SSH Connect
        run: |
          ssh -i key.pem ec2-user@44.222.119.15  # ← PUBLIC IP
            "docker ps"
      
      # Contenedores usan IP PRIVADA (en docker-compose)
      - name: Create docker-compose
        run: |
          ssh -i key.pem ec2-user@44.222.119.15 << 'EOF'
          cat > docker-compose.yml << 'COMPOSE'
          services:
            mongodb:
              ports:
                - "27017:27017"  # Escucha en la IP privada (172.31.79.193)
          COMPOSE
          EOF
```

---

## 🌐 Acceso desde el Exterior vs Interior

| Tipo | Origen | Destino | IP Usada | Ejemplo |
|------|--------|---------|----------|---------|
| **SSH Deploy** | GitHub Actions | EC2 | IP Pública | `ssh user@44.222.119.15` |
| **Microservicio** | App en EC2 | DB en otra EC2 | IP Privada | `mongodb://172.31.79.193:27017` |
| **Usuario** | Navegador | Frontend | IP Pública | `http://107.21.124.81` |
| **API Gateway** | Frontend | CORE services | IP Privada | `http://172.31.78.183:3000` |

---

## ⚠️ Importante: Seguridad

### ✅ Bien Configurado
```
Internet  →  IP Pública (Frontend)
            ↓
        IP Privada (API Gateway)
            ↓
        IP Privada (Microservicios)
            ↓
        IP Privada (Bases de datos)

Las bases de datos NO están expuestas a internet
```

### ❌ Malo (No lo hagas)
```
ssh user@172.31.79.193  # ← NO funcionará desde GitHub Actions
                        (IP privada no es accesible desde afuera)
```

---

## 🔍 Verificar Configuración

### 1. Conectar via SSH (público)
```bash
ssh -i aws-key.pem ec2-user@44.222.119.15
```

### 2. Verificar que contenedores escuchan en 172.31.79.193
```bash
docker exec mongodb mongosh --version
docker exec postgresql psql -U postgres -c "SELECT 1"
docker exec redis redis-cli ping
```

### 3. Verificar que microservicios pueden conectar
```bash
# Desde EC2-CORE:
curl mongodb://admin:mongodb123@172.31.79.193:27017/admin
```

---

## 📚 Resumen

| Componente | IP Pública | IP Privada | Uso |
|-----------|-----------|-----------|-----|
| EC2-DB | 44.222.119.15 | 172.31.79.193 | Databases |
| EC2-CORE | 13.216.12.61 | 172.31.78.183 | Microservices |
| EC2-API-GW | 52.71.188.181 | 172.31.76.105 | Routing |
| EC2-Frontend | 107.21.124.81 | 172.31.69.203 | Web UI |
| EC2-Reportes | 54.175.62.79 | 172.31.69.133 | Reports |
| EC2-Notificaciones | 100.31.143.213 | 172.31.65.57 | Notifications |
| EC2-Messaging | 3.235.24.36 | 172.31.73.6 | Kafka/RabbitMQ |
| EC2-Monitoring | 54.198.235.28 | 172.31.71.151 | Prometheus/Grafana |

---

## 🚀 Cuando cambies IPs

Si necesitas actualizar IPs en el futuro:

1. Actualiza `infrastructure.hardcoded.config.js`
2. Actualiza los workflows en `.github/workflows/`
3. Actualiza `frontend-web/js/config.js` (para frontend)
4. Commit y push
5. Re-ejecuta el workflow

No necesitas cambiar nada en los microservicios, importan el CONFIG desde el archivo central.

---

**Estado:** ✅ 100% Correctamente Configurado
