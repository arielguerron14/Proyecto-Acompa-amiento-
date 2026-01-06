# 🚀 GitHub Actions Deployment Guide

## Overview

Todos los workflows de deployment están configurados y listos para ejecutarse desde GitHub Actions.

**No necesitas nada local excepto el secret SSH key en GitHub.**

---

## 📋 Workflows Disponibles

| Workflow | Archivo | Descripción | EC2 Instance |
|----------|---------|-------------|--------------|
| Deploy EC2-DB | `deploy-ec2-db.yml` | MongoDB, PostgreSQL, Redis | 44.222.119.15 |
| Deploy EC2-CORE | `deploy-ec2-core.yml` | Auth, Estudiantes, Maestros | 13.216.12.61 |
| Deploy EC2-API-Gateway | `deploy-ec2-api-gateway.yml` | API Gateway | 52.71.188.181 |
| Deploy EC2-Frontend | `deploy-ec2-frontend.yml` | Frontend Web | 107.21.124.81 |
| Deploy EC2-Reportes | `deploy-ec2-reportes.yml` | Reportes | 54.175.62.79 |
| Deploy EC2-Notificaciones | `deploy-ec2-notificaciones.yml` | Notificaciones | 100.31.143.213 |
| Deploy EC2-Messaging | `deploy-ec2-messaging.yml` | Kafka, RabbitMQ | 3.235.24.36 |
| Deploy All Services | `deploy-all-services.yml` | Full Stack (todos en orden) | Todas |

---

## 🔑 Requisito: SSH Key Secret

Todos los workflows usan el secret `AWS_EC2_DB_SSH_PRIVATE_KEY`.

**Verificar que existe en GitHub:**
1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Busca `AWS_EC2_DB_SSH_PRIVATE_KEY`
4. Si no existe, créalo con el contenido del archivo `.pem`

---

## 🚀 Ejecutar un Workflow

### Opción 1: Full Stack (RECOMENDADO)

Esto deployará TODO en orden automático:

```
1. EC2-DB (Base de datos)
   ↓
2. EC2-Messaging (Kafka, RabbitMQ)
   ↓
3. EC2-CORE (Microservicios)
   ↓
4. EC2-API-Gateway
   ↓
5. EC2-Frontend
   ↓
6. EC2-Reportes
   ↓
7. EC2-Notificaciones
```

**Para ejecutar:**

1. Ve a GitHub → Actions → "🚀 Deploy All Services (Full Stack)"
2. Click en "Run workflow"
3. Selecciona opciones:
   - `skip_db`: "false" (para deployar todo desde cero)
   - O "true" (si la BD ya está corriendo)
4. Click en "Run workflow"
5. ¡Observa el progreso!

### Opción 2: Deployar un Servicio Individual

Si solo necesitas redeploy de UN servicio:

1. Ve a GitHub → Actions
2. Busca el workflow específico (ej: "🚀 Deploy EC2-DB")
3. Click en "Run workflow"
4. Click en "Run workflow"

Espera a que complete.

---

## 📊 Monitoreo de Deployment

### Durante la ejecución:

1. Ve a GitHub → Actions
2. Verás el workflow corriendo en tiempo real
3. Cada paso muestra:
   - ✅ Pasos completados
   - ⏳ Pasos en progreso
   - ❌ Errores (si hay)

### Logs detallados:

Click en cualquier job para ver:
- Conectividad SSH
- Instalación de Docker
- Inicio de contenedores
- Health checks
- Mensajes de validación

---

## ✅ Validar Deployment

Después que un workflow termina, verás:

```
╔════════════════════════════════════════════════════════════╗
║             ✅ EC2-DB DEPLOYMENT COMPLETED                ║
╚════════════════════════════════════════════════════════════╝

🌐 Instance Information:
  • Instance Name: EC2-DB
  • Public IP: 44.222.119.15
  • Private IP: 172.31.79.193

💾 Database Connection Strings (Internal VPC):
  MongoDB: mongodb://admin:mongodb123@172.31.79.193:27017/acompanamiento?authSource=admin
  PostgreSQL: postgresql://postgres:postgres123@172.31.79.193:5432/acompanamiento
  Redis: redis://:redis123@172.31.79.193:6379
```

---

## 🔄 Workflow Execution Order

Si corres **Deploy All Services**, el orden es:

```
deploy-order (determinación de orden)
    ↓
deploy-db (paso 1 - Base de datos)
    ↓
deploy-messaging (paso 2 - Kafka/RabbitMQ)
    ↓
deploy-core (paso 3 - Microservicios)
    ↓
deploy-api-gateway (paso 4 - API)
    ↓
deploy-frontend (paso 5 - Frontend)
    ↓
deploy-reportes (paso 6 - Reportes)
    ↓
deploy-notificaciones (paso 7 - Notificaciones)
    ↓
summary (resumen final)
```

Cada paso **espera** a que el anterior complete exitosamente.

---

## 🔐 SSH Authentication

Cada workflow:

1. ✅ Lee el secret `AWS_EC2_DB_SSH_PRIVATE_KEY`
2. ✅ Lo guarda en `~/.ssh/aws-key.pem`
3. ✅ Cambia permisos a `600` (seguro)
4. ✅ Lo usa para conectarse a las instancias EC2
5. ✅ Ejecuta comandos remotos

**No necesitas nada local. Todo se hace en GitHub Actions.**

---

## 🎯 Casos de Uso

### Caso 1: Primer Deployment (desde cero)

