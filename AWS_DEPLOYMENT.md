# AWS Deployment Configuration

## Instancias EC2 y Servicios

| Nombre | IP Pública | IP Elástica | IP Privada | Servicios | Puerto |
|--------|-----------|------------|-----------|-----------|--------|
| **EC2-DB** | 44.192.114.31 | — | 172.31.79.193 | MongoDB, PostgreSQL | 27017, 5432 |
| **EC2-CORE** | 13.216.12.61 | 13.216.12.61 | 172.31.78.183 | api-gateway, micro-auth, micro-estudiantes, micro-maestros | 8080, 3000, 3001, 3002 |
| **EC2-Reportes** | 54.175.62.79 | 54.175.62.79 | 172.31.69.133 | micro-reportes-estudiantes, micro-reportes-maestros | 5003, 5004 |
| **EC2-Notificaciones** | 44.192.74.171 | — | 172.31.65.57 | micro-notificaciones | 5005 |
| **EC2-Messaging** | 18.205.26.214 | — | 172.31.73.6 | MQTT Broker (Mosquitto) | 1883, 9001 |
| **EC2-API-Gateway** | 52.71.188.181 | 52.71.188.181 | 172.31.76.105 | api-gateway (replica) | 8080 |
| **EC2-Frontend** | 107.21.124.81 | 107.21.124.81 | 172.31.69.203 | frontend-web, nginx | 5500, 80 |
| **EC2-Monitoring** | 54.198.235.28 | 54.198.235.28 | 172.31.71.151 | Prometheus, Grafana | 9090, 3000 |

## Comunicación Inter-Servicios

### Dentro de instancia (localhost)
- EC2-CORE: api-gateway ↔ micro-auth/micro-estudiantes/micro-maestros (localhost:PORT)

### Entre instancias (IPs privadas - recomendado)
- EC2-CORE → EC2-DB: mongodb://172.31.79.193:27017 (privada)
- EC2-CORE → EC2-Reportes: http://172.31.69.133:5003, http://172.31.69.133:5004
- EC2-CORE → EC2-Notificaciones: http://172.31.65.57:5005
- EC2-CORE → EC2-Messaging: mqtt://172.31.73.6:1883
- EC2-API-Gateway → EC2-CORE: http://172.31.78.183:8080 (replica/LB)
- EC2-Frontend → EC2-API-Gateway: http://52.71.188.181:8080 (IP pública o IP privada: 172.31.76.105)

### Acceso desde Internet
- Usuarios → EC2-Frontend: http://107.21.124.81 (IP pública)
- Usuarios → EC2-API-Gateway (direct): http://52.71.188.181 (IP elástica para API)

## Deployment Order

1. **EC2-DB**: MongoDB, PostgreSQL (sin dependencias)
2. **EC2-CORE**: api-gateway, micro-auth, micro-estudiantes, micro-maestros (depende de DB)
3. **EC2-Reportes**: micro-reportes-estudiantes, micro-reportes-maestros (depende de DB, pero independiente de Core)
4. **EC2-Notificaciones**: micro-notificaciones (opcional, depende de Messaging)
5. **EC2-Messaging**: MQTT Broker
6. **EC2-API-Gateway**: api-gateway replica (depende de CORE)
7. **EC2-Frontend**: frontend-web, nginx (depende de API-Gateway)
8. **EC2-Monitoring**: Prometheus, Grafana (depende de todos para scraping)

## .env Template para cada instancia

### EC2-DB (MongoDB, PostgreSQL)
```
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=<SecurePassword>
POSTGRES_USER=admin
POSTGRES_PASSWORD=<SecurePassword>
POSTGRES_DB=acompaamiento
```

### EC2-CORE
```
NODE_ENV=production
PORT=8080
AUTH_SERVICE=http://localhost:3000
MAESTROS_SERVICE=http://localhost:3002
ESTUDIANTES_SERVICE=http://localhost:3001
REPORTES_EST_URL=http://172.31.69.133:5003
REPORTES_MAEST_URL=http://172.31.69.133:5004
NOTIFICACIONES_URL=http://172.31.65.57:5005
MESSAGING_URL=mqtt://172.31.73.6:1883
MONGO_URL=mongodb://admin:<pass>@172.31.79.193:27017/acompaamiento?authSource=admin
POSTGRES_URL=postgresql://admin:<pass>@172.31.79.193:5432/acompaamiento
JWT_SECRET=<SecureSecret>
```

### EC2-Reportes
```
PORT=5003
MONGO_URL=mongodb://admin:<pass>@172.31.79.193:27017/reportes_est?authSource=admin
POSTGRES_URL=postgresql://admin:<pass>@172.31.79.193:5432/acompaamiento
NODE_ENV=production
```

### EC2-Frontend
```
API_BASE_URL=http://52.71.188.181:8080
NODE_ENV=production
PORT=5500
```

## Health Check URLs

- api-gateway: `GET http://52.71.188.181:8080/health`
- micro-auth: `GET http://172.31.78.183:3000/health`
- micro-estudiantes: `GET http://172.31.78.183:3001/health`
- micro-maestros: `GET http://172.31.78.183:3002/health`
- micro-reportes-estudiantes: `GET http://172.31.69.133:5003/health`
- micro-reportes-maestros: `GET http://172.31.69.133:5004/health`
- frontend: `GET http://107.21.124.81:5500/` (HTTP 200)

## Test Flows

### Post-Deploy Smoke Tests
1. **Health checks**: Verify all services return 200 on /health
2. **Register user**: POST /api/auth/register
3. **Login user**: POST /api/auth/login
4. **Fetch horarios**: GET /api/horarios/maestros
5. **Create reserva**: POST /api/estudiantes/reservar
6. **List reservas**: GET /api/estudiantes/reservas/estudiante/:id
7. **Check reportes**: GET /api/reportes/estudiantes/reporte/:id

## GitHub Actions Workflows

Each service (api-gateway, micro-auth, micro-core, micro-reportes, frontend, etc.) will have:
1. Build Docker image
2. Deploy to target EC2 instance
3. Run health checks
4. Log container output

Workflows will be triggered on:
- `push` to `main` (auto-deploy)
- `workflow_dispatch` (manual trigger)

## Security Notes

- Use IAM roles for EC2 instances (not static AWS keys)
- Store secrets (DB passwords, JWT) in AWS Secrets Manager or EC2 Systems Manager Parameter Store
- Use security groups to restrict inter-instance communication
- Enable VPC Flow Logs for debugging
- Use private subnets for DB/Messaging; public only for Frontend/API-Gateway
