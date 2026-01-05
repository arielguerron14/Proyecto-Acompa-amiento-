# 📝 AWS Deployment Documentation Template

**Completar este documento con los detalles de tu despliegue para referencia futura.**

---

## 📅 Información General

| Campo | Valor |
|-------|-------|
| **Fecha de Despliegue** | AAAA-MM-DD |
| **Versión del Proyecto** | v1.0.0 |
| **Ambiente** | dev / staging / prod |
| **Responsable** | Tu Nombre |
| **Contacto** | tu-email@example.com |
| **Última Actualización** | AAAA-MM-DD |

---

## 🔧 Instancias EC2

### EC2-DB (Bases de Datos)

```
┌─────────────────────────────────────────┐
│ EC2-DB - Bases de Datos                │
├─────────────────────────────────────────┤
│ Instance ID:     i-0123456789abcdef0    │
│ IP Pública:      54.123.45.67           │
│ IP Privada:      172.31.79.193          │
│ Tipo:            t2.medium              │
│ Region:          us-east-1              │
│ AZ:              us-east-1a             │
│ Subnet:          subnet-xxxxx           │
│ Security Group:  sg-xxxxx (SG-DB)       │
│ Key Pair:        my-key.pem             │
│ AMI:             ami-xxxxxxxxx          │
│ Storage:         30 GB gp2              │
│ Status:          running ✓              │
└─────────────────────────────────────────┘
```

**Datos para completar:**
- Instance ID: `_________________________________`
- IP Pública: `_________________________________`
- IP Privada: `_________________________________` (CRÍTICA - guardar)
- Tipo: `_________________________________`
- Region/AZ: `_________________________________`
- Security Group: `_________________________________`

---

### EC2-Microservicios (Aplicación)

```
┌─────────────────────────────────────────┐
│ EC2-Microservicios - Aplicación        │
├─────────────────────────────────────────┤
│ Instance ID:     i-abcdef0123456789     │
│ IP Pública:      54.234.56.78           │
│ IP Privada:      172.31.80.45           │
│ Tipo:            t2.medium              │
│ Region:          us-east-1              │
│ AZ:              us-east-1a             │
│ Subnet:          subnet-yyyyy           │
│ Security Group:  sg-yyyyy (SG-Micro)    │
│ Key Pair:        my-key.pem             │
│ AMI:             ami-yyyyyyyyy          │
│ Storage:         30 GB gp2              │
│ Status:          running ✓              │
└─────────────────────────────────────────┘
```

**Datos para completar:**
- Instance ID: `_________________________________`
- IP Pública: `_________________________________` (para acceso frontend)
- IP Privada: `_________________________________`
- Tipo: `_________________________________`
- Region/AZ: `_________________________________`
- Security Group: `_________________________________`

---

## 🔐 Security Groups

### SG-DB (EC2-DB)

| Protocolo | Desde Puerto | Hasta Puerto | Origen | Descripción |
|-----------|--------------|--------------|--------|-------------|
| TCP | 5432 | 5432 | SG-Micro | PostgreSQL |
| TCP | 27017 | 27017 | SG-Micro | MongoDB |
| TCP | 6379 | 6379 | SG-Micro | Redis |
| TCP | 22 | 22 | Tu IP | SSH |
| | | | | |

**Validar:**
- [ ] PostgreSQL abierto desde SG-Micro
- [ ] MongoDB abierto desde SG-Micro
- [ ] Redis abierto desde SG-Micro
- [ ] SSH accesible desde tu IP
- [ ] Sin acceso desde internet (0.0.0.0)

### SG-Microservicios (EC2-Microservicios)

| Protocolo | Desde Puerto | Hasta Puerto | Origen | Descripción |
|-----------|--------------|--------------|--------|-------------|
| TCP | 8080 | 8080 | 0.0.0.0/0 | API Gateway |
| TCP | 5500 | 5500 | 0.0.0.0/0 | Frontend Web |
| TCP | 22 | 22 | Tu IP | SSH |
| | | | | |

