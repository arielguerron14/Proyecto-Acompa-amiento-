# 🚀 Deploy via SSH (Sequential Jobs) - RESUMEN RÁPIDO

## 📋 El Workflow en 60 Segundos

**Nombre**: `deploy-ssh-sequential.yml`  
**Ubicación**: `.github/workflows/deploy-ssh-sequential.yml`  
**Disparador**: Manual (workflow_dispatch)  
**Duración**: 60-90 minutos (depende de rebuild_images)

---

## 🎯 Qué Hace

1. Lee IPs desde `config/instance_ips.json` (sin hardcodear)
2. Despliega 10 instancias EC2 **en secuencia** vía SSH
3. Docker build O pull según opción del usuario
4. Conecta servicios usando IPs privadas (comunicación interna)
5. Expone servicios en puertos públicos según aplique

---

## 📦 Las 10 Instancias (en orden)

```
1. ⏱️  EC2-Messaging
   └─ Zookeeper (2181) + Kafka (9092) + RabbitMQ (5672)

2. 🗄️  EC2-DB
   └─ MongoDB (27017) + PostgreSQL (5432) + Redis (6379)

3. 🐳 EC2-CORE
   └─ micro-auth (3000) + micro-estudiantes (3001) + micro-maestros (3002) + micro-core (3003)

4. 🌐 EC2-API-Gateway
   └─ api-gateway (8080)
      └─ Conecta a CORE vía IP privada

5. 📄 EC2-Reportes
   └─ micro-reportes-estudiantes (3005) + micro-reportes-maestros (3006)
      └─ Conectan a DB vía IP privada

6. 🔔 EC2-Notificaciones
   └─ micro-notificaciones (5005)
      └─ Conecta a DB + Messaging vía IP privada

7. 📊 EC2-Analytics
   └─ micro-analytics (3004)
      └─ Conecta a DB vía IP privada

8. 📈 EC2-Monitoring
   └─ Prometheus (9090) + Grafana (3000)
      └─ Monitorean CORE

9. 🎨 EC2-Frontend
   └─ frontend-web (5500)
      └─ Conecta a API-Gateway vía IP privada

10. 🛡️  EC-Bastion
    └─ bastion-host (22)
```

---

## 🔗 Dependencias (Por Qué Este Orden)

```
Messaging → DB (necesita que Zookeeper/Kafka estén listos)
   ↓
CORE (necesita DB)
   ↓
API-Gateway (necesita CORE)
   ↓
Frontend (necesita API-Gateway)
   ↓
Bastion (última instancia)

Parallel: Reportes, Notificaciones, Analytics, Monitoring 
          (según sus dependencias específicas)
```

---

## 🚀 Cómo Ejecutar

### Opción A: GitHub UI (Web)
```
1. Ir a: GitHub.com → Proyecto → Actions
2. Buscar: "Deploy via SSH (Sequential Jobs)"
3. Click: "Run workflow"
4. Elegir: rebuild_images = true o false
5. Click: "Run workflow"
6. Esperar: Ver logs en tiempo real
```

### Opción B: CLI (Recomendado)
```bash
gh workflow run deploy-ssh-sequential.yml \
  -f rebuild_images=true \
  --ref main
```

### rebuild_images Options:
- **true**: `docker build -t imagen:latest .` (lento, ~90 min)
- **false**: `docker pull imagen:latest` (rápido, ~30 min)

---

## 🔌 GitHub Secrets Requeridos

Debes tener configurados en `Settings → Secrets and variables → Actions`:

```yaml
EC2_SSH_KEY              # Tu clave privada SSH (contenido completo del .pem)
DOCKER_USERNAME          # Usuario del Docker Registry
DOCKER_PASSWORD          # (Opcional) Password del Docker Registry
AWS_ACCESS_KEY_ID        # (Opcional) Para futuras automatizaciones
AWS_SECRET_ACCESS_KEY    # (Opcional)
```

---

## 📊 Línea de Tiempo Esperada

| Tiempo | Evento |
|--------|--------|
| 0:00 | `load-config` ejecutándose |
| 0:30 | IPs cargadas, `deploy-messaging` inicia |
| 5:00 | Messaging listo, `deploy-db` inicia |
| 15:00 | DB listo, `deploy-core` inicia |
| 25:00 | CORE listo, `deploy-api-gateway` + paralelas inician |
| 50:00 | API-Gateway listo, `deploy-frontend` inicia |
| 60:00 | Frontend listo, `deploy-bastion` inicia |
| 65:00 | Bastion listo, verification final |
| **90:00** | **✅ DEPLOYMENT COMPLETO** |

