# 🎯 Arquitectura Completa: De GitHub a AWS

## Flujo Completo de Despliegue

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        TU REPOSITORIO GITHUB                                 ║
║  .github/workflows/deploy.yml (Dynamic IP Discovery Workflow)                ║
╚════════════════════════════════╤═════════════════════════════════════════════╝
                                 │
                    ┌────────────▼────────────┐
                    │  Workflow Triggered     │
                    │  (Manual or Scheduled)  │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Configure AWS    │  │  Load Secrets    │  │  Checkout Code   │
│ Credentials      │  │  from GitHub     │  │  from Repo       │
│ (from Secrets)   │  │                  │  │                  │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Query AWS EC2 API  │
                    │  aws ec2            │
                    │  describe-instances │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
  ┌─────────────┐         ┌─────────────┐      ┌─────────────┐
  │ PUBLIC IP   │         │ PRIVATE IP  │      │ Instance ID │
  │ 3.236.51.29 │         │172.31.79.241│      │ i-015e5f... │
  └──────┬──────┘         └──────┬──────┘      └──────┬──────┘
         │                       │                    │
         └───────────────────────┼────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Connect via SSH        │
                    │  using PUBLIC IP        │
                    │  (3.236.51.29)          │
                    └────────────┬────────────┘
                                 │
╔════════════════════════════════▼═════════════════════════════════════════════╗
║                                                                              ║
║                         DENTRO DE EC2 INSTANCE                              ║
║                                                                              ║
║  ┌──────────────────────────────────────────────────────────────────────┐   ║
║  │  1. Clone repository                                                 │   ║
║  │     git clone https://github.com/user/repo.git                      │   ║
║  └──────────────────┬───────────────────────────────────────────────────┘   ║
║                     │                                                        ║
║  ┌──────────────────▼───────────────────────────────────────────────────┐   ║
║  │  2. Update Configuration with PRIVATE IP (172.31.79.241)            │   ║
║  │     sed "s|CORE_URL=.*|CORE_URL=http://172.31.79.241|g"             │   ║
║  │     ↓ Only for API-GATEWAY - CORE uses internal Docker network     │   ║
║  └──────────────────┬───────────────────────────────────────────────────┘   ║
║                     │                                                        ║
║  ┌──────────────────▼───────────────────────────────────────────────────┐   ║
║  │  3. Build Docker Images                                             │   ║
║  │     docker build -t micro-auth:latest .                             │   ║
║  │     docker build -t micro-estudiantes:latest .                      │   ║
║  │     (etc. para cada microservicio)                                   │   ║
║  └──────────────────┬───────────────────────────────────────────────────┘   ║
║                     │                                                        ║
║  ┌──────────────────▼───────────────────────────────────────────────────┐   ║
║  │  4. Start Services with docker-compose                              │   ║
║  │     docker-compose -f docker-compose.core.yml up -d                 │   ║
║  │                                                                      │   ║
║  │     Servicios creados:                                              │   ║
║  │     ├─ MongoDB (27017)                                              │   ║
║  │     ├─ PostgreSQL (5432)                                            │   ║
║  │     ├─ micro-auth (3000)           ─┐                               │   ║
║  │     ├─ micro-estudiantes (3001)    ─┤ En Docker network "core-net"  │   ║
║  │     ├─ micro-maestros (3002)       ─┤ Escuchan en 0.0.0.0:puerto   │   ║
║  │     ├─ micro-reportes-est (5003)   ─┘                               │   ║
║  │     └─ micro-reportes-maest (5004)                                  │   ║
║  └──────────────────┬───────────────────────────────────────────────────┘   ║
║                     │                                                        ║
║  ┌──────────────────▼───────────────────────────────────────────────────┐   ║
║  │  5. Verify Deployment                                               │   ║
║  │     docker-compose ps                                               │   ║
║  │     docker-compose logs --tail 50                                   │   ║
║  └──────────────────┬───────────────────────────────────────────────────┘   ║
║                     │                                                        ║
║                     ▼                                                        ║
║              ✅ SUCCESS                                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Comunicación Entre Servicios

### Caso 1: EC2-CORE (Interno)

