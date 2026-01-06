# 📋 MAPEO DE SERVICIOS POR INSTANCIA EC2

## 🎯 Vista General

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA ACTUALIZADA                     │
│              8 Instancias EC2 Separadas (Enero 2026)            │
└─────────────────────────────────────────────────────────────────┘

                         ┌─ INTERNET ─┐
                         │             │
            ┌────────────┴─────────────┴────────────┐
            │                                       │
      ┌─────▼──────┐                        ┌──────▼──────┐
      │  FRONTEND  │                        │  API-GW    │
      │ 107.21.xxx │                        │ 52.71.xxx  │
      └─────┬──────┘                        └──────┬──────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
       ┌────▼────┐         ┌───▼────┐         ┌──▼────┐
       │  CORE   │         │REPORTES│         │NOTIF  │
       │13.216.xx│         │54.175.x│         │100.31 │
       └────┬────┘         └───┬────┘         └──┬────┘
            │                  │                  │
            └──────────────────┼──────────────────┴──────┬──────┐
                               │                         │      │
                        ┌──────▼──────┐        ┌────────▼──┐  ┌▼───────┐
                        │  MESSAGING  │        │ MONITORING│  │   DB   │
                        │ 3.235.24.xx │        │54.198.xxx │  │44.222.x│
                        └─────────────┘        └───────────┘  └────────┘
```

---

## 📊 TABLA DE INSTANCIAS

| # | Nombre Instancia | IP Pública | IP Privada | Elastic IP | Servicios | Puerto |
|---|---|---|---|---|---|---|
| 1 | **EC2-CORE** | 13.216.12.61 | 172.31.78.183 | ✅ Sí | micro-auth, estudiantes, maestros | 3000-3002 |
| 2 | **EC2-API-Gateway** | 52.71.188.181 | 172.31.76.105 | ✅ Sí | api-gateway | 8080 |
| 3 | **EC2-Frontend** | 107.21.124.81 | 172.31.69.203 | ✅ Sí | frontend-web | 80/443 |
| 4 | **EC2-Reportes** | 54.175.62.79 | 172.31.69.133 | ✅ Sí | reportes-est, reportes-maest | 5003, 5004 |
| 5 | **EC2-Notificaciones** | 100.31.143.213 | 172.31.65.57 | ❌ No | micro-notificaciones | 5006 |
| 6 | **EC2-Messaging** | 3.235.24.36 | 172.31.73.6 | ❌ No | Kafka, RabbitMQ, Zookeeper | 9092, 5672, 2181 |
| 7 | **EC2-Monitoring** | 54.198.235.28 | 172.31.71.151 | ✅ Sí | Prometheus, Grafana | 9090, 3001 |
| 8 | **EC2-DB** | 44.222.119.15 | 172.31.79.193 | ❌ No | MongoDB, PostgreSQL, Redis | 27017, 5432, 6379 |

---

## 🏢 DETALLES POR INSTANCIA

### 1️⃣ **EC2-CORE** (13.216.12.61 / 172.31.78.183)

**Función**: Microservicios de núcleo

```
Servicios alojados:
├── micro-auth (3000)
│   └── Autenticación, JWT, usuarios
│
├── micro-estudiantes (3001)
│   └── Gestión de estudiantes
│
└── micro-maestros (3002)
    └── Gestión de maestros, horarios
```

**Configuración**:
```javascript
// En infrastructure-instances.config.js
EC2_CORE: {
  public_ip: '13.216.12.61',
  private_ip: '172.31.78.183',
  services: [3000, 3001, 3002]
}
```

**Acceso**:
- 🌍 Público: `http://13.216.12.61:3000`
- 🔒 Privado: `http://172.31.78.183:3000`

---

### 2️⃣ **EC2-API-Gateway** (52.71.188.181 / 172.31.76.105)

**Función**: Proxy reverso y enrutamiento centralizado

```
Puerto 8080 → Proxy reverso
  ├─ GET /auth/*           → 172.31.78.183:3000
  ├─ GET /estudiantes/*    → 172.31.78.183:3001
  ├─ GET /maestros/*       → 172.31.78.183:3002
  ├─ GET /reportes/*       → 172.31.69.133:5003
  └─ POST /notificaciones/* → 172.31.65.57:5006
```

**Configuración**:
```javascript
EC2_API_GATEWAY: {
  public_ip: '52.71.188.181',
  private_ip: '172.31.76.105',
  port: 8080,
  routes_to: {
    micro_auth: 'http://172.31.78.183:3000',
    micro_estudiantes: 'http://172.31.78.183:3001',
    micro_reportes: 'http://172.31.69.133:5003'
  }
}
```

**Acceso**:
- 🌍 Público: `http://52.71.188.181:8080/api/*`
- 🔒 Privado: `http://172.31.76.105:8080/api/*`