**Validar:**
- [ ] API Gateway (8080) abierto a internet
- [ ] Frontend (5500) abierto a internet
- [ ] SSH accesible desde tu IP
- [ ] Puede conectar a SG-DB en puertos DB

---

## 🔑 GitHub Secrets

| Secret | Valor | Guardado |
|--------|-------|----------|
| `AWS_EC2_DB_PRIVATE_IP` | 172.31.79.193 | ☐ |
| `AWS_EC2_DB_SSH_PRIVATE_KEY` | [archivo .pem] | ☐ |
| `POSTGRES_PASSWORD_AWS` | [contraseña] | ☐ |

**Checklist:**
- [ ] Todos los 3 secrets configurados
- [ ] Valores correctos verificados
- [ ] Archivos .pem guardados en lugar seguro
- [ ] Contraseña guardada en gestor de secrets

---

## 🐳 Docker Setup

### En EC2-DB

**Instalación:**
```bash
Fecha completado: ________________

# Verificar
$ docker --version
$ docker-compose --version
$ docker ps
```

**Status:**
```
CONTAINER ID        IMAGE               NAMES              STATUS
xxx                 postgres:15         postgres           Up 2 days
xxx                 mongo:7             mongo              Up 2 days
xxx                 redis:7             redis              Up 2 days
```

**Volúmenes:**
```bash
$ docker volume ls | grep acompanamiento
acompanamiento-postgres-vol
acompanamiento-mongo-vol
acompanamiento-redis-vol
```

**Health Checks:**
- [ ] PostgreSQL responde: `docker exec postgres pg_isready` → OK
- [ ] MongoDB responde: `docker exec mongo mongosh --eval "db.adminCommand('ping')"` → OK
- [ ] Redis responde: `docker exec redis redis-cli ping` → OK

### En EC2-Microservicios

**Instalación:**
```bash
Fecha completado: ________________

# Verificar
$ docker --version
$ docker-compose --version
$ docker-compose -f docker-compose.aws.yml ps
```

**Servicios Corriendo:**
```
NAME                          STATUS
api-gateway                   Up
micro-auth                    Up
micro-maestros                Up
micro-estudiantes             Up
micro-reportes-estudiantes    Up
micro-reportes-maestros       Up
micro-notificaciones          Up
micro-soap-bridge             Up
frontend-web                  Up
```

---

## 🌐 URLs de Acceso

| Servicio | URL | Puerto | Status |
|----------|-----|--------|--------|
| **Frontend** | http://54.234.56.78:5500 | 5500 | ☐ |
| **API Gateway** | http://54.234.56.78:8080 | 8080 | ☐ |
| **Auth Service** | http://54.234.56.78:5005 | 5005 | ☐ |
| **Maestros** | http://54.234.56.78:5001 | 5001 | ☐ |
| **Estudiantes** | http://54.234.56.78:5002 | 5002 | ☐ |

**Actualizar con IPs reales después del despliegue**

---

## 📊 Variables de Ambiente

### En EC2-Microservicios (.env)

```bash
# Verificar estos valores
$ cat .env | grep -E "MONGO_URI|POSTGRES_HOST|REDIS_URL"

MONGO_URI=mongodb://172.31.79.193:27017/acompanamiento
POSTGRES_HOST=172.31.79.193
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<guardado en secret>
REDIS_URL=redis://172.31.79.193:6379

NODE_ENV=production
JWT_SECRET=<guardado en secret>
```

**Verificar:**
- [ ] IP privada de EC2-DB es correcta: `172.31.79.193`
- [ ] Contraseña de PostgreSQL es correcta
- [ ] JWT_SECRET está configurado
- [ ] NODE_ENV es production

---

## 🚀 GitHub Actions Workflow

### Deploy Databases Workflow

```
Workflow: deploy-databases-aws.yml
Estado: ☐ Exitoso / ☐ Fallido / ☐ No ejecutado

Último run:
Fecha: ________________
Duración: ________________
Log: ________________
```

**Detalles de ejecución:**
- [ ] Workflow triggered manually
- [ ] SSH connection established
- [ ] Containers created successfully
- [ ] Health checks passed
- [ ] Artifacts uploaded

