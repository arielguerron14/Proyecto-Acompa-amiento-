# 🔒 Security Groups - Verificación de Comunicación

## ✅ Arquitectura de Red

```
INTERNET
   │
   ├─[SSH:22]───────────────────────► Bastion (bastion-sg)
   │                                      │
   │                                      │ [SSH:22]
   ├─[HTTP:80,HTTPS:443]────────────► Frontend (web-sg)
   │                                      │
   │                                      │ [HTTP:8080]
   ├─[HTTP:8080]────────────────────► API Gateway (api-gateway-sg)
   │                                      │
   │                                      │ [3000-5010]
   │                                      ▼
   │                                  Microservices (microservices-sg)
   │                                      │
   │                                      ├─[27017,5432,6379]──► Databases (database-sg)
   │                                      │
   │                                      └─[9092,5672,1883]───► Messaging (messaging-sg)
   │
   ├─[15672,9001]───────────────────► RabbitMQ Mgmt / MQTT WS
   │
   └─[9090,3001]────────────────────► Prometheus / Grafana (monitoring-sg)
```

## 📋 Flujos de Comunicación Verificados

### 1. Usuario → Frontend (Web)
- **Origen**: Internet (0.0.0.0/0)
- **Destino**: EC2-Frontend (web-sg)
- **Puertos**: 80 (HTTP), 443 (HTTPS)
- **Estado**: ✅ PERMITIDO
- **Uso**: Usuarios accediendo a la aplicación web

### 2. Frontend → API Gateway
- **Origen**: EC2-Frontend (web-sg)
- **Destino**: EC2-API-Gateway (api-gateway-sg)
- **Puerto**: 8080
- **Estado**: ✅ PERMITIDO
- **Uso**: Frontend hace requests al API Gateway

### 3. API Gateway → Microservicios
- **Origen**: EC2-API-Gateway (api-gateway-sg)
- **Destino**: EC2-CORE, EC2-Reportes, EC2-Notificaciones (microservices-sg)
- **Puertos**: 3000-5010
- **Estado**: ✅ PERMITIDO (via source_security_group_id)
- **Uso**: API Gateway enruta requests a microservicios específicos

**Microservicios y sus puertos:**
```
micro-auth                → 3000
micro-estudiantes        → 3001
micro-maestros           → 3002
micro-reportes-estudiantes → 5003
micro-reportes-maestros  → 5004
micro-notificaciones     → 5006
micro-analytics          → 5007
micro-soap-bridge        → 5008
```

### 4. Microservicios → Bases de Datos
- **Origen**: Microservicios (microservices-sg)
- **Destino**: EC2-DB (database-sg)
- **Puertos**: 
  - MongoDB: 27017
  - PostgreSQL: 5432
  - Redis: 6379
- **Estado**: ✅ PERMITIDO (via source_security_group_id + VPC CIDR)
- **Uso**: Microservicios accediendo a sus bases de datos

### 5. Microservicios → Message Brokers
- **Origen**: Microservicios (microservices-sg)
- **Destino**: EC2-Messaging (messaging-sg)
- **Puertos**:
  - Kafka: 9092
  - RabbitMQ: 5672
  - MQTT: 1883
- **Estado**: ✅ PERMITIDO (via source_security_group_id + VPC CIDR)
- **Uso**: Comunicación asíncrona entre microservicios

### 6. Bastion → Todas las Instancias
- **Origen**: EC-Bastion (bastion-sg)
- **Destino**: TODAS las instancias
- **Puerto**: 22 (SSH)
- **Estado**: ✅ PERMITIDO (via source_security_group_id)
- **Uso**: Administración y mantenimiento de servidores

### 7. Internet → RabbitMQ Management
- **Origen**: Internet (0.0.0.0/0)
- **Destino**: EC2-Messaging (messaging-sg)
- **Puerto**: 15672
- **Estado**: ✅ PERMITIDO
- **Uso**: Interfaz web de administración de RabbitMQ

### 8. Internet → MQTT WebSocket
- **Origen**: Internet (0.0.0.0/0)
- **Destino**: EC2-Messaging (messaging-sg)
- **Puerto**: 9001
- **Estado**: ✅ PERMITIDO
- **Uso**: Conexiones MQTT desde navegadores/apps

