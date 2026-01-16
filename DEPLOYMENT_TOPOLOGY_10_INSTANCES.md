# 🚀 TOPOLOGÍA DE DESPLIEGUE - 10 INSTANCIAS EC2

## Completado ✅

### 1. Docker-Compose por Instancia
Cada una de las 10 instancias EC2 ahora tiene su propio `docker-compose.yml` específico:

- ✅ **docker-compose.ec2-bastion.yml** - EC-Bastion
  - Servicio: bastion-host:latest
  - Red: bastion-net
  - Puerto SSH: 2222
  
- ✅ **docker-compose.ec2-core.yml** - EC2-CORE (CORE SERVICES)
  - Servicios: micro-auth, micro-estudiantes, micro-maestros, micro-core
  - Base de datos: MongoDB (27017)
  - Puertos: 3000 (auth), 3001 (estudiantes), 3002 (maestros), 5000 (core)
  - Red: core-net
  
- ✅ **docker-compose.api-gateway.yml** - EC2-API-GATEWAY
  - Servicio: api-gateway:latest
  - Puerto: 8080 (acceso público)
  - CORE_HOST: configurado dinámicamente con IP privada de EC2-CORE
  - Red: api-gateway-net
  
- ✅ **docker-compose.ec2-reportes.yml** - EC2-Reportes
  - Servicios: micro-reportes-estudiantes (5003), micro-reportes-maestros (5004)
  - Base de datos: MongoDB (27017)
  - Red: reportes-net
  
- ✅ **docker-compose.ec2-notificaciones.yml** - EC2-Notificaciones
  - Servicio: micro-notificaciones (5005)
  - Sin base de datos
  - Red: notificaciones-net
  
- ✅ **docker-compose.ec2-messaging.yml** - EC2-Messaging
  - Servicios: zookeeper (2181), kafka (9092), rabbitmq (5672)
  - Características: Imagen pre-construida
  - Red: messaging-net
  
- ✅ **docker-compose.ec2-db.yml** - EC2-DB
  - Servicios: MongoDB (27017), PostgreSQL (5432), Redis (6379)
  - Características: Imagen pre-construida (sin build)
  - Red: db-net
  
- ✅ **docker-compose.ec2-analytics.yml** - EC2-Analytics
  - Servicios: micro-analytics (5006)
  - Base de datos: MongoDB (27017)
  - Red: analytics-net
  
- ✅ **docker-compose.ec2-monitoring.yml** - EC2-Monitoring
  - Servicios: prometheus (9090), grafana (3000)
  - Características: Imagen pre-construida
  - Red: monitoring-net
  
- ✅ **docker-compose.ec2-frontend.yml** - EC2-Frontend
  - Servicio: frontend-web:latest
  - Puertos: 80, 443
  - Network: frontend-net

### 2. Actualización del Workflow Deploy (.github/workflows/deploy.yml)

#### Instancia Input
- ✅ Agregadas opciones para seleccionar instancia:
  - EC2_BASTION
  - EC2_CORE
  - EC2_API_GATEWAY
  - EC2_REPORTES
  - EC2_NOTIFICACIONES
  - EC2_MESSAGING
  - EC2_DB
  - EC2_ANALYTICS
  - EC2_MONITORING
  - EC2_FRONTEND
  - ALL_INSTANCES

#### Tag Mapping
- ✅ Actualizado case statement para mapear instance names a EC2 tag names:
  - EC2_BASTION → "EC-Bastion"
  - EC2_CORE → "EC2-CORE"
  - EC2_API_GATEWAY → "EC2-API-Gateway"
  - EC2_FRONTEND → "EC2-Frontend"
  - EC2_MESSAGING → "EC2-Messaging"
  - EC2_DB → "EC2-DB"
  - EC2_REPORTES → "EC2-Reportes"
  - EC2_NOTIFICACIONES → "EC2-Notificaciones"
  - EC2_ANALYTICS → "EC2-Analytics"
  - ALL_INSTANCES → "*"

#### Docker-Compose File Selection
- ✅ Actualizada lógica de selección para cada instancia:
  - Each instance type routes to correct docker-compose.ec2-*.yml file

#### Build Images Section
- ✅ Refactored case statement para compilar SOLO los servicios específicos de cada instancia:
  - EC2_BASTION: compila bastion-host
  - EC2_CORE: compila micro-auth, micro-estudiantes, micro-maestros, micro-core
  - EC2_API_GATEWAY: compila api-gateway
  - EC2_REPORTES: compila micro-reportes-estudiantes, micro-reportes-maestros
  - EC2_NOTIFICACIONES: compila micro-notificaciones
  - EC2_ANALYTICS: compila micro-analytics
  - EC2_MESSAGING: no compilación (usa imágenes Docker Hub)
  - EC2_DB: no compilación (usa imágenes Docker Hub)
  - EC2_MONITORING: no compilación (usa imágenes Docker Hub)
  - EC2_FRONTEND: compila frontend-web
  - ALL_INSTANCES: compila todos los servicios

#### Dynamic IP Configuration
- ✅ Agregado nuevo paso: "Get EC2-CORE private IP"
  - When deploying to EC2_API_GATEWAY, discovers EC2-CORE private IP
  - Output: steps.get-core-ip.outputs.core_private_ip
  
- ✅ Actualizado BUILDSSH script:
  - Acepta CORE_PRIVATE_IP como 5to parámetro
  - Para EC2_API_GATEWAY: sustituye CORE_HOST en docker-compose.api-gateway.yml
  - Format: `CORE_HOST: "http://PRIVATE_IP_OF_EC2_CORE"`
  - El API Gateway usa CORE_HOST como base y agrega puertos (3000, 3001, 3002, etc.)

