# 🚀 GUÍA RÁPIDA DE DEPLOY - START HERE

## ¡COMIENZA AQUÍ! Instucciones en 3 Pasos

### Paso 1️⃣: Verifica el Secret en GitHub
```
GitHub Settings → Secrets and variables → Actions
Busca: AWS_EC2_DB_SSH_PRIVATE_KEY

Si NO está → Crear:
1. Abre tu archivo .pem
2. Copia TODO el contenido (---BEGIN... a ...END---)
3. Settings → New repository secret
4. Name: AWS_EC2_DB_SSH_PRIVATE_KEY
5. Paste el contenido
6. Add secret
```

### Paso 2️⃣: Ejecuta el Deploy Maestro
```
1. Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions
2. Selecciona: "🚀 Deploy All Services (Full Stack)"
3. Click: "Run workflow"
4. Selecciona:
   - skip_db = false
   - skip_messaging = false
5. Click: "Run workflow"
```

### Paso 3️⃣: Monitorea el Progreso
```
Cada workflow aparecerá en orden:
1. ✅ EC2-DB (5-10 min)        - Bases de datos
2. ✅ EC2-MESSAGING (5 min)    - Kafka/RabbitMQ
3. ✅ EC2-CORE (10 min)        - Microservicios
4. ✅ EC2-API-GATEWAY (5 min)  - Router
5. ✅ EC2-FRONTEND (5 min)     - Web UI
6. ✅ EC2-REPORTES (5 min)     - Reportes
7. ✅ EC2-NOTIFICACIONES (5 min) - Notificaciones

⏱️  TOTAL: ~45 minutos
```

---

## 🎯 Qué Pasará Después del Deploy

### URLs Públicas (Acceso desde Internet)
```
🌐 Frontend Web:
   http://107.21.124.81

📊 API Gateway:
   http://52.71.188.181:8080

📈 Grafana (Monitoreo):
   http://54.198.235.28:3000
   Usuario: admin
   Contraseña: admin

📋 Reportes:
   http://54.175.62.79:5003 (Estudiantes)
   http://54.175.62.79:5004 (Maestros)
```

### Credenciales Bases de Datos (Por Defecto - CAMBIAR EN PRODUCCIÓN)
```
MongoDB:
  Usuario: admin
  Contraseña: mongodb123
  Puerto: 27017
  BD: acompanamiento

PostgreSQL:
  Usuario: postgres
  Contraseña: postgres123
  Puerto: 5432
  BD: acompanamiento

Redis:
  Contraseña: redis123
  Puerto: 6379
```

---

## 🔍 Cómo Verificar el Deployment

### Opción 1: Desde GitHub Actions
```
1. Actions → Deploy All Services
2. Mira los logs en tiempo real
3. Cada paso muestra qué está haciendo
4. Al final: ✅ All workflows completed
```

### Opción 2: SSH a las Instancias
```bash
# Conectar a EC2-DB
ssh -i tu-key.pem ec2-user@44.222.119.15

# Ver contenedores corriendo
docker ps -a

# Ver logs
docker logs mongodb
docker logs postgresql
docker logs redis

# Probar MongoDB
docker exec mongodb mongosh --version

# Probar PostgreSQL
docker exec postgresql psql -U postgres -c "SELECT 1"

# Probar Redis
docker exec redis redis-cli ping
```

### Opción 3: Probar Servicios
```bash
# Frontend
curl http://107.21.124.81

# API Gateway
curl http://52.71.188.181:8080/health

# Reportes
curl http://54.175.62.79:5003/health
```

---

## ⚠️ Si Algo Falla

### Revisar Logs
```
1. GitHub Actions → El workflow que falló
2. Click en el job rojo ❌
3. Desplega el step que falló
4. Lee el error
```

### Errores Comunes

#### Error: "Permission denied (publickey)"
**Causa:** Secret SSH no configurado correctamente
**Solución:** Verifica que AWS_EC2_DB_SSH_PRIVATE_KEY está en GitHub Settings

#### Error: "Connection timeout"
**Causa:** EC2 instance no está corriendo
**Solución:** Verifica en AWS que las instancias estén running

#### Error: "Docker command not found"
**Causa:** Docker no instalado
**Solución:** El workflow instala Docker, espera y reinicia

#### Error: "Port already in use"
**Causa:** El puerto ya está ocupado (servicio previo corriendo)
**Solución:** SSH a la instancia y `docker stop nombre-container`

---

## 🔄 Redeploy Individual

Si necesitas desplegar solo UN servicio:

```
1. Actions → deploy-ec2-nombre.yml (ej: deploy-ec2-db.yml)
2. Run workflow
3. Espera a que complete
```

Cada workflow puede ejecutarse independientemente:
- `deploy-ec2-db.yml` - Solo bases de datos
- `deploy-ec2-messaging.yml` - Solo Kafka/RabbitMQ
- `deploy-ec2-core.yml` - Solo microservicios
- `deploy-ec2-api-gateway.yml` - Solo API Gateway
- `deploy-ec2-frontend.yml` - Solo Frontend
- `deploy-ec2-reportes.yml` - Solo Reportes
- `deploy-ec2-notificaciones.yml` - Solo Notificaciones

---

## 📚 Documentación Completa

Para información detallada, lee:

1. **DOCUMENTACION_INDEX.md** - Índice de todo
2. **IP_CONFIGURATION_GUIDE.md** - Entender las IPs
3. **QUICK_START_DEPLOYMENT.md** - Deploy rápido
4. **GITHUB_ACTIONS_DEPLOYMENT_GUIDE.md** - Guía completa
5. **HARDCODED_CONFIG_GUIDE.md** - Configuraciones
6. **DEPLOYMENT_SYSTEM_SUMMARY.md** - Resumen técnico

---

## ✅ Checklist Antes de Desplegar

- [ ] AWS_EC2_DB_SSH_PRIVATE_KEY secret está en GitHub
- [ ] Todas las 8 EC2 instances están running en AWS
- [ ] IPs públicas son correctas (compara con AWS Console)
- [ ] Tienes acceso a GitHub repo (push permissions)
- [ ] Tienes ~45 minutos de tiempo
- [ ] Monitorea los logs en GitHub Actions

---

## 🎉 Después del Deploy

Una vez completado:

1. **Accede a Frontend**: http://107.21.124.81
2. **Prueba el API**: http://52.71.188.181:8080
3. **Monitoreo**: http://54.198.235.28:3000 (Grafana)
4. **Verifica Logs**: SSH a instancias y `docker logs`
5. **Documentación**: Lee la guía de troubleshooting

---

**Estado**: ✅ Todo listo para deploy  
**Fecha**: January 6, 2026  
**Tiempo estimado**: 45 minutos  
**Próximo paso**: Ve a GitHub Actions y ejecuta el workflow