```
1. Ve a GitHub Actions
2. "🚀 Deploy All Services"
3. Selecciona skip_db = "false"
4. Run workflow
5. Espera 30-45 minutos
6. ✅ Todo está deploying
```

### Caso 2: Re-deploy solo Bases de Datos

```
1. GitHub Actions → "🚀 Deploy EC2-DB"
2. Run workflow
3. Espera 10 minutos
4. ✅ BD reiniciada
```

### Caso 3: Re-deploy solo Frontend

```
1. GitHub Actions → "🚀 Deploy EC2-Frontend"
2. Run workflow
3. Espera 5 minutos
4. ✅ Frontend actualizado
```

### Caso 4: Agregar un nuevo microservicio

```
1. Crea un nuevo workflow basado en los existentes
2. Agrega step para tu servicio
3. Integra en el workflow maestro
4. Push a GitHub
5. Run workflow
```

---

## 📝 Qué Hace Cada Workflow

### EC2-DB Workflow

```bash
1. Conecta a EC2-DB (44.222.119.15)
2. Instala Docker + Docker Compose
3. Crea docker-compose.yml con MongoDB, PostgreSQL, Redis
4. Inicia contenedores
5. Valida que BD están corriendo
6. Muestra info de conexión
```

### EC2-CORE Workflow

```bash
1. Conecta a EC2-CORE (13.216.12.61)
2. Instala Docker + Node.js + Docker Compose
3. Crea docker-compose.yml para 3 microservicios
4. Configura variables de entorno (IPs hardcodeadas)
5. Inicia contenedores
6. Valida servicios
```

### EC2-API-Gateway Workflow

```bash
1. Conecta a EC2-API-Gateway (52.71.188.181)
2. Prepara instancia
3. Crea docker-compose para API Gateway
4. Configura rutas a microservicios internos
5. Inicia contenedor
6. Valida que está respondiendo
```

*Y así sucesivamente para cada servicio...*

---

## ⚠️ Posibles Errores y Soluciones

### Error: "Permission denied (publickey)"

**Causa:** El secret SSH key no existe o es incorrecto

**Solución:**
1. Ve a GitHub → Settings → Secrets
2. Verifica que `AWS_EC2_DB_SSH_PRIVATE_KEY` existe
3. Si no, créalo con el contenido del `.pem`
4. Rerun workflow

### Error: "Connection refused"

**Causa:** La instancia EC2 está parada o el security group no permite SSH

**Solución:**
1. Ve a AWS Console → EC2 → Instances
2. Verifica que la instancia está "running"
3. Verifica que el security group permite SSH (puerto 22)
4. Rerun workflow

### Error: "docker-compose: command not found"

**Causa:** Docker Compose no se instaló correctamente

**Solución:**
1. El workflow reintentará instalar
2. Si sigue fallando, SSH manualmente a la instancia:
   ```bash
   sudo curl -sL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
     -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
3. Rerun workflow

### Error: "Container failed to start"

**Causa:** Imagen Docker no existe o BD no está lista

**Solución:**
1. Verifica que primero corriste EC2-DB
2. Espera a que EC2-DB esté completamente running
3. Luego deploy otros servicios
4. Usa "Deploy All Services" para que espere automáticamente

---

## 🔍 Debugging

### Ver logs completos

1. GitHub → Actions → Workflow corriendo
2. Click en cualquier job/step
3. Expande "Run commands"
4. Ve todo lo que pasó

### SSH manual a una instancia

Si necesitas debuggear:

```bash
# Obtén la SSH key
# (está en tu máquina, no en GitHub)

ssh -i ~/.ssh/aws-key.pem ec2-user@44.222.119.15

# Dentro de la instancia:
docker ps -a          # Ver contenedores
docker logs mongodb   # Ver logs
docker exec -it mongodb mongosh  # Conectar a MongoDB
```

---

## 📚 Archivos de Workflow

```
.github/workflows/
├── deploy-ec2-db.yml                    ← BD
├── deploy-ec2-core.yml                  ← Microservicios
├── deploy-ec2-api-gateway.yml           ← API
├── deploy-ec2-frontend.yml              ← Frontend
├── deploy-ec2-reportes.yml              ← Reportes
├── deploy-ec2-notificaciones.yml        ← Notificaciones
├── deploy-ec2-messaging.yml             ← Kafka/RabbitMQ
└── deploy-all-services.yml              ← MAESTRO (orquesta todos)
```

---

## 🎯 Próximos Pasos

1. ✅ Verifica que el secret SSH existe en GitHub
2. ✅ Ve a GitHub Actions
3. ✅ Ejecuta "🚀 Deploy All Services"
4. ✅ Observa el progreso
5. ✅ Una vez complete, tu full stack está corriendo

```
http://107.21.124.81              ← Frontend
http://52.71.188.181:8080         ← API Gateway
http://54.198.235.28:3000         ← Grafana (Monitoring)
```

---

## 💡 Tips

- **Usa Deploy All Services para primer deployment**
- **Para re-deploy, puedes usar workflows individuales**
- **Los workflows son idempotentes (puedes correrlos varias veces)**
- **Los secrets nunca se muestran en logs (seguro)**
- **Cada workflow es independiente y reutilizable**

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs en GitHub Actions
2. Verifica el secret SSH en GitHub
3. Verifica que las instancias EC2 están running
4. Verifica security groups permiten SSH

¡Listo! Ahora puedes deployar todo desde GitHub Actions sin necesidad de SSH local.