*Con `rebuild_images=false`, reduce a ~30-40 minutos*

---

## ✅ Verificar Que Todo Funcionó

### En GitHub Actions
1. Ver "Verification" step al final
2. Buscar texto: `✅ DEPLOYMENT COMPLETE - ALL 10 INSTANCES DEPLOYED!`
3. Ver URLs de acceso a servicios

### En Terminal
```bash
# Ver último run
gh run list --workflow=deploy-ssh-sequential.yml --limit 1

# Ver logs de un job específico
gh run view <RUN_ID> --job=deploy-core --log

# Ver estado de todos los jobs
gh run view <RUN_ID>
```

### SSH Manual (si quieres verificar)
```bash
# Conectar a una instancia
ssh -i tu-clave.pem ec2-user@52.6.170.44

# Ver contenedores corriendo
docker ps -a

# Ver logs de un contenedor
docker logs micro-auth
```

---

## 🔒 Seguridad

| Aspecto | Implementación |
|--------|----------------|
| **IPs Dinámicas** | Lee desde `config/instance_ips.json`, no hardcodeadas |
| **SSH** | Clave privada en GitHub Secrets, nunca en el repo |
| **Host Key** | `ssh-keyscan` verifica antes de conectar |
| **Credenciales** | Variables de entorno, no visibles en logs |
| **Secrets** | Mascarados en output de workflow |

---

## 🛠️ Troubleshooting Rápido

### ❌ "SSH permission denied"
```bash
# Verifica que la clave en Secrets sea correcta
cat ~/.ssh/tu-clave.pem  # Debe ser válida

# Verifica que el security group permite SSH
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### ❌ "Docker build failed"
```bash
# Si rebuild_images=true, verifica Dockerfile existe
ls -la Dockerfile

# Si rebuild_images=false, verifica imagen en registry
docker pull tu-usuario/imagen:latest
```

### ❌ "Timeout (job stuck)"
```bash
# Los jobs tienen timeout de 30 minutos
# Si algo tarda más, SSH manual a la instancia:
ssh -i clave.pem ec2-user@IP
docker ps -a  # Ver qué está pasando
docker logs nombrecontenedor
```

### ❌ "config/instance_ips.json not found"
```bash
# Verifica que el archivo existe y tiene IPs actuales
cat config/instance_ips.json

# Si no, ejecuta el workflow update-ips.yml primero
gh workflow run update-ips.yml --ref main
```

---

## 📈 Monitorear Despliegue en Vivo

```bash
# Terminal 1: Ver logs del workflow
watch -n 5 "gh run view <RUN_ID> --log | tail -50"

# Terminal 2: Ver estado general
gh run view <RUN_ID>

# Terminal 3: (Optional) SSH a una instancia para debugging
ssh -i clave.pem ec2-user@IP
docker ps -a --format "table {{.Names}}\t{{.Status}}"
```

---

## 🎯 URLs de Servicios (Post-Despliegue)

Una vez completado, busca en el output:

```
🎨 Frontend:      http://52.72.57.10:5500
🌐 API Gateway:   http://98.86.94.92:8080
📈 Grafana:       http://54.205.158.101:3000 (admin/admin)
📊 Prometheus:    http://54.205.158.101:9090
```

*Las IPs dependerán de tu `config/instance_ips.json`*

---

## 📝 Notas Importantes

✅ **Idempotente**: Puedes ejecutar multiple veces, sin problemas
✅ **Rollback**: Si algo falla, SSH y `docker stop` + editar config
✅ **Logs**: Todo está en GitHub Actions, revisa si hay issues
✅ **Timeout**: Jobs de 30 min, suficiente para la mayoría

---

## 🚀 Próximas Ejecuciones

Puedes ejecutar el workflow cada vez que:
- Cambien las IPs de las instancias → Ejecutar `update-ips.yml` primero
- Actualices un Dockerfile → Ejecutar con `rebuild_images=true`
- Hagas cambios en código → Ejecutar con `rebuild_images=false` (más rápido)

---

**¿Preguntas?** Revisa `DEPLOY_WORKFLOW_GUIDE.md` para más detalles
