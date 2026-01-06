# 🏗️ ARQUITECTURA DE DEPLOYMENT REVISADA

## Estructura Actual vs Propuesta

### ❌ ESTRUCTURA ANTERIOR (8 Instancias Separadas)
```
EC2-DB                   → IP Pública (no necesaria)
EC2-MESSAGING           → IP Pública (no necesaria)
EC2-CORE                → IP Pública (necesaria)
EC2-API-GATEWAY         → IP Pública (necesaria)
EC2-FRONTEND            → IP Pública (necesaria)
EC2-REPORTES            → IP Pública (necesaria)
EC2-NOTIFICACIONES      → IP Pública (no necesaria)
EC2-MONITORING          → IP Pública (necesaria)
```

**Problema:** 8 instancias, muchas con IP pública que no necesitan

---

### ✅ ESTRUCTURA PROPUESTA (5 + 3 Instancias)

#### **GRUPO 1: INSTANCIAS CON IP PÚBLICA FIJA (5 total)**

```
┌────────────────────────────────────────────────────────────┐
│  1️⃣  EC2-CORE-PUBLIC (IP Pública Fija)                    │
│  ├─ Auth Service (3000)                                   │
│  ├─ Estudiantes Service (3001)                            │
│  └─ Maestros Service (3002)                               │
│  SSH: ec2-user@[IP_PUBLICA]                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  2️⃣  EC2-API-GATEWAY-PUBLIC (IP Pública Fija)             │
│  ├─ API Gateway Router (8080)                             │
│  └─ Load Balancer para microservicios                     │
│  SSH: ec2-user@[IP_PUBLICA]                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  3️⃣  EC2-FRONTEND-PUBLIC (IP Pública Fija)                │
│  ├─ Web UI (80, 443)                                      │
│  └─ Acceso desde navegador                                │
│  SSH: ec2-user@[IP_PUBLICA]                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  4️⃣  EC2-REPORTES-PUBLIC (IP Pública Fija)                │
│  ├─ Reportes Estudiantes (5003)                           │
│  ├─ Reportes Maestros (5004)                              │
│  └─ Dashboard de reportes                                 │
│  SSH: ec2-user@[IP_PUBLICA]                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  5️⃣  EC2-MONITORING-PUBLIC (IP Pública Fija)              │
│  ├─ Prometheus (9090)                                     │
│  ├─ Grafana (3000)                                        │
│  └─ Alertas y monitoring                                  │
│  SSH: ec2-user@[IP_PUBLICA]                              │
└────────────────────────────────────────────────────────────┘
```

---

#### **GRUPO 2: INSTANCIAS PRIVADAS (SIN IP Pública - 3 total)**

```
┌────────────────────────────────────────────────────────────┐
│  6️⃣  EC2-DATABASES-PRIVATE (Solo IP Privada)              │
│  ├─ MongoDB (27017)                                       │
│  ├─ PostgreSQL (5432)                                     │
│  └─ Redis (6379)                                          │
│  SSH: Via EC2-CORE-PUBLIC (bastión)                       │
│                                                             │
│  ⚠️  NO EXPUESTA A INTERNET                               │
│  ✅ Accesible solo desde VPC                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  7️⃣  EC2-MESSAGING-PRIVATE (Solo IP Privada)              │
│  ├─ Kafka (9092)                                          │
│  ├─ RabbitMQ (5672)                                       │
│  └─ Zookeeper (2181)                                      │
│  SSH: Via EC2-CORE-PUBLIC (bastión)                       │
│                                                             │
│  ⚠️  NO EXPUESTA A INTERNET                               │
│  ✅ Accesible solo desde VPC                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  8️⃣  EC2-ANALYTICS-PRIVATE (Solo IP Privada)              │
│  ├─ ELK Stack (Elasticsearch, Logstash, Kibana)          │
│  ├─ Data Warehouse                                        │
│  └─ Analytics en tiempo real                              │
│  SSH: Via EC2-CORE-PUBLIC (bastión)                       │
│                                                             │
│  ⚠️  NO EXPUESTA A INTERNET                               │
│  ✅ Accesible solo desde VPC                              │
└────────────────────────────────────────────────────────────┘
```

---

## 🌐 Flujo de Tráfico

