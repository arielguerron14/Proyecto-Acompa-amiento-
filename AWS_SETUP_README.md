# 🚀 AWS Deployment Setup - Guía de Uso Rápida

## 📂 Archivos Creados

Este directorio ahora contiene todos los archivos necesarios para desplegar el proyecto en AWS:

### Configuración

| Archivo | Descripción |
|---------|-------------|
| `.env.aws` | Template de configuración para AWS con todas las variables necesarias |
| `.env` | Archivo original (no modificar para local) |
| `docker-compose.aws.yml` | Compose para microservicios en AWS (sin bases de datos) |

### Scripts de Setup

| Archivo | Uso | Ambiente |
|---------|-----|----------|
| `setup-ec2-db.sh` | Prepara EC2-DB (instala Docker, crea directorios) | EC2-DB |
| `setup-ec2-microservices.sh` | Prepara EC2-Microservicios (instala Docker, clona repo) | EC2-Microservicios |

### Workflows (GitHub Actions)

| Archivo | Descripción |
|---------|-------------|
| `.github/workflows/deploy-databases-aws.yml` | Despliega PostgreSQL, MongoDB, Redis en EC2-DB |

### Documentación

| Archivo | Contenido |
|---------|----------|
| `AWS_DEPLOYMENT_GUIDE.md` | Guía completa paso a paso |
| Este archivo | Resumen rápido |

---

## ⚡ Inicio Rápido (5 pasos)

### 1️⃣ Crear Instancias EC2

```bash
# En AWS Console o CLI:
# - EC2-DB: t2.medium, Amazon Linux 2, 30 GB storage
# - EC2-Microservicios: t2.medium, Amazon Linux 2, 30 GB storage
# Obtener IPs privadas (ej: 172.31.79.193)
```

### 2️⃣ Configurar GitHub Secrets

En tu repositorio GitHub → Settings → Secrets:

```
AWS_EC2_DB_PRIVATE_IP       = 172.31.79.193 (tu IP real)
AWS_EC2_DB_SSH_PRIVATE_KEY  = [contenido archivo .pem]
POSTGRES_PASSWORD_AWS        = [contraseña fuerte]
```

### 3️⃣ Ejecutar Setup en EC2-DB

```bash
# SSH a EC2-DB
ssh -i tu-clave.pem ec2-user@IP_PUBLICA_EC2_DB

# Descargar y ejecutar setup
curl -o setup-ec2-db.sh https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/setup-ec2-db.sh
chmod +x setup-ec2-db.sh
./setup-ec2-db.sh
```

### 4️⃣ Desplegar Bases de Datos

En GitHub → Actions → "Deploy Databases to AWS EC2-DB":
- Ejecutar workflow
- Ingresar IP privada: `172.31.79.193`
- Seleccionar ambiente: `dev`

### 5️⃣ Ejecutar Setup en EC2-Microservicios

```bash
# SSH a EC2-Microservicios
ssh -i tu-clave.pem ec2-user@IP_PUBLICA_EC2_Microservicios

# Descargar y ejecutar setup
curl -o setup-ec2-microservices.sh https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/setup-ec2-microservices.sh
chmod +x setup-ec2-microservices.sh
./setup-ec2-microservices.sh 172.31.79.193  # IP privada de EC2-DB

# Desplegar
cd Proyecto-Acompa-amiento-
docker-compose -f docker-compose.aws.yml up -d
```

---

## 🔍 Verificación Rápida

```bash
# En EC2-Microservicios:

# 1. Verificar servicios
docker-compose -f docker-compose.aws.yml ps

# 2. Verificar conectividad
nc -zv 172.31.79.193 5432   # PostgreSQL
nc -zv 172.31.79.193 27017  # MongoDB  
nc -zv 172.31.79.193 6379   # Redis

# 3. Test de API
curl http://localhost:8080/health

# 4. Acceder a frontend
http://IP_PUBLICA_EC2_Microservicios:5500
```

---

## 🔐 Security Groups

### EC2-DB Security Group

**Inbound:**
| Protocolo | Puerto | Origen |
|-----------|--------|--------|
| TCP | 5432 | EC2-Microservicios SG |
| TCP | 27017 | EC2-Microservicios SG |
| TCP | 6379 | EC2-Microservicios SG |
| TCP | 22 | Tu IP (SSH) |

### EC2-Microservicios Security Group

**Inbound:**
| Protocolo | Puerto | Origen |
|-----------|--------|--------|
| TCP | 8080 | 0.0.0.0/0 |
| TCP | 5500 | 0.0.0.0/0 |
| TCP | 22 | Tu IP (SSH) |

---

## 📝 Checklist Antes de Desplegar

- [ ] Dos instancias EC2 creadas
- [ ] IPs privadas de ambas instancias anotadas
- [ ] GitHub Secrets configurados
- [ ] Security Groups configurados
- [ ] Claves SSH disponibles

## 🚨 Troubleshooting Común

### "No se puede conectar a PostgreSQL"
```bash
# Verificar que EC2-DB está corriendo
docker ps

# Verificar Security Group permite tráfico
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Desde EC2-Microservicios, test conectividad
nc -zv 172.31.79.193 5432
```

### "Contenedores no arrancan"
```bash
# Ver logs
docker-compose -f docker-compose.aws.yml logs

# Rebuild
docker-compose -f docker-compose.aws.yml build --no-cache
docker-compose -f docker-compose.aws.yml up -d
```

### ".env no encontrado o variables incorrectas"
```bash
# Verificar archivo .env
cat .env | head -20

# Recrear basado en setup
cat > .env << 'EOF'
NODE_ENV=production
MONGO_URI=mongodb://172.31.79.193:27017/acompanamiento
POSTGRES_HOST=172.31.79.193
REDIS_URL=redis://172.31.79.193:6379
...
EOF
```

---

## 📚 Documentación Completa

Para más detalles, ver **`AWS_DEPLOYMENT_GUIDE.md`**

---

## 🎯 Resumen de Cambios Realizados

✅ Creado `.env.aws` - template de variables para AWS  
✅ Creado `docker-compose.aws.yml` - compose sin bases de datos  
✅ Creado `deploy-databases-aws.yml` - workflow para desplegar BDs  
✅ Creado `setup-ec2-db.sh` - script de configuración EC2-DB  
✅ Creado `setup-ec2-microservices.sh` - script de configuración EC2-Micro  
✅ Creado `AWS_DEPLOYMENT_GUIDE.md` - guía completa  
✅ Actualizado `.env` con referencias a AWS  

---

## ⚙️ Próximos Pasos Opcionales (Escalabilidad)

1. **Migrar a RDS** (en lugar de EC2-DB)
2. **Configurar Load Balancer (ALB)**
3. **Setup Auto Scaling Group (ASG)**
4. **Monitoring con CloudWatch**
5. **CI/CD automático con GitHub Actions**

---

**Versión**: 1.0  
**Creado**: Enero 2026  
**Documentación**: Completa en `AWS_DEPLOYMENT_GUIDE.md`