### 3. Network Architecture

Cada instancia usa su propia red Docker Bridge aislada:
- bastion-net: aislada (host → SSH 2222)
- core-net: aislada (solo EC2-CORE internos)
- api-gateway-net: aislada (EC2-API-GATEWAY)
- reportes-net: aislada (EC2-Reportes)
- notificaciones-net: aislada (EC2-Notificaciones)
- messaging-net: aislada (EC2-Messaging)
- db-net: aislada (EC2-DB)
- analytics-net: aislada (EC2-Analytics)
- monitoring-net: aislada (EC2-Monitoring)
- frontend-net: aislada (EC2-Frontend)

### 4. Cross-Instance Communication

**API Gateway → Core Services:**
- API Gateway (EC2-API-GATEWAY) se conecta a Core (EC2-CORE) usando IP privada
- CORE_HOST env var se sustituye dinámicamente en el workflow
- Routes: {CORE_PRIVATE_IP}:3000, :3001, :3002, :5000, etc.

## Próximos Pasos Recomendados

### 1. Verificar Dockerfile Paths (CRÍTICO)
Asegurar que cada Dockerfile existe en la ruta esperada:
```
micro-auth/Dockerfile
micro-estudiantes/Dockerfile
micro-maestros/Dockerfile
micro-core/Dockerfile
api-gateway/Dockerfile
micro-reportes-estudiantes/Dockerfile
micro-reportes-maestros/Dockerfile
micro-notificaciones/Dockerfile
micro-analytics/Dockerfile
frontend-web/Dockerfile
bastion-host/Dockerfile
```

### 2. Verificar Directorios de Contexto
El workflow usa:
- `./micro-auth` como context → `Dockerfile` dentro del directorio
- `./api-gateway` como context → `Dockerfile` dentro del directorio
- `./frontend-web/Dockerfile` como dockerfile → context es `./frontend-web`

### 3. Test Deployment Step by Step

**Phase 1: Infrastructure Services (sin builds personalizados)**
```bash
gh workflow run deploy.yml -f instance="EC2_DB" -f rebuild_docker="false"
gh workflow run deploy.yml -f instance="EC2_MESSAGING" -f rebuild_docker="false"
gh workflow run deploy.yml -f instance="EC2_MONITORING" -f rebuild_docker="false"
```

**Phase 2: Core Services**
```bash
gh workflow run deploy.yml -f instance="EC2_CORE" -f rebuild_docker="true"
```

**Phase 3: API Gateway (con dynamic IP)**
```bash
gh workflow run deploy.yml -f instance="EC2_API_GATEWAY" -f rebuild_docker="true"
```

**Phase 4: Remaining Services**
```bash
gh workflow run deploy.yml -f instance="EC2_BASTION" -f rebuild_docker="true"
gh workflow run deploy.yml -f instance="EC2_REPORTES" -f rebuild_docker="true"
gh workflow run deploy.yml -f instance="EC2_NOTIFICACIONES" -f rebuild_docker="true"
gh workflow run deploy.yml -f instance="EC2_ANALYTICS" -f rebuild_docker="true"
gh workflow run deploy.yml -f instance="EC2_FRONTEND" -f rebuild_docker="true"
```

**Phase 5: All at once (after verification)**
```bash
gh workflow run deploy.yml -f instance="ALL_INSTANCES" -f rebuild_docker="true"
```

### 4. Validation Checklist

- [ ] Bastion SSH port 2222 responds
- [ ] EC2-CORE responds on ports 3000, 3001, 3002, 5000
- [ ] API Gateway responds on port 8080
- [ ] API Gateway can reach core services (test health endpoints)
- [ ] Reportes services respond on ports 5003, 5004
- [ ] Notificaciones responds on port 5005
- [ ] Analytics responds on port 5006
- [ ] Monitoring (Grafana 3000, Prometheus 9090) accessible
- [ ] Frontend accessible on port 80
- [ ] Cross-instance communication works (curl from EC2-API-GATEWAY to EC2-CORE)

### 5. Troubleshooting

If EC2-API-GATEWAY can't reach EC2-CORE:
1. Check CORE_PRIVATE_IP was correctly discovered
2. Verify CORE_HOST substitution in docker-compose.api-gateway.yml
3. Ensure EC2-CORE services are listening on all interfaces (0.0.0.0)
4. Check AWS Security Group allows traffic between instances

## Archivos Creados

- ✅ docker-compose.ec2-bastion.yml
- ✅ docker-compose.ec2-core.yml (actualizado)
- ✅ docker-compose.api-gateway.yml (actualizado)
- ✅ docker-compose.ec2-reportes.yml
- ✅ docker-compose.ec2-notificaciones.yml
- ✅ docker-compose.ec2-messaging.yml
- ✅ docker-compose.ec2-db.yml
- ✅ docker-compose.ec2-analytics.yml
- ✅ docker-compose.ec2-monitoring.yml
- ✅ docker-compose.ec2-frontend.yml
- ✅ .github/workflows/deploy.yml (actualizado)

## Estado Actual

**LISTO PARA DESPLEGAR** ✅

El proyecto ahora está configurado para despliegue distribuido en 10 instancias EC2 con:
- Topología clara de servicios por instancia
- Compilación específica por instancia (solo los servicios necesarios)
- Descubrimiento dinámico de IPs para comunicación inter-instancia
- Networking aislado por instancia
- Soporte para despliegue selectivo (una instancia) o completo (todas)

---
Generated: 2024
Proyecto: Acompañamiento