### Usuario desde Internet
```
Usuario (navegador)
  ↓
http://[IP_PUBLICA_FRONTEND] (EC2-FRONTEND-PUBLIC)
  ↓
Frontend Web UI (80/443)
  ↓
Llama a API Gateway (http://[IP_PRIVADA_GATEWAY]:8080)
  ↓
API Gateway enruta a microservicios (IP privada)
  ↓
Microservicios conectan a BD (IP privada, misma VPC)
```

### Operador SSH (Deploy)
```
GitHub Actions o Terminal Local
  ↓
ssh -i key.pem ec2-user@[IP_PUBLICA_CORE] (EC2-CORE-PUBLIC)
  ↓
Instancia pública como BASTION
  ↓
Desde bastión: ssh ec2-user@[IP_PRIVADA_DATABASES]
  ↓
Acceso a instancias privadas
```

### Comunicación Interna (VPC)
```
EC2-CORE-PUBLIC (172.31.78.183)
  ↓
Conecta a:
  • EC2-DATABASES-PRIVATE (172.31.79.193) - Mismo VPC
  • EC2-MESSAGING-PRIVATE (172.31.73.6) - Mismo VPC
  • EC2-ANALYTICS-PRIVATE (172.31.XX.XX) - Mismo VPC
  ↓
Todo en IP privada (seguro)
```

---

## 📊 Tabla de IPs

| Instancia | Tipo | IP Pública | IP Privada | Puertos Públicos | SSH |
|-----------|------|-----------|-----------|-----------------|-----|
| **EC2-CORE-PUBLIC** | Pública | ✅ 13.216.12.61 | 172.31.78.183 | - | ✅ |
| **EC2-API-GATEWAY-PUBLIC** | Pública | ✅ 52.71.188.181 | 172.31.76.105 | 8080 | ✅ |
| **EC2-FRONTEND-PUBLIC** | Pública | ✅ 107.21.124.81 | 172.31.69.203 | 80, 443 | ✅ |
| **EC2-REPORTES-PUBLIC** | Pública | ✅ 54.175.62.79 | 172.31.69.133 | 5003, 5004 | ✅ |
| **EC2-MONITORING-PUBLIC** | Pública | ✅ 54.198.235.28 | 172.31.71.151 | 3000, 9090 | ✅ |
| EC2-DATABASES-PRIVATE | Privada | ❌ Ninguna | 172.31.79.193 | Ninguno | Via Bastión |
| EC2-MESSAGING-PRIVATE | Privada | ❌ Ninguna | 172.31.73.6 | Ninguno | Via Bastión |
| EC2-ANALYTICS-PRIVATE | Privada | ❌ Ninguna | 172.31.XX.XX | Ninguno | Via Bastión |

---

## 🔐 Seguridad

### ✅ Instancias Públicas (5)
- IP pública para acceso controlado
- SSH desde GitHub Actions
- Puertos específicos expuestos (80, 443, 8080, 5003, 5004)
- Security Groups restrictivos

### ✅ Instancias Privadas (3)
- **Sin IP pública** (máxima privacidad)
- Acceso SOLO desde VPC (IP privada)
- SSH solo via bastión (EC2-CORE-PUBLIC)
- No expuestas a internet

### ✅ Bastión (Bastion Host)
- EC2-CORE-PUBLIC actúa como bastión
- Única puerta de entrada a instancias privadas
- Todos los SSH van por aquí

---

## 🚀 Workflows Necesarios

### Workflow Principal
```
deploy-all-services.yml (MAESTRO)
  ↓
1. deploy-ec2-core-public.yml (SSH a IP pública)
   └─ Instala y configura Auth, Estudiantes, Maestros
   └─ Después puede conectar a instancias privadas
  ↓
2. deploy-ec2-databases-private.yml (SSH via bastión)
   └─ SSH: ssh -J bastión@IP_PUBLICA -i key ec2-user@IP_PRIVADA
   └─ Instala MongoDB, PostgreSQL, Redis
  ↓
3. deploy-ec2-messaging-private.yml (SSH via bastión)
   └─ Kafka, RabbitMQ, Zookeeper
  ↓
4. deploy-ec2-api-gateway-public.yml (SSH a IP pública)
   └─ API Gateway
  ↓
5. deploy-ec2-frontend-public.yml (SSH a IP pública)
   └─ Frontend Web
  ↓
6. deploy-ec2-reportes-public.yml (SSH a IP pública)
   └─ Reportes
  ↓
7. deploy-ec2-monitoring-public.yml (SSH a IP pública)
   └─ Prometheus, Grafana
  ↓
8. deploy-ec2-analytics-private.yml (SSH via bastión)
   └─ ELK Stack
```