---

### 3️⃣ **EC2-Frontend** (107.21.124.81 / 172.31.69.203)

**Función**: Interfaz web (HTML, CSS, JS)

```
Puerto 80  → HTTP (redirige a HTTPS)
Puerto 443 → HTTPS (recomendado)
```

**Configuración**:
```javascript
EC2_FRONTEND: {
  public_ip: '107.21.124.81',
  private_ip: '172.31.69.203',
  port: 80,
  api_endpoint: 'http://52.71.188.181:8080'
}
```

**Acceso**:
- 🌍 Público: `http://107.21.124.81`
- 🔒 Privado: `http://172.31.69.203`

**Conecta a**:
- API Gateway en `52.71.188.181:8080`

---

### 4️⃣ **EC2-Reportes** (54.175.62.79 / 172.31.69.133)

**Función**: Generación y gestión de reportes

```
Puerto 5003 → Reportes de estudiantes
Puerto 5004 → Reportes de maestros
```

**Configuración**:
```javascript
EC2_REPORTES: {
  public_ip: '54.175.62.79',
  private_ip: '172.31.69.133',
  services: [5003, 5004],
  databases: {
    postgresql: '172.31.79.193:5432',
    mongodb: '172.31.79.193:27017'
  }
}
```

**Acceso**:
- 🌍 Público: `http://54.175.62.79:5003`
- 🔒 Privado: `http://172.31.69.133:5003`

**Conecta a**:
- Database en `172.31.79.193`

---

### 5️⃣ **EC2-Notificaciones** (100.31.143.213 / 172.31.65.57)

**Función**: Sistema de notificaciones (email, SMS, push)

```
Puerto 5006 → Notificaciones
```

**Configuración**:
```javascript
EC2_NOTIFICACIONES: {
  public_ip: '100.31.143.213',    // ⚠️ Sin Elastic IP
  private_ip: '172.31.65.57',
  port: 5006,
  messaging: {
    kafka: '172.31.73.6:9092',
    rabbitmq: '172.31.73.6:5672'
  }
}
```

**Acceso**:
- 🌍 Público: `http://100.31.143.213:5006`
- 🔒 Privado: `http://172.31.65.57:5006`

**Conecta a**:
- Messaging en `172.31.73.6`
- Database en `172.31.79.193`

---

### 6️⃣ **EC2-Messaging** (3.235.24.36 / 172.31.73.6)

**Función**: Message brokers y orquestación

```
Puerto 9092  → Kafka
Puerto 5672  → RabbitMQ
Puerto 2181  → Zookeeper
```

**Configuración**:
```javascript
EC2_MESSAGING: {
  public_ip: '3.235.24.36',       // ⚠️ Sin Elastic IP
  private_ip: '172.31.73.6',
  services: {
    kafka: 9092,
    rabbitmq: 5672,
    zookeeper: 2181
  }
}
```

**Acceso**:
- 🌍 Público: `3.235.24.36:9092`
- 🔒 Privado: `172.31.73.6:9092`

**Usado por**:
- Notificaciones
- Analytics
- Cualquier servicio que necesite publicar eventos

---

### 7️⃣ **EC2-Monitoring** (54.198.235.28 / 172.31.71.151)

**Función**: Monitoreo y observabilidad

```
Puerto 9090 → Prometheus (métricas)
Puerto 3001 → Grafana (visualización)
```

**Configuración**:
```javascript
EC2_MONITORING: {
  public_ip: '54.198.235.28',
  private_ip: '172.31.71.151',
  services: {
    prometheus: 9090,
    grafana: 3001
  },
  scrape_targets: [
    '172.31.78.183:9090',    // CORE
    '172.31.76.105:9090',    // API-GW
    '172.31.69.133:9090'     // Reportes
  ]
}
```

**Acceso**:
- 🌍 Prometheus: `http://54.198.235.28:9090`
- 🌍 Grafana: `http://54.198.235.28:3001`
- 🔒 Privado: `http://172.31.71.151:9090`

---

### 8️⃣ **EC2-DB** (44.222.119.15 / 172.31.79.193)

**Función**: Bases de datos centralizadas

```
Puerto 27017 → MongoDB
Puerto 5432  → PostgreSQL
Puerto 6379  → Redis
```

**Configuración**:
```javascript
EC2_DB: {
  public_ip: '44.222.119.15',      // ⚠️ NO EXPONER
  private_ip: '172.31.79.193',     // ✅ Único acceso
  services: {
    mongodb: 27017,
    postgresql: 5432,
    redis: 6379
  },
  security_note: 'SOLO ACCESIBLE DESDE VPC'
}
```

**Acceso**:
- 🌍 Público: ❌ **BLOQUEADO**
- 🔒 Privado: `mongodb://172.31.79.193:27017`