### 9. Internet → Monitoring
- **Origen**: Internet (0.0.0.0/0)
- **Destino**: EC2-Monitoring (monitoring-sg)
- **Puertos**:
  - Prometheus: 9090
  - Grafana: 3001
- **Estado**: ✅ PERMITIDO
- **Uso**: Visualización de métricas y dashboards

### 10. Prometheus → Exporters (todos los servicios)
- **Origen**: EC2-Monitoring (monitoring-sg)
- **Destino**: Todas las instancias en VPC
- **Puertos**: 9090-9100 (exporters)
- **Estado**: ✅ PERMITIDO (desde VPC CIDR)
- **Uso**: Prometheus scraping métricas de todos los servicios

## 🛡️ Security Groups Creados

| Security Group | Nombre AWS | Instancias | Puertos Abiertos |
|---------------|-----------|------------|------------------|
| bastion-sg | bastion-sg | EC-Bastion | 22 (desde internet) |
| web-sg | web-sg | EC2-Frontend | 80, 443 (internet), 22 (bastion) |
| api-gateway-sg | api-gateway-sg | EC2-API-Gateway | 8080 (internet + web-sg), 22 (bastion) |
| microservices-sg | microservices-sg | EC2-CORE, EC2-Reportes, EC2-Notificaciones | 3000-5010 (VPC + api-gateway-sg), 22 (bastion) |
| database-sg | database-sg | EC2-DB | 27017, 5432, 6379 (VPC + microservices-sg), 22 (bastion) |
| messaging-sg | messaging-sg | EC2-Messaging | 9092, 5672, 1883 (VPC + microservices-sg), 15672, 9001 (internet), 22 (bastion) |
| monitoring-sg | monitoring-sg | EC2-Monitoring | 9090, 3001 (internet), 9090-9100 (VPC), 22 (bastion) |

## 🔑 Características de Seguridad Implementadas

### ✅ Principio de Menor Privilegio
- Cada security group solo permite el tráfico necesario
- No hay puertos abiertos a 0.0.0.0/0 innecesariamente
- SSH solo accesible desde Bastion (salvo Bastion mismo)

### ✅ Segmentación por Capas
```
Capa Presentación (web-sg)
    ↓
Capa API (api-gateway-sg)
    ↓
Capa Negocio (microservices-sg)
    ↓
Capa Datos (database-sg + messaging-sg)
```

### ✅ Security Group References
- Se usa `source_security_group_id` en lugar de CIDRs cuando es posible
- Evita problemas de hardcoding de IPs
- Dinámico: funciona con cambios de IP

### ✅ VPC CIDR Dinámico
- Se usa `var.vpc_cidr` en lugar de hardcodear "10.0.0.0/16"
- Compatible con cualquier rango de VPC
- Más flexible y reutilizable

### ✅ Reglas Bidireccionales
- Microservices → Databases: explícitamente permitido
- API Gateway → Microservices: explícitamente permitido
- Evita problemas de "conexión rechazada"

## ⚠️ Consideraciones Importantes

### 1. SSH Solo desde Bastion
Para conectarte a cualquier instancia (excepto Bastion):
```bash
# Paso 1: Conectar a Bastion
ssh -i key.pem ubuntu@<BASTION_PUBLIC_IP>

# Paso 2: Desde Bastion, conectar a otra instancia
ssh ubuntu@<PRIVATE_IP_DE_INSTANCIA>
```

### 2. Comunicación Interna
- Los microservicios se comunican usando **IPs privadas** de la VPC
- No necesitan IPs públicas para hablar entre sí
- El API Gateway puede tener IP pública pero usa IP privada para comunicación interna

### 3. Bases de Datos No Expuestas
- MongoDB, PostgreSQL, Redis **NO** son accesibles desde internet
- Solo accesibles desde microservicios dentro de la VPC
- Protege contra ataques directos a las bases de datos

### 4. Application Load Balancer
El ALB usa combinación de security groups:
- `web-sg`: Para servir tráfico HTTP/HTTPS
- `api-gateway-sg`: Para enrutar tráfico del API Gateway

## 🧪 Pruebas de Conectividad

### Desde EC2-Frontend (web-sg)
```bash
# ✅ Debe funcionar
curl http://<API-GATEWAY-IP>:8080/health

# ❌ Debe fallar (puerto cerrado)
curl http://<DB-PRIVATE-IP>:27017
```

