# 🎯 Guía Rápida: Ejecutar Deployment EC2-DB

## OPCIÓN 1: GitHub Actions (Recomendado) ⭐

### Paso 1: Obtener IP de EC2-DB
```bash
# Opción A: Desde AWS Console
# Services → EC2 → Instances → Buscar "EC2-DB" → Copiar IPv4 Public o Private

# Opción B: Desde Terraform
cd c:\Users\ariel\Escritorio\distri\terraform
terraform output -json | Select-String "EC2-DB" -A 5

# Opción C: Desde archivo tfstate
cat terraform.tfstate | grep -i "ec2.*db.*public_ip"
```

### Paso 2: Abrir GitHub Actions
```
1. Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-
2. Haz clic en: "Actions"
3. En la lista izquierda: "Deploy EC2-DB Services (MongoDB, PostgreSQL, Redis)"
4. Haz clic en: "Run workflow"
```

### Paso 3: Configurar Parámetros
```
instance_ip:         10.0.1.50  (tu IP de EC2-DB)
instance_name:       EC2-DB     (deja por defecto)
skip_verification:   false      (dejar por defecto)
```

### Paso 4: Ejecutar
```
Haz clic en: "Run workflow"
```

### Paso 5: Monitorear
```
• Espera a que aparezca el workflow en ejecución
• Haz clic en el workflow para ver logs en tiempo real
• Verás:
  ✓ SSH connection successful
  ✓ Docker image building
  ✓ Services starting
  ✓ Health checks running
  ✓ Final report
```

### Paso 6: Obtener Reporte
```
• Cuando termine (verde ✓), descarga el artifact
• Artifact: "ec2-db-deployment-report"
• Contiene: Logs completos y estado final
```

---

## OPCIÓN 2: Script Bash Manual

### Paso 1: Preparar
```bash
cd c:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-
chmod +x scripts/deploy-ec2-db.sh
```

### Paso 2: Obtener IP
```bash
# (Ver opciones en OPCIÓN 1, Paso 1)
EC2_DB_IP="10.0.1.50"  # Reemplazar con tu IP real
```

### Paso 3: Ejecutar Deployment
```bash
./scripts/deploy-ec2-db.sh $EC2_DB_IP EC2-DB
```

### Paso 4: Ver Progreso
```
• Output con colores mostrará:
  🟢 Pasos completados
  🟡 Advertencias
  🔴 Errores (si hay)
• Veras salida estilo:
  ✓ SSH connection verified
  ✓ Services deployed
  ✓ Health checks passed
```

---

## OPCIÓN 3: Generar Plan Primero

### Paso 1: Generar Mapa de Servicios
```bash
cd c:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-
chmod +x scripts/instance-service-mapper.sh
./scripts/instance-service-mapper.sh
```

### Paso 2: Revisar Archivos Generados
```
/tmp/deployment-plan.md
/tmp/env-configs/.env.db
/tmp/service-communication.txt
```

### Paso 3: Ejecutar Cuando Esté Listo
```bash
./scripts/deploy-ec2-db.sh 10.0.1.50 EC2-DB
```

---

## ✅ Verificar Deployment

### SSH a la Instancia
```bash
ssh -i ~/.ssh/id_rsa ubuntu@10.0.1.50
```

### Ver Estado de Servicios
```bash
cd ~/projeto-acompanimiento

# Verificar contenedores corriendo
docker-compose ps

# Deberías ver:
# NAME           STATUS              PORTS
# mongo          Up 2 minutes        27017/tcp
# postgres       Up 2 minutes        5432/tcp
# redis          Up 2 minutes        6380->6379/tcp
```

### Probar Conexiones
```bash
# MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"
# Respuesta esperada: { ok: 1 }

# PostgreSQL
docker-compose exec postgres psql -U postgres -d acompanamiento -c "SELECT version();"
# Respuesta esperada: PostgreSQL version...

# Redis
docker-compose exec redis redis-cli ping
# Respuesta esperada: PONG
```

