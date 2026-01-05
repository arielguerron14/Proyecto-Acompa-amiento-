# 🚀 AWS Deployment Documentation Index

## 📚 Documentación Disponible

### 🎯 Dónde Empezar

Si es tu **primera vez** desplegando en AWS, sigue este orden:

1. **[AWS_SETUP_README.md](./AWS_SETUP_README.md)** (5 minutos)
   - Resumen rápido de archivos creados
   - Checklist antes de desplegar
   - Inicio rápido en 5 pasos

2. **[AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)** (30-45 minutos)
   - Guía completa paso a paso
   - Diagrama de arquitectura
   - Instrucciones detalladas para cada paso
   - Verificación y testing

3. **[AWS_TROUBLESHOOTING.md](./AWS_TROUBLESHOOTING.md)** (Según necesario)
   - Problemas comunes y soluciones
   - Diagnostic scripts
   - Comandos útiles

---

## 🛠️ Scripts Auxiliares

### Pre-Flight Check
**Archivo:** `pre-flight-check.sh`  
**Uso:** Antes de desplegar
```bash
chmod +x pre-flight-check.sh
./pre-flight-check.sh
```
**Verifica:**
- Archivos necesarios existen
- Estructura de directorios
- Configuración válida
- GitHub Secrets necesarios

---

### GitHub Secrets Helper
**Archivo:** `github-secrets-helper.sh`  
**Uso:** Durante configuración inicial
```bash
chmod +x github-secrets-helper.sh
./github-secrets-helper.sh
```
**Ofrece:**
- Menú interactivo
- Instrucciones para cada secret
- Generadores de contraseña
- Setup SSH local

---

### Post-Deployment Test
**Archivo:** `post-deployment-test.sh`  
**Uso:** Después de desplegar
```bash
chmod +x post-deployment-test.sh
./post-deployment-test.sh <EC2_MICRO_IP> <EC2_DB_IP>

# Ejemplo:
./post-deployment-test.sh 54.123.45.67 172.31.79.193
```
**Verifica:**
- Conectividad a servicios
- Bases de datos disponibles
- Health checks
- Acceso frontend

---

### Setup Scripts para EC2

#### EC2-DB Setup
**Archivo:** `setup-ec2-db.sh`  
**Dónde:** En la instancia EC2-DB  
**Cómo:** 
```bash
curl -o setup-ec2-db.sh https://raw.githubusercontent.com/.../setup-ec2-db.sh
chmod +x setup-ec2-db.sh
./setup-ec2-db.sh
```
**Hace:**
- Instala Docker y Docker Compose
- Crea directorios de datos
- Configura permisos de usuario
- Muestra IP privada

---

#### EC2-Microservicios Setup
**Archivo:** `setup-ec2-microservices.sh`  
**Dónde:** En la instancia EC2-Microservicios  
**Cómo:**
```bash
curl -o setup-ec2-microservices.sh https://raw.githubusercontent.com/.../setup-ec2-microservices.sh
chmod +x setup-ec2-microservices.sh
./setup-ec2-microservices.sh 172.31.79.193
# Parámetro: IP privada de EC2-DB
```
**Hace:**
- Instala Docker y Docker Compose
- Clona repositorio
- Crea .env con variables AWS
- Verifica conectividad a BDs
- Muestra URLs de acceso

---

## 📋 Archivos de Configuración

### `.env.aws` - Template de Variables
**Propósito:** Template con todas las variables necesarias para AWS  
**Contenido:**
- `MONGO_URI` con placeholder `IP_PRIVADA_EC2_DB`
- `POSTGRES_HOST` con placeholder
- `REDIS_URL` con placeholder
- Variables de ambiente, JWT, etc.

**Uso:** Referencia para copiar a `.env` real

### `docker-compose.aws.yml` - Composition para AWS
**Propósito:** Orquestra microservicios (SIN bases de datos)  
**Contiene:**
- 8 microservicios definidos
- Health checks
- Logging configuration
- Environment variables
- Network configuration

**Uso:** En EC2-Microservicios
```bash
docker-compose -f docker-compose.aws.yml up -d
```

### `.github/workflows/deploy-databases-aws.yml` - GitHub Actions
**Propósito:** Despliegue automático de bases de datos en EC2-DB  
**Features:**
- Trigger manual con inputs
- SSH a EC2-DB
- Cleanup idempotente
- Creación de contenedores
- Health checks
- Named volumes

**Uso:** GitHub → Actions → Trigger manual

---

## 🔄 Flujo de Despliegue Completo

```
┌─────────────────────────────────────┐
│ 1. Preparación Local                │
│  • Clonar repo                      │
│  • Ejecutar pre-flight-check.sh     │
│  • Revisar AWS_SETUP_README.md      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Configuración AWS                │
│  • Crear 2 instancias EC2           │
│  • Obtener IPs públicas y privadas  │
│  • Configurar Security Groups       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. GitHub Secrets                   │
│  • Usar github-secrets-helper.sh    │
│  • Configurar 3 secrets             │
│  • Verificar en GitHub              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Setup EC2-DB                     │
│  • SSH a EC2-DB                     │
│  • Ejecutar setup-ec2-db.sh         │
│  • Verificar Docker está listo      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Deploy Bases de Datos            │
│  • GitHub Actions trigger           │
│  • Workflow despliega BD en EC2-DB  │
│  • Verificar health checks          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. Setup EC2-Microservicios         │
│  • SSH a EC2-Microservicios         │
│  • Ejecutar setup-ec2-microservicios │
│  • Pasar IP privada de EC2-DB      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 7. Deploy Microservicios            │
│  • docker-compose -f aws up -d      │
│  • Esperar a que arranquen          │
│  • Ejecutar post-deployment-test.sh │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 8. Verificación                     │
│  • Acceder a frontend               │
│  • Probar login                     │
│  • Verificar logs                   │
│  • ¡Listo!                          │
└─────────────────────────────────────┘
```