```
    Docker Network: "core-net"
    ┌────────────────────────────────────┐
    │   Container: micro-auth            │
    │   Listen: 0.0.0.0:3000             │
    │   Accessible via:                  │
    │   ✓ localhost:3000                 │
    │   ✓ 127.0.0.1:3000                 │
    │   ✓ micro-auth:3000 (DNS)          │
    │   ✓ 172.31.79.241:3000 (host IP)  │
    │                                    │
    │   ┌──────────────────────────────┐ │
    │   │ Otros contenedores en la red │ │
    │   │ pueden alcanzarlo sin IP!    │ │
    │   └──────────────────────────────┘ │
    └────────────────────────────────────┘
            ↑
            │ Comparte la red Docker
            │
    ┌────────────────────────────────────┐
    │   Container: micro-estudiantes     │
    │   Lee desde:                       │
    │   ✓ curl http://localhost:3000    │ ❌ (su localhost)
    │   ✓ curl http://micro-auth:3000   │ ✅ (DNS del network)
    └────────────────────────────────────┘
```

### Caso 2: EC2-API-GATEWAY (Diferente Host)

```
    EC2-API-GATEWAY                    EC2-CORE
    ┌────────────────────────┐        ┌──────────────────────────┐
    │ Container: api-gateway │        │ Container: micro-auth    │
    │ En docker compose      │        │ En docker compose        │
    │ (diferente network)    │        │ (network: core-net)      │
    │                        │        │                          │
    │ Necesita alcanzar      │──────▶ │ Listen: 0.0.0.0:3000     │
    │ CORE services          │        │                          │
    │                        │        │ Para ser alcanzable:     │
    │ Debe usar:             │        │ → Puerto EXPUESTO        │
    │ ✓ 172.31.79.241:3000   │        │ → Puerto MAPEADO         │
    │   (PRIVATE IP)         │        │ → Firewall/SG abierto    │
    │                        │        │                          │
    │ ❌ localhost:3000      │        │                          │
    │ ❌ micro-auth:3000     │        │                          │
    │ ❌ 3.236.51.29:3000    │        │ Public IP: 3.236.51.29   │
    │    (public, worse)     │        │ Private IP: 172.31.79.241│
    └────────────────────────┘        └──────────────────────────┘
    Public IP: 52.7.168.4              Same VPC: 172.31.0.0/16
    Private IP: 172.31.79.241
```

---

## Configuración de Archivos

### Antes (Hardcoded - ❌ MALO)

```
# docker-compose.api-gateway.yml
services:
  api-gateway:
    environment:
      AUTH_SERVICE: http://3.237.39.196:3000     ❌ IP hardcodeada
      ESTUDIANTES_SERVICE: http://3.237.39.196:3001
      # Cuando la instancia se reinicia: 3.237.39.196 → 3.236.51.29
      # ¡ El workflow falla! ¡Hay que actualizar manualmente!
```

### Después (Dinámico - ✅ BIEN)

```
GitHub Actions Workflow
├─ Detecta IP: 3.236.51.29 (public) + 172.31.79.241 (private)
│
└─ Ejecuta en EC2 via SSH (public IP):
   ssh ubuntu@3.236.51.29
   
   Dentro de EC2:
   ├─ Actualiza config con PRIVATE IP:
   │  sed -i "s|CORE_URL=.*|CORE_URL=http://172.31.79.241|g" .env
   │
   └─ Inicia servicios:
      docker-compose up -d
      ✅ Funciona, aunque el IP cambió
```

---

## Rol de Cada IP

| IP | Quién la Usa | Cuándo | Por Qué |
|----|----|----|----|
| **3.236.51.29** (Pública) | GitHub Actions | SSH | Internet no puede acceder a IPs privadas |
| **172.31.79.241** (Privada) | micro-servicios en API-GATEWAY | Intra-VPC | Más rápido, seguro, gratis |
| **localhost** / **127.0.0.1** | Dentro del mismo contenedor | Tests locales | No accesible desde afuera |
| **hostname DNS** | Dentro del Docker network | Comunicación interna | Resuelto por Docker |

---

## Security Groups Requeridos

### EC2-CORE Security Group

