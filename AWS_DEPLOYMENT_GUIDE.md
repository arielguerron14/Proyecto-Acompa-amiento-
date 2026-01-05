# 🏗️ GUÍA DE DESPLIEGUE EN AWS - Sistema de Acompañamiento Académico

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Objetivo**: Desplegar el proyecto en AWS usando múltiples instancias EC2 con bases de datos centralizadas

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso 1: Preparar EC2-DB](#paso-1-preparar-ec2-db)
4. [Paso 2: Desplegar Bases de Datos](#paso-2-desplegar-bases-de-datos)
5. [Paso 3: Preparar EC2-Microservicios](#paso-3-preparar-ec2-microservicios)
6. [Paso 4: Desplegar Microservicios](#paso-4-desplegar-microservicios)
7. [Verificaciones y Testing](#verificaciones-y-testing)
8. [Troubleshooting](#troubleshooting)
9. [Escalabilidad Futura](#escalabilidad-futura)

---

## 🏛️ Arquitectura General

### Diagrama de Arquitectura AWS

```
┌─────────────────────────────────────────────────────────────────┐
│                      VPC (172.31.0.0/16)                         │
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │   EC2-DB             │         │  EC2-Microservicios  │      │
│  │ (172.31.79.193)      │         │ (172.31.20.100)      │      │
│  │                      │         │                      │      │
│  │ ┌────────────────┐   │         │ ┌────────────────┐   │      │
│  │ │  PostgreSQL    │   │         │ │  API Gateway   │   │      │
│  │ │  :5432         │   │         │ │  :8080         │   │      │
│  │ └────────────────┘   │         │ └────────────────┘   │      │
│  │                      │◄────────┤                      │      │
│  │ ┌────────────────┐   │         │ ┌────────────────┐   │      │
│  │ │  MongoDB       │   │         │ │  Microservicios│   │      │
│  │ │  :27017        │   │         │ │  :5000-5008    │   │      │
│  │ └────────────────┘   │         │ └────────────────┘   │      │
│  │                      │◄────────┤                      │      │
│  │ ┌────────────────┐   │         │ ┌────────────────┐   │      │
│  │ │  Redis         │   │         │ │  Frontend Web  │   │      │
│  │ │  :6379         │   │         │ │  :5500         │   │      │
│  │ └────────────────┘   │         │ └────────────────┘   │      │
│  │                      │         │                      │      │
│  │ SG: EC2-DB-SG        │         │ SG: EC2-Micro-SG    │      │
│  │ (Allow 5432,27017,   │         │ (Allow 8080, 5500)   │      │
│  │  6379 from Micro)    │         │                      │      │
│  └──────────────────────┘         └──────────────────────┘      │
│                                                                   │
│              ↓ (Comunicación por IP Privada)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐        │
│  │         Internet Gateway / NAT Gateway               │        │
│  │         (Acceso a Internet y desde Internet)         │        │
│  └──────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
       ↑
       │ HTTPS (puerto 443 o 8080)
       │
    Usuarios
```

### Componentes

| Componente | Descripción | IP Privada | Puertos |
|---|---|---|---|
| **EC2-DB** | Instancia para bases de datos | 172.31.79.193 | 5432, 27017, 6379 |
| **PostgreSQL** | Base relacional | localhost:5432 | 5432 |
| **MongoDB** | Base NoSQL | localhost:27017 | 27017 |
| **Redis** | Cache en memoria | localhost:6379 | 6379 |
| **EC2-Microservicios** | Instancia para servicios | 172.31.20.100 | 8080, 5500, 5000-5008 |
| **API Gateway** | Punto de entrada | localhost:8080 | 8080 |
| **Microservicios** | Lógica de negocio | localhost | 5000-5008 |
| **Frontend Web** | Interfaz de usuario | localhost:5500 | 5500 |

---

## ✅ Requisitos Previos

### Recursos AWS
- [ ] Cuenta AWS activa
- [ ] VPC configurada (default o custom)
- [ ] 2 instancias EC2 (t2.medium o superior)
  - [ ] EC2-DB: para bases de datos
  - [ ] EC2-Microservicios: para aplicación
- [ ] Security Groups configurados
- [ ] Par de claves SSH

### Local
- [ ] GitHub CLI (`gh`)
- [ ] SSH configurado localmente
- [ ] Docker instalado (para pruebas locales)

### GitHub Secrets
Configura los siguientes secrets en tu repositorio GitHub:

```
AWS_EC2_DB_PRIVATE_IP        = 172.31.79.193        (IP privada EC2-DB)
AWS_EC2_DB_SSH_PRIVATE_KEY   = [contenido de .pem]   (Clave SSH EC2-DB)
POSTGRES_PASSWORD_AWS         = [contraseña fuerte]   (PostgreSQL)
JWT_SECRET_PROD              = [secret JWT fuerte]    (JWT en producción)
```

---

## 🚀 Paso 1: Preparar EC2-DB

### 1.1 Crear la instancia EC2-DB

En AWS Console:
1. Lanza una nueva instancia EC2
2. Tipo: `t2.medium` (mínimo)
3. OS: Amazon Linux 2 (compatible con el script)
4. Storage: 30 GB (ajusta según necesidad)
5. Security Group: Permitir SSH (puerto 22) desde tu IP
6. Etiqueta: `Name: EC2-DB`

### 1.2 Obtener IP privada

```bash
# En AWS Console, instance details
# O vía CLI:
aws ec2 describe-instances --filters "Name=tag:Name,Values=EC2-DB" \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' --output text
```

**Nota**: Recuerda esta IP (ej: `172.31.79.193`)

### 1.3 Conectar a EC2-DB y ejecutar setup

```bash
# Conectar por SSH
ssh -i tu-clave.pem ec2-user@IP_PUBLICA_EC2_DB

# Descargar el script de setup
curl -o setup-ec2-db.sh https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/setup-ec2-db.sh
chmod +x setup-ec2-db.sh

# Ejecutar
./setup-ec2-db.sh
```

**Output esperado:**
```
[✓] Sistema actualizado
[✓] Docker instalado
[✓] Docker iniciado y habilitado
[✓] Directorios creados en /data
[✓] Setup completado
```

### 1.4 Configurar Security Group de EC2-DB

En AWS Console, edita el Security Group de EC2-DB:

**Inbound Rules:**
| Tipo | Protocolo | Rango Puerto | Origen |
|---|---|---|---|
| Custom TCP | TCP | 5432 | SG de EC2-Microservicios |
| Custom TCP | TCP | 27017 | SG de EC2-Microservicios |
| Custom TCP | TCP | 6379 | SG de EC2-Microservicios |
| SSH | TCP | 22 | Mi IP / 0.0.0.0/0 |

---

## 🗄️ Paso 2: Desplegar Bases de Datos

### 2.1 Configurar GitHub Secrets

En GitHub, ve a **Settings → Secrets and Variables → Actions** y añade:

```
AWS_EC2_DB_PRIVATE_IP: 172.31.79.193
AWS_EC2_DB_SSH_PRIVATE_KEY: [contenido del archivo .pem]
POSTGRES_PASSWORD_AWS: MiPasswordSegura123!
```

### 2.2 Ejecutar Workflow de Despliegue

En GitHub:
1. Ve a **Actions**
2. Selecciona **Deploy Databases to AWS EC2-DB**
3. Click en **Run workflow**
4. Ingresa:
   - EC2-DB Private IP: `172.31.79.193`
   - Environment: `dev` (o `staging`/`prod`)
5. Click **Run workflow**

### 2.3 Monitorear el despliegue

En la ejecución del workflow:
```
✓ SSH connection successful
✓ Data directories created
✓ Existing containers cleaned up
✓ Docker volumes created/verified
✓ PostgreSQL deployed
✓ MongoDB deployed
✓ Redis deployed
✓ Health checks passed
```

### 2.4 Verificar bases de datos

```bash
# Conectar a EC2-DB
ssh -i tu-clave.pem ec2-user@IP_PUBLICA_EC2_DB

# Ver contenedores
docker ps -a

# Verificar salud
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test de conectividad (desde EC2-Microservicios después)
docker exec acompanamiento-postgres psql -U postgres -c "SELECT version();"
docker exec acompanamiento-mongo mongosh --eval "db.adminCommand('ping')"
docker exec acompanamiento-redis redis-cli ping
```

---

## 🔧 Paso 3: Preparar EC2-Microservicios

### 3.1 Crear la instancia EC2-Microservicios

En AWS Console:
1. Lanza una nueva instancia EC2
2. Tipo: `t2.medium` (mínimo)
3. OS: Amazon Linux 2
4. Storage: 30 GB
5. Security Group: Permitir SSH + HTTP/HTTPS
6. Etiqueta: `Name: EC2-Microservicios`

### 3.2 Obtener IP privada de EC2-Microservicios

Similar a paso 1.2:
```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=EC2-Microservicios" \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' --output text
```

### 3.3 Ejecutar setup en EC2-Microservicios

```bash
# Conectar por SSH
ssh -i tu-clave.pem ec2-user@IP_PUBLICA_EC2_Microservicios

# Descargar el script de setup
curl -o setup-ec2-microservices.sh https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/setup-ec2-microservices.sh
chmod +x setup-ec2-microservices.sh

# Ejecutar con IP privada de EC2-DB
./setup-ec2-microservices.sh 172.31.79.193
```

**Output esperado:**
```
[✓] Sistema actualizado
[✓] Docker instalado
[✓] Docker Compose instalado
[✓] Repositorio clonado/actualizado
[✓] .env creado con configuración de EC2-DB
[✓] Setup completado
```

### 3.4 Configurar Security Group de EC2-Microservicios

**Inbound Rules:**
| Tipo | Protocolo | Rango Puerto | Origen |
|---|---|---|---|
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 |
| Custom TCP | TCP | 5500 | 0.0.0.0/0 |
| SSH | TCP | 22 | Mi IP / 0.0.0.0/0 |

### 3.5 Reiniciar sesión SSH

Después de ejecutar el setup, reinicia SSH para que los permisos de Docker surtan efecto:

```bash
exit

# Reconectar
ssh -i tu-clave.pem ec2-user@IP_PUBLICA_EC2_Microservicios
```

---

## 🚀 Paso 4: Desplegar Microservicios

### 4.1 Verificar configuración

```bash
# Verificar .env
cat .env | grep -E "DB_HOST|MONGO|POSTGRES|REDIS"

# Verificar conectividad a bases de datos
nc -zv 172.31.79.193 5432   # PostgreSQL
nc -zv 172.31.79.193 27017  # MongoDB
nc -zv 172.31.79.193 6379   # Redis
```

**Resultado esperado:**
```
Connection to 172.31.79.193 port 5432 [tcp/postgresql] succeeded!
Connection to 172.31.79.193 port 27017 [tcp/mongodb] succeeded!
Connection to 172.31.79.193 port 6379 [tcp/redis] succeeded!
```

### 4.2 Desplegar microservicios

```bash
cd Proyecto-Acompa-amiento-

# Desplegar
docker-compose -f docker-compose.aws.yml up -d

# Verificar
docker-compose -f docker-compose.aws.yml ps

# Ver logs
docker-compose -f docker-compose.aws.yml logs -f api-gateway
```

### 4.3 Verificar que los servicios están saludables

```bash
# Esperar ~60 segundos para que todos los servicios estén listos
sleep 60

# Verificar status
docker-compose -f docker-compose.aws.yml ps

# Ver health checks
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test de connectividad
curl http://localhost:8080/health
curl http://localhost:5500/
```

---

## ✅ Verificaciones y Testing

### Checklist de Verificación

```bash
# 1. Bases de datos accesibles
psql -h 172.31.79.193 -U postgres -d acompanamiento -c "SELECT 1;"
mongo --host 172.31.79.193 --eval "db.adminCommand('ping')"
redis-cli -h 172.31.79.193 ping

# 2. API Gateway responde
curl -i http://localhost:8080/health

# 3. Frontend carga
curl -i http://localhost:5500/

# 4. Microservicios saludables
docker-compose -f docker-compose.aws.yml ps

# 5. Logs sin errores
docker-compose -f docker-compose.aws.yml logs api-gateway | tail -20
```

### Test de Flujo End-to-End

1. **Registrar usuario:**
   ```bash
   curl -X POST http://localhost:8080/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","rol":"estudiante"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

3. **Acceder al frontend:**
   ```
   http://IP_PUBLICA_EC2_Microservicios:5500
   ```

---

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. No se puede conectar a bases de datos desde microservicios
**Causa**: Security Group no permite tráfico  
**Solución**:
```bash
# Verificar security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Editar rules en AWS Console
# Asegurar que EC2-DB SG permite entrada desde EC2-Microservicios SG
```

#### 2. Contenedores no arrancan
**Causa**: Imagen Docker no disponible  
**Solución**:
```bash
# Rebuildar imágenes
docker-compose -f docker-compose.aws.yml build --no-cache

# O pullear desde Docker Hub (si están allí)
docker pull mi-usuario/acompanamiento-api-gateway:latest
```

#### 3. Microservicios no conectan a bases de datos
**Causa**: Variables de entorno incorrectas  
**Solución**:
```bash
# Verificar .env
cat .env | grep MONGO_URI

# Verificar en contenedor
docker exec api-gateway env | grep MONGO

# Recrear contenedores
docker-compose -f docker-compose.aws.yml down
docker-compose -f docker-compose.aws.yml up -d
```

#### 4. Puerto 8080 ya está en uso
**Causa**: Otro servicio usando el puerto  
**Solución**:
```bash
# Encontrar qué usa el puerto
sudo lsof -i :8080

# O cambiar el puerto en .env
API_GATEWAY_PORT=8081
docker-compose -f docker-compose.aws.yml up -d
```

---

## 📈 Escalabilidad Futura

### Arquitectura de Alta Disponibilidad

Para futuro escalamiento:

```
┌─────────────────────────────────────────────────────────────┐
│                   AWS Multi-AZ                              │
│                                                              │
│  ┌────────────────────┐        ┌────────────────────┐      │
│  │   EC2-DB-Primary   │────────│   EC2-DB-Secondary │      │
│  │   (172.31.79.193)  │ Repl.  │   (172.31.79.194)  │      │
│  │                    │        │                    │      │
│  │ PostgreSQL (RDS)   │        │ PostgreSQL (RDS)   │      │
│  │ MongoDB Replica    │        │ MongoDB Replica    │      │
│  │ Redis Cluster      │        │ Redis Cluster      │      │
│  └────────────────────┘        └────────────────────┘      │
│           ▲                              ▲                   │
│           └──────────────┬───────────────┘                  │
│                          │                                   │
│         ┌────────────────▼──────────────┐                   │
│         │    Load Balancer (ELB)        │                   │
│         │    (Distribute requests)      │                   │
│         └────────────────┬──────────────┘                   │
│                          │                                   │
│  ┌──────────────────────┴──────────────────────┐            │
│  │                                              │            │
│  ▼              ▼              ▼              ▼             │
│ Micro-1     Micro-2     Micro-3     Micro-N              │
│ EC2-1       EC2-2       EC2-3       EC2-N               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pasos para Alta Disponibilidad

1. **RDS en lugar de EC2-DB**
   - Migrar PostgreSQL a AWS RDS
   - Migrar MongoDB a MongoDB Atlas
   - Migrar Redis a ElastiCache

2. **Auto Scaling Group**
   - Crear AMI de EC2-Microservicios
   - Configurar ASG para escalar automáticamente

3. **Load Balancer**
   - Configurar Application Load Balancer (ALB)
   - Distribuir tráfico entre microservicios

4. **CloudWatch + Auto Scaling**
   - Monitorear métricas (CPU, memory, response time)
   - Escalar basado en demanda

---

## 📚 Documentación Adicional

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [Docker Compose](https://docs.docker.com/compose/)
- [Project Repository](https://github.com/arielguerron14/Proyecto-Acompa-amiento-)

---

## 🎯 Resumen Rápido

```bash
# EC2-DB
curl -o setup-ec2-db.sh https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/setup-ec2-db.sh
./setup-ec2-db.sh

# GitHub Actions: Deploy Databases to AWS EC2-DB
# Input: 172.31.79.193, dev

# EC2-Microservicios
curl -o setup-ec2-microservices.sh https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/setup-ec2-microservices.sh
./setup-ec2-microservices.sh 172.31.79.193

# Desplegar
cd Proyecto-Acompa-amiento-
docker-compose -f docker-compose.aws.yml up -d

# Verificar
docker-compose -f docker-compose.aws.yml ps
curl http://localhost:8080/health
```

---

**Versión**: 1.0  
**Última actualización**: Enero 2026  
**Mantenedor**: Equipo de DevOps