---

## 🔐 Seguridad

### GitHub Secrets Requeridos
| Secret | Contenido | Sensibilidad |
|--------|-----------|--------------|
| `AWS_EC2_DB_PRIVATE_IP` | 172.31.x.x | Media |
| `AWS_EC2_DB_SSH_PRIVATE_KEY` | Clave RSA .pem | ALTA |
| `POSTGRES_PASSWORD_AWS` | Contraseña | ALTA |

### Best Practices
- ✅ Nunca commitear .pem al repo
- ✅ Usar GitHub Secrets para credenciales
- ✅ Rotación periódica de contraseñas
- ✅ Security Groups restrictivos
- ✅ SSH keys con permisos 600
- ✅ .env.aws solo tiene templates/placeholders

---

## 📊 Arquitectura

```
Internet (0.0.0.0)
    │
    ├─ 54.123.45.67:8080 (API Gateway - EC2-Microservicios)
    ├─ 54.123.45.67:5500 (Frontend - EC2-Microservicios)
    │
    └─ VPC (172.31.0.0/16)
         │
         ├─ EC2-Microservicios (172.31.x.y)
         │   ├─ api-gateway:8080
         │   ├─ micro-auth:5005
         │   ├─ micro-maestros:5001
         │   ├─ micro-estudiantes:5002
         │   ├─ micro-reportes-*:5003-5004
         │   ├─ micro-notificaciones:5006
         │   ├─ micro-soap-bridge:5008
         │   └─ frontend-web:5500
         │
         └─ EC2-DB (172.31.x.z) - PRIVADA
             ├─ PostgreSQL:5432
             ├─ MongoDB:27017
             └─ Redis:6379
```

---

## ✅ Checklist Rápido

### Antes de Desplegar
- [ ] Ejecuté `pre-flight-check.sh`
- [ ] Creé 2 instancias EC2
- [ ] Anoté IPs públicas y privadas
- [ ] Configuré Security Groups
- [ ] Guardé el archivo .pem

### GitHub Secrets
- [ ] `AWS_EC2_DB_PRIVATE_IP` creado
- [ ] `AWS_EC2_DB_SSH_PRIVATE_KEY` creado
- [ ] `POSTGRES_PASSWORD_AWS` creado
- [ ] Verifiqué en Settings → Secrets

### Después de Desplegar
- [ ] Ejecuté `post-deployment-test.sh`
- [ ] Accedí a http://IP:5500 (frontend)
- [ ] Hice login
- [ ] Verifiqué logs sin errores
- [ ] Documenté URLs y acceso

---

## 🆘 Resolución de Problemas

Si algo no funciona:

1. **Revisa los logs:**
   ```bash
   docker-compose -f docker-compose.aws.yml logs -f
   ```

2. **Ejecuta el post-deployment test:**
   ```bash
   ./post-deployment-test.sh IP1 IP2
   ```

3. **Consulta troubleshooting:**
   - [AWS_TROUBLESHOOTING.md](./AWS_TROUBLESHOOTING.md)

4. **Verifica documentación completa:**
   - [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)

---

## 📞 Referencias Rápidas

### Comandos Útiles en EC2-DB
```bash
# Ver contenedores
docker ps

# Ver logs
docker logs mongo
docker logs postgres

# Test conectividad
docker exec mongo mongosh --eval "db.adminCommand('ping')"
docker exec postgres pg_isready
docker exec redis redis-cli ping

# Ver directorios de datos
ls -la /data/
```

### Comandos Útiles en EC2-Microservicios
```bash
# Ver servicios
docker-compose -f docker-compose.aws.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.aws.yml logs -f api-gateway

# Test health
curl http://localhost:8080/health

# Reiniciar servicio
docker-compose -f docker-compose.aws.yml restart api-gateway

# Stop/Start
docker-compose -f docker-compose.aws.yml stop
docker-compose -f docker-compose.aws.yml start
```

---

## 🎓 Próximos Pasos (Opcional)

Después de despliegue básico exitoso:

1. **Alta Disponibilidad:**
   - Auto Scaling Groups
   - Load Balancer (ALB)
   - Múltiples AZs

2. **Gestión de BD:**
   - RDS en lugar de EC2
   - Backups automáticos
   - Multi-AZ replication

3. **Monitoreo:**
   - CloudWatch
   - Application Insights
   - Custom metrics

4. **Seguridad:**
   - WAF en ALB
   - Secrets Manager para credenciales
   - VPC privada/pública

---

**Documentación creada:** Enero 2026  
**Versión:** 1.0  
**Maintainer:** Tu Equipo  

¿Preguntas? Revisa [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) o [AWS_TROUBLESHOOTING.md](./AWS_TROUBLESHOOTING.md)