```
INBOUND:
├─ SSH (22)              ← from 0.0.0.0/0        [GitHub Actions]
├─ microservices (3000-3005)  ← from 172.31.0.0/16  [Otros EC2s en VPC]
├─ MongoDB (27017)       ← from 172.31.0.0/16    [EC2-API-GATEWAY]
├─ PostgreSQL (5432)     ← from 172.31.0.0/16    [Reportes]
└─ HTTP (80, 443)        ← from 0.0.0.0/0        [Public users]

OUTBOUND:
└─ ALL (0.0.0.0/0)       ← Por defecto
```

### EC2-API-GATEWAY Security Group

```
INBOUND:
├─ SSH (22)              ← from 0.0.0.0/0        [GitHub Actions]
└─ HTTP (8080)           ← from 0.0.0.0/0        [Public users]

OUTBOUND:
└─ ALL (0.0.0.0/0)       ← Para alcanzar CORE en VPC privada
```

---

## Validación Paso a Paso

### En GitHub Actions (visible en logs)

```
✓ "Get EC2 IPs (Dynamic Discovery)"
  → Found instance EC2-CORE (i-015e5f...)
  → Public IP: 3.236.51.29
  → Private IP: 172.31.79.241

✓ "Setup SSH"
  → SSH setup complete for IP: 3.236.51.29

✓ "Update Configuration with IPs"
  → Using PUBLIC IP (3.236.51.29) for SSH
  → Using PRIVATE IP (172.31.79.241) for inter-service routing

✓ "Build Docker Images on EC2"
  → Cloning repository...
  → Building images...
  → Starting services with docker-compose...

✓ "Verify deployment"
  → Service Status: [all UP]
```

### En tu computadora (SSH manual)

```bash
# 1. Conectar a CORE via PUBLIC IP
$ ssh -i key.pem ubuntu@3.236.51.29
ubuntu@ip-172-31-79-241:~$

# 2. Verificar servicios corriendo
$ docker-compose ps
NAME                    STATUS
mongo                   Up 2 minutes
postgres                Up 2 minutes
micro-auth              Up 1 minute
micro-estudiantes       Up 1 minute
micro-maestros          Up 1 minute

# 3. Probar conectividad via PRIVATE IP
$ curl http://172.31.79.241:3000/health
{"status":"OK"}

# 4. Conectar desde EC2-API-GATEWAY a CORE
ubuntu@api-gw:~$ curl http://172.31.79.241:3000/health
{"status":"OK"}
```

---

## Flujo de Una Solicitud End-to-End

```
User en Internet
    │
    ▼
[INTERNET]
    │ (Puerto 80/443)
    ▼
EC2-API-GATEWAY (Public IP: 52.7.168.4)
    │ security-group permite puerto 8080
    ▼
[DOCKER CONTAINER: api-gateway:8080]
    │ service-url=http://172.31.79.241:3000
    ▼
[VPC 172.31.0.0/16 - Ruta privada]
    │ (sin salir a internet)
    ▼
EC2-CORE (Private IP: 172.31.79.241)
    │ security-group permite TCP 3000 from 172.31.0.0/16
    ▼
[DOCKER CONTAINER: micro-auth:3000]
    │ process request
    ▼
[Database: MongoDB]
    │ fetch data
    ▼
Response back to User ✅
```

---

## Resumen: ¿Qué Cambió?

### Anterior (Problemático)

```yaml
# IPs hardcodeadas en múltiples lugares
# Se rompía cada reinicio
# ❌ No escalable
# ❌ Manual
# ❌ Propenso a errores
```

### Ahora (Solución)

```yaml
# GitHub Actions:
# 1. Descubre IPs automáticamente
# 2. Usa pública para SSH
# 3. Usa privada para configuración
# 4. Deploy automático
# 5. Verificación automática
# ✅ Escalable
# ✅ Automático
# ✅ Resiliente
```

---

## Próximo Paso

👉 Lee [QUICK_START.md](./QUICK_START.md) para el checklist completo

🎓 Lee [IP_ROUTING_STRATEGY.md](./IP_ROUTING_STRATEGY.md) para entender la teoría