---

## 💰 Beneficios de Esta Arquitectura

### Seguridad
- ✅ BDs no expuestas a internet
- ✅ Messaging no expuesto a internet
- ✅ Analytics no expuesto a internet
- ✅ Solo servicios públicos tienen IP pública

### Costo
- ✅ Menos IP elásticas (5 en lugar de 8)
- ✅ Instancias privadas no necesitan NAT Gateway
- ✅ Tráfico entre instancias privadas: gratis (VPC)

### Mantenimiento
- ✅ Bastion host centralizado
- ✅ Fácil escalar (agregar más instancias privadas)
- ✅ Configuración consistente

### Compliance
- ✅ BDs cumplen requisitos de no exposición
- ✅ Registros de acceso (bastion logs)
- ✅ Auditoría centralizada

---

## 🔄 Cómo Conectar a Instancias Privadas

### Desde GitHub Actions (SSH con Bastion Jump)
```bash
# Deploy a instancia privada via bastión
ssh -J ec2-user@IP_PUBLICA_BASTION \
    -i ~/.ssh/key.pem \
    ec2-user@IP_PRIVADA_BASES_DATOS \
    "docker ps"
```

### En el Workflow
```yaml
- name: Deploy to Private Databases
  run: |
    ssh -i ~/.ssh/aws-key.pem \
        -o ProxyCommand="ssh -i ~/.ssh/aws-key.pem \
                            -W %h:%p \
                            ec2-user@${{ env.EC2_CORE_PUBLIC_IP }}" \
        ec2-user@${{ env.EC2_DATABASES_PRIVATE_IP }} << 'EOF'
      # Comandos para la instancia privada
      docker-compose up -d
    EOF
```

---

## 📋 Cambios Necesarios en infrastructure.hardcoded.config.js

```javascript
const EC2_INSTANCES = {
  // PÚBLICAS (con IP pública fija)
  CORE_PUBLIC: {
    PUBLIC_IP: '13.216.12.61',
    PRIVATE_IP: '172.31.78.183',
  },
  API_GATEWAY_PUBLIC: {
    PUBLIC_IP: '52.71.188.181',
    PRIVATE_IP: '172.31.76.105',
  },
  FRONTEND_PUBLIC: {
    PUBLIC_IP: '107.21.124.81',
    PRIVATE_IP: '172.31.69.203',
  },
  REPORTES_PUBLIC: {
    PUBLIC_IP: '54.175.62.79',
    PRIVATE_IP: '172.31.69.133',
  },
  MONITORING_PUBLIC: {
    PUBLIC_IP: '54.198.235.28',
    PRIVATE_IP: '172.31.71.151',
  },
  
  // PRIVADAS (sin IP pública)
  DATABASES_PRIVATE: {
    PRIVATE_IP: '172.31.79.193',
    BASTION: EC2_INSTANCES.CORE_PUBLIC.PUBLIC_IP,
  },
  MESSAGING_PRIVATE: {
    PRIVATE_IP: '172.31.73.6',
    BASTION: EC2_INSTANCES.CORE_PUBLIC.PUBLIC_IP,
  },
  ANALYTICS_PRIVATE: {
    PRIVATE_IP: '172.31.XX.XX',
    BASTION: EC2_INSTANCES.CORE_PUBLIC.PUBLIC_IP,
  }
};
```

---

## ✅ Ventajas vs Desventajas

### ✅ Ventajas
- **Seguridad mejorada**: BDs no expuestas
- **Menor costo**: Menos IPs elásticas
- **Mejor organización**: Pública vs Privada clara
- **Escalabilidad**: Fácil agregar instancias privadas
- **Cumplimiento**: Satisface requisitos de seguridad

### ⚠️ Pequeños Cambios
- Workflows usan SSH con bastión jump
- Configuración un poco más compleja
- Necesita coordinar orden de deployment

---

## 🎯 Estado Actual

**Decisión:** ¿Implementamos esta arquitectura mejorada?

**Si sí:**
1. Actualizamos `infrastructure.hardcoded.config.js`
2. Creamos/modificamos 8 workflows
3. Agregamos soporte para SSH via bastión
4. Documentamos el nuevo flujo

**Si sigues con la actual:**
1. Mantienes 8 instancias públicas
2. Workflows más simples
3. Menos seguridad en BDs

¿Cuál prefieres?