### Desde EC2-API-Gateway (api-gateway-sg)
```bash
# ✅ Debe funcionar
curl http://<MICROSERVICE-PRIVATE-IP>:3000/health
curl http://<DB-PRIVATE-IP>:27017 # Si MongoDB permite health checks
```

### Desde EC2-CORE (microservices-sg)
```bash
# ✅ Debe funcionar
mongo mongodb://<DB-PRIVATE-IP>:27017/mydb
psql -h <DB-PRIVATE-IP> -p 5432 -U user
redis-cli -h <DB-PRIVATE-IP> -p 6379
kafkacat -b <MESSAGING-PRIVATE-IP>:9092 -L
```

### Desde Internet
```bash
# ✅ Debe funcionar
curl http://<FRONTEND-PUBLIC-IP>:80
curl http://<API-GATEWAY-PUBLIC-IP>:8080
curl http://<MONITORING-PUBLIC-IP>:9090
curl http://<MONITORING-PUBLIC-IP>:3001

# ❌ Debe fallar (puertos cerrados)
ssh ubuntu@<MICROSERVICE-PUBLIC-IP>  # Solo bastion permite SSH desde internet
curl http://<DB-PUBLIC-IP>:27017      # Bases de datos no expuestas
```

## 📝 Troubleshooting

### Problema: "Connection timeout" desde API Gateway a Microservices
**Causa**: Security group no permite el tráfico
**Solución**: Verificar que microservices-sg tiene regla de ingress con `source_security_group_id = api_gateway_sg`

### Problema: "Connection refused" desde Microservices a Database
**Causa**: Security group no permite el tráfico o servicio no escucha
**Solución**: 
1. Verificar que database-sg tiene regla con `source_security_group_id = microservices_sg`
2. Verificar que MongoDB/PostgreSQL/Redis están ejecutándose: `systemctl status mongodb`

### Problema: No puedo SSH a ninguna instancia excepto Bastion
**Causa**: SSH solo permitido desde bastion-sg
**Solución**: Esto es **correcto por diseño**. Usa el Bastion como jump host:
```bash
ssh -J ubuntu@<BASTION-IP> ubuntu@<TARGET-PRIVATE-IP>
```

### Problema: Frontend no puede llamar al API Gateway
**Causa**: Falta regla de ingress en api-gateway-sg
**Solución**: Verificar que api-gateway-sg tiene regla con `source_security_group_id = web_sg` para puerto 8080

## ✅ Checklist de Despliegue

Antes de hacer `terraform apply`, verificar:

- [ ] Security groups definidos: 7 total (bastion, web, api-gateway, microservices, database, messaging, monitoring)
- [ ] Referencia a `var.vpc_cidr` en lugar de hardcoded "10.0.0.0/16"
- [ ] `source_security_group_id` usado para comunicación entre SGs
- [ ] SSH permitido solo desde bastion-sg en todos los SGs
- [ ] Egress `0.0.0.0/0` habilitado en todos los SGs (para actualizaciones y salida)
- [ ] Puertos públicos solo en: 80, 443 (web), 8080 (api-gateway), 9090, 3001 (monitoring), 15672, 9001 (messaging-mgmt)
- [ ] Workflow limpia todos los SGs antes de recrearlos

## 🎯 Resultado Esperado

Al completar el despliegue:

1. ✅ Usuarios pueden acceder al frontend (puerto 80/443)
2. ✅ Frontend puede comunicarse con API Gateway (puerto 8080)
3. ✅ API Gateway puede llamar a todos los microservicios (3000-5010)
4. ✅ Microservicios pueden acceder a bases de datos (27017, 5432, 6379)
5. ✅ Microservicios pueden publicar/suscribirse a message brokers (9092, 5672, 1883)
6. ✅ Administradores pueden SSH a cualquier instancia vía Bastion
7. ✅ Prometheus puede scrapear métricas de todos los servicios
8. ✅ Grafana muestra dashboards desde internet
9. ❌ Nadie desde internet puede SSH directamente a servicios internos
10. ❌ Nadie desde internet puede acceder directamente a bases de datos

**Estado**: 🟢 LISTO PARA DESPLEGAR
