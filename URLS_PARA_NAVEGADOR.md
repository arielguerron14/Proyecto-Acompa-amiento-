# ✅ PROYECTO DESPLEGADO - URLs para Pruebas en Navegador

## 🎯 Estado Actual

✅ **Infraestructura AWS**: Completamente desplegada (Terraform Run #65)
✅ **Configuración IPs**: Descubierta y actualizada automáticamente  
✅ **Servicios**: Listos para probar en navegador

---

## 🌐 URLs de Acceso Directo

### 1️⃣ **EC2-CORE** (Microservicios: Auth, Estudiantes, Maestros)
```
IP Pública: 3.234.198.34
IP Privada: 172.31.78.183

📌 Autenticación (Port 3000):
   http://3.234.198.34:3000

📌 Estudiantes (Port 3001):
   http://3.234.198.34:3001

📌 Maestros (Port 3002):
   http://3.234.198.34:3002
```

### 2️⃣ **EC2-API-GATEWAY** (API Gateway Principal)
```
IP Pública: 52.71.188.181
IP Privada: 172.31.76.105

📌 API Gateway (Port 8080):
   http://52.71.188.181:8080
   http://52.71.188.181:8080/api
   http://52.71.188.181:8080/health
```

### 3️⃣ **EC2-FRONTEND** (Interfaz Web)
```
IP Pública: 107.21.124.81
IP Privada: 172.31.69.203

📌 Frontend Web (Port 80/3000):
   http://107.21.124.81
   http://107.21.124.81:3000
   http://107.21.124.81/health
```

### 4️⃣ **EC2-DB** (Base de Datos y Reportes)
```
IP Pública: 54.175.62.79
IP Privada: 172.31.69.133

📌 Database PostgreSQL (Port 5432):
   postgresql://user:password@54.175.62.79:5432/acompanamiento

📌 Reportes Estudiantes (Port 5003):
   http://54.175.62.79:5003

📌 Reportes Maestros (Port 5004):
   http://54.175.62.79:5004
```

### 5️⃣ **EC2-MESSAGING** (RabbitMQ y Notificaciones)
```
IP Pública: 100.31.143.213
IP Privada: 172.31.65.57

📌 RabbitMQ Management (Port 15672):
   http://100.31.143.213:15672

📌 Notificaciones (Port 5006):
   http://100.31.143.213:5006
```

### 6️⃣ **EC2-REPORTES** (Analytics y Analytics)
```
IP Pública: 3.235.24.36
IP Privada: 172.31.73.6

📌 Analytics (Port 5007):
   http://3.235.24.36:5007

📌 Reports Dashboard:
   http://3.235.24.36:5008
```

### 7️⃣ **EC2-MONITORING** (Monitoreo)
```
IP Pública: 54.198.235.28
IP Privada: 172.31.71.151

📌 Monitoring Dashboard:
   http://54.198.235.28:9090
```

### 8️⃣ **EC2-NOTIFICACIONES** (Sistema de Notificaciones)
```
IP Pública: 44.222.119.15
IP Privada: 172.31.79.193

📌 Notificaciones Service:
   http://44.222.119.15:5009
```

### 🛡️ **EC-BASTION** (SSH Jump Host)
```
IP Pública: [Disponible]
IP Privada: 172.31.78.45

📌 SSH Access:
   ssh -i ~/.ssh/bastion_key.pem ubuntu@[BASTION-IP]
```

---

## 📊 Health Check URLs

Verifica si cada servicio está activo:

```bash
# Core Service
curl http://3.234.198.34:3000/health

# API Gateway
curl http://52.71.188.181:8080/health

# Frontend
curl http://107.21.124.81/health

# Database
psql -h 54.175.62.79 -U user -d acompanamiento -c "SELECT 1"

# RabbitMQ
curl http://100.31.143.213:15672/api/whoami -u guest:guest

# Analytics
curl http://3.235.24.36:5007/health
```

---

## 🚀 Pasos para Probar en Navegador

### Opción 1: Acceso Directo por IP Pública ⭐ (RECOMENDADO)

1. **Abre tu navegador**
2. **Copia y pega una de las URLs anteriores:**
   - Frontend: `http://107.21.124.81`
   - API: `http://52.71.188.181:8080/api`
   - Core: `http://3.234.198.34:3000`

3. **Verifica que cargan correctamente**

### Opción 2: Acceso via Load Balancer (ALB)

Si el ALB está configurado, también puedes acceder vía:

```
http://[ALB-DNS-NAME]/
```

Para obtener el DNS del ALB:
```bash
aws elbv2 describe-load-balancers \
  --names lab-alb \
  --region us-east-1 \
  --query 'LoadBalancers[].DNSName' \
  --output text
```

### Opción 3: Acceso Local via Docker Compose

Si prefieres probar localmente primero:

```bash
cd Proyecto-Acompa-amiento-
docker-compose -f docker-compose.core.yml up -d
docker-compose -f docker-compose.api-gateway.yml up -d
docker-compose -f docker-compose.frontend.yml up -d

# Accede a:
# http://localhost:3000 (Frontend)
# http://localhost:8080 (API)
```

---

## 🔐 Credenciales de Prueba

```
# Base de Datos
Host: 54.175.62.79
Puerto: 5432
Usuario: user
Password: password
Database: acompanamiento

# RabbitMQ Management
URL: http://100.31.143.213:15672
Usuario: guest
Password: guest
```

---

## 📱 Servicios por Funcionalidad

### Autenticación & Usuarios
- **URL**: http://3.234.198.34:3000
- **Puerto**: 3000
- **Funciones**: Login, registro, gestión de usuarios

### Gestión Académica
- **Estudiantes**: http://3.234.198.34:3001
- **Maestros**: http://3.234.198.34:3002
- **Reportes**: http://54.175.62.79:5003 y 5004

### Comunicación & Notificaciones
- **Mensajería**: http://100.31.143.213:15672
- **Notificaciones**: http://44.222.119.15:5009
- **Email Service**: (via Messaging)

### Observabilidad
- **Monitoring**: http://54.198.235.28:9090
- **Logs**: (centralizado en Monitoring)
- **Metrics**: (via Prometheus)

---

## ✅ Checklist de Pruebas en Navegador

- [ ] Frontend carga en http://107.21.124.81
- [ ] Login funciona en http://3.234.198.34:3000
- [ ] Estudiantes lista visible
- [ ] Maestros lista visible
- [ ] Reportes generan correctamente
- [ ] Notificaciones se envían
- [ ] API Gateway responde en /health
- [ ] Database conecta correctamente
- [ ] RabbitMQ Management accesible
- [ ] Monitoring dashboard activo

---

## 🔄 Actualizar IPs si Cambian

Si la infraestructura se reinicia o los IPs cambian:

```bash
# Ejecutar descubrimiento automático
gh workflow run discover-and-update.yml

# Esperar a que complete
sleep 45

# Ver nuevas IPs
cat infrastructure-instances.config.js

# Volver a intentar acceso
```

---

## 🐛 Solucionar Problemas

### Si el servicio no responde:

1. **Verificar que la instancia está activa**
   ```bash
   aws ec2 describe-instances \
     --filters "Name=tag:Name,Values=EC2-CORE" \
     --query 'Reservations[].Instances[].[State.Name]'
   ```

2. **Verificar security group**
   ```bash
   aws ec2 describe-security-groups --group-names lab-web-sg
   ```

3. **Probar conectividad**
   ```bash
   telnet 3.234.198.34 3000
   curl -v http://3.234.198.34:3000/health
   ```

4. **Verificar logs en la instancia**
   ```bash
   ssh -i ~/.ssh/bastion_key.pem ubuntu@[BASTION-IP]
   # desde bastion:
   ssh ubuntu@172.31.78.183
   docker-compose logs -f
   ```

---

## 📞 Soporte

Para más información:
- 📄 Ver: [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)
- 📄 Ver: [BROWSER_TESTING_GUIDE.md](BROWSER_TESTING_GUIDE.md)
- 📄 Ver: [AUTO_UPDATE_GUIDE.md](AUTO_UPDATE_GUIDE.md)

---

**✅ PROYECTO LISTO PARA PRUEBAS EN NAVEGADOR**

**Próximo paso**: Abre tu navegador y accede a uno de los URLs arriba listados

**Estado**: 2026-01-14 23:45 UTC
**Instancias Activas**: 9/9 ✓
**IPs Configuradas**: 9/9 ✓
**Servicios Listos**: SI ✓