### Ver Logs
```bash
# Todos los servicios
docker-compose logs

# Específico
docker-compose logs mongo --tail=20
docker-compose logs postgres --tail=20
docker-compose logs redis --tail=20
```

---

## 🆘 Solucionar Problemas

### Error: SSH Connection Timeout
```bash
# Verificar security group en AWS permite puerto 22:
# EC2 → Security Groups → Buscar SG → Inbound rules
# Debe haber una regla: SSH (22) from Your IP or 0.0.0.0/0

# Probar conectividad:
ping 10.0.1.50
ssh -vvv ubuntu@10.0.1.50  # Verbose para más detalles
```

### Error: Docker Not Found
```bash
# El workflow lo instala automáticamente, pero si error manual:
ssh ubuntu@10.0.1.50
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker ubuntu
exit  # Reconectar
```

### Error: Port Already in Use
```bash
ssh ubuntu@10.0.1.50
cd ~/projeto-acompanimento

# Ver qué está usando el puerto
sudo lsof -i :27017
sudo lsof -i :5432
sudo lsof -i :6379

# Limpiar y reiniciar
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### Error: Database Connection Refused
```bash
# Verificar que contenedores están corriendo
docker-compose ps

# Ver logs del servicio
docker-compose logs mongo
docker-compose logs postgres
docker-compose logs redis

# Esperar más tiempo para inicialización
sleep 60
docker-compose logs
```

---

## 📊 Estadísticas Esperadas

| Componente | Tiempo | Status |
|-----------|--------|--------|
| SSH Connection | <5s | ✓ |
| Docker Build (Mongo) | ~18s | ✓ |
| Docker Build (Postgres) | ~45s | ✓ |
| Docker Build (Redis) | ~8s | ✓ |
| Services Start | ~30s | ✓ |
| Health Checks | ~30s | ✓ |
| **TOTAL** | **~2-3 min** | ✓ |

---

## 🔐 Información de Conexión

**Una vez completado, los servicios estarán accesibles:**

### Desde la misma EC2-DB (interno):
```
MongoDB:   mongodb://root:example@mongo:27017
PostgreSQL: postgresql://postgres:example@postgres:5432/acompanamiento
Redis:     redis://redis:6379
```

### Desde otra EC2 (cross-instance):
```
MongoDB:   mongodb://root:example@10.0.1.50:27017
PostgreSQL: postgresql://postgres:example@10.0.1.50:5432/acompanamiento
Redis:     redis://10.0.1.50:6380
```

### Volumenes Persistentes:
```
/var/lib/docker/volumes/mongo_data
/var/lib/docker/volumes/postgres_data
/var/lib/docker/volumes/redis_data
```

---

## 🚀 Próximos Pasos Después de EC2-DB

```
1. EC2-DB ✅ COMPLETADO
   ├─ MongoDB corriendo
   ├─ PostgreSQL corriendo
   └─ Redis corriendo

2. Siguiente: EC2-API
   ./scripts/deploy-ec2-api.sh <EC2-API-IP>

3. Luego: EC2-CORE
   ./scripts/deploy-ec2-core.sh <EC2-CORE-IP>

4. Después: EC2-ANALYTICS, EC2-MESSAGING (paralelo)
   ./scripts/deploy-ec2-analytics.sh <IP>
   ./scripts/deploy-ec2-messaging.sh <IP>

5. Final: EC2-MONITORING
   ./scripts/deploy-ec2-monitoring.sh <IP>
```

---

## 📝 Notas Importantes

- ✅ SSH_PRIVATE_KEY ya configurado en GitHub secrets
- ✅ AWS credentials ya configurados
- ✅ Todos los scripts tienen permisos de ejecución
- ✅ docker-compose.yml ya preparado con servicios
- ✅ Redes y volúmenes configurados

**Listo para ejecutar: Usa OPCIÓN 1 (GitHub Actions) para mejor experiencia**

---

**¿Preguntas?**
- Ver: `docs/EC2-DB-DEPLOYMENT.md`
- Ver: `docs/DEPLOYMENT-ARCHITECTURE.md`
- Ver: `DEPLOYMENT-AUTOMATION-SUMMARY.md`