---

## ✅ Verificación Post-Despliegue

### Checklist de Conectividad

```bash
# Desde tu computadora
./post-deployment-test.sh 54.234.56.78 172.31.79.193
```

**Resultados:**
- [ ] API Gateway responding (8080)
- [ ] Frontend accessible (5500)
- [ ] PostgreSQL reachable (5432)
- [ ] MongoDB reachable (27017)
- [ ] Redis reachable (6379)
- [ ] Microservices health checks passed

### Tests Funcionales

**Login:**
```bash
curl -X POST http://54.234.56.78:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"test","password":"test"}'

Status: ☐ 200 / ☐ Error
Response: ___________________________________
```

**Listar Estudiantes:**
```bash
curl http://54.234.56.78:8080/estudiantes \
  -H 'Authorization: Bearer <token>'

Status: ☐ 200 / ☐ Error
Cantidad de registros: ___________
```

**Listar Maestros:**
```bash
curl http://54.234.56.78:8080/maestros \
  -H 'Authorization: Bearer <token>'

Status: ☐ 200 / ☐ Error
Cantidad de registros: ___________
```

---

## 📋 Logs y Diagnostics

### Capturas de Logs Importantes

**EC2-DB Status:**
```bash
$ docker ps

[Pegar output aquí]
```

**EC2-Microservicios Status:**
```bash
$ docker-compose -f docker-compose.aws.yml ps

[Pegar output aquí]
```

**Health Check Results:**
```bash
# Guardar output
[Pegar aquí]
```

---

## 🔄 Información de Mantenimiento

### Acceso SSH

**EC2-DB:**
```bash
ssh -i ~/.ssh/my-key.pem ec2-user@54.123.45.67
# o usar alias si configuraste:
sshdb
```

**EC2-Microservicios:**
```bash
ssh -i ~/.ssh/my-key.pem ec2-user@54.234.56.78
# o usar alias si configuraste:
sshmicro
```

### Procedimientos Comunes

**Ver logs en tiempo real:**
```bash
docker-compose -f docker-compose.aws.yml logs -f api-gateway
```

**Reiniciar un servicio:**
```bash
docker-compose -f docker-compose.aws.yml restart micro-auth
```

**Backup de base de datos:**
```bash
docker exec postgres pg_dump -U postgres acompanamiento > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📞 Contactos y Escalación

| Rol | Nombre | Email | Teléfono |
|-----|--------|-------|----------|
| Propietario | | | |
| Admin | | | |
| Dev/Ops | | | |

---

## 🔍 Notas Adicionales

### Problemas Encontrados y Soluciones

1. **Problema:** [Descripción]
   - **Solución:** [Cómo se resolvió]
   - **Fecha:** [Cuándo]
   - **Responsable:** [Quién]

2. **Problema:** [Descripción]
   - **Solución:** [Cómo se resolvió]
   - **Fecha:** [Cuándo]
   - **Responsable:** [Quién]

### Mejoras Futuras

- [ ] Migrar BDs a RDS
- [ ] Agregar Load Balancer
- [ ] Configurar Auto Scaling
- [ ] Implementar CloudWatch
- [ ] Agregar WAF

### Cambios Realizados

- **Fecha:** ____________  
  **Descripción:** ________________________________________________  
  **Responsable:** ____________

- **Fecha:** ____________  
  **Descripción:** ________________________________________________  
  **Responsable:** ____________

---

## 📄 Referencias

- [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) - Guía completa
- [AWS_SETUP_README.md](./AWS_SETUP_README.md) - Setup rápido
- [AWS_TROUBLESHOOTING.md](./AWS_TROUBLESHOOTING.md) - Solución de problemas
- [AWS_DOCUMENTATION_INDEX.md](./AWS_DOCUMENTATION_INDEX.md) - Índice de docs

---

**Documento Completado:** [FECHA]  
**Versión:** 1.0  
**Estado:** ☐ Borrador / ☐ Completado / ☐ Verificado

Firma del Responsable: ___________________________