**Acceso solo desde**:
- EC2-CORE (172.31.78.183)
- EC2-Reportes (172.31.69.133)
- EC2-Notificaciones (172.31.65.57)
- EC2-API-Gateway (172.31.76.105)

---

## 🔗 RUTAS DE COMUNICACIÓN

### ACCESO PÚBLICO (desde Internet)

```
Usuario/Cliente
    ↓
    ├→ 107.21.124.81        (Frontend)
    ├→ 52.71.188.181:8080   (API Gateway)
    └→ 54.175.62.79:5003    (Reportes - si aplica)
```

### COMUNICACIÓN INTERNA (VPC - Privada)

```
API Gateway (52.71.188.181)
    ├→ 172.31.78.183:3000   (micro-auth)
    ├→ 172.31.78.183:3001   (micro-estudiantes)
    ├→ 172.31.78.183:3002   (micro-maestros)
    ├→ 172.31.69.133:5003   (reportes-est)
    ├→ 172.31.69.133:5004   (reportes-maest)
    └→ 172.31.65.57:5006    (notificaciones)

Servicios
    ├→ 172.31.73.6:9092     (Kafka)
    ├→ 172.31.73.6:5672     (RabbitMQ)
    └→ 172.31.79.193:27017  (MongoDB/PostgreSQL/Redis)

Monitoreo
    └→ 172.31.71.151:9090   (Prometheus)
```

---

## 📝 CONFIGURACIÓN EN ENV

### Crear archivo `.env.instances`

```bash
# EC2-CORE
CORE_PUBLIC_IP=13.216.12.61
CORE_PRIVATE_IP=172.31.78.183

# EC2-API-Gateway
GATEWAY_PUBLIC_IP=52.71.188.181
GATEWAY_PRIVATE_IP=172.31.76.105

# EC2-Frontend
FRONTEND_PUBLIC_IP=107.21.124.81
FRONTEND_PRIVATE_IP=172.31.69.203
FRONTEND_API_ENDPOINT=http://52.71.188.181:8080

# EC2-Reportes
REPORTES_PUBLIC_IP=54.175.62.79
REPORTES_PRIVATE_IP=172.31.69.133

# EC2-Notificaciones
NOTIF_PUBLIC_IP=100.31.143.213
NOTIF_PRIVATE_IP=172.31.65.57

# EC2-Messaging
MESSAGING_PUBLIC_IP=3.235.24.36
MESSAGING_PRIVATE_IP=172.31.73.6

# EC2-Monitoring
MONITORING_PUBLIC_IP=54.198.235.28
MONITORING_PRIVATE_IP=172.31.71.151

# EC2-DB
DB_PUBLIC_IP=44.222.119.15
DB_PRIVATE_IP=172.31.79.193
```

---

## 🚀 DEPLOYMENT POR INSTANCIA

```bash
# 1. Deploy a EC2-CORE
ssh -i key.pem ec2-user@13.216.12.61
docker-compose -f docker-compose.core.yml up -d

# 2. Deploy a EC2-API-Gateway
ssh -i key.pem ec2-user@52.71.188.181
docker-compose -f docker-compose.api-gateway.yml up -d

# 3. Deploy a EC2-Frontend
ssh -i key.pem ec2-user@107.21.124.81
docker-compose -f docker-compose.frontend.yml up -d

# ... etc para otras instancias
```

---

## ✅ CHECKLIST DE DEPLOYMENT

- [ ] EC2-DB deploying y accesible desde VPC
- [ ] EC2-Messaging deploying (Kafka, RabbitMQ)
- [ ] EC2-CORE deploying y conectado a DB
- [ ] EC2-Reportes deploying y conectado a DB
- [ ] EC2-Notificaciones deploying y conectado a Messaging
- [ ] EC2-API-Gateway deploying y ruteando correctamente
- [ ] EC2-Frontend deploying y conectado a API Gateway
- [ ] EC2-Monitoring deploying y recolectando métricas
- [ ] Probar conectividad entre instancias
- [ ] Validar acceso público a sitios web
- [ ] Validar que DB no es accesible públicamente

---

## 💡 NOTAS IMPORTANTES

1. **IPs Elásticas**: Las 5 instancias con Elastic IP mantendrán su IP pública incluso después de reboot
2. **IPs Sin Elastic**: EC2-Notificaciones, EC2-Messaging y EC2-DB pueden cambiar IP si se reinician
3. **Base de Datos**: CRÍTICO - nunca exponer 172.31.79.193 a internet
4. **Messaging**: Solo accesible desde VPC (no necesita IP pública)
5. **Security Groups**: Configurar correctamente para permitir comunicación interna

---

**Versión**: 2.0 (Instancias Separadas)  
**Actualizado**: Enero 2026  
**Status**: 🟢 Listo para deployment
