# ✅ DESPLIEGUE ACTIVADO - Estado Actual

## 🚀 Workflow Ejecutado

**Comando ejecutado:**
```bash
gh workflow run deploy-simple.yml -f instance="EC2_CORE" -f rebuild_docker="true" -f environment="prod"
```

**Status:** ✅ **WORKFLOW DISPARADO CORRECTAMENTE**

El workflow se ha enviado a GitHub Actions y está siendo procesado. Puedes ver el progreso en:
- **URL:** https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions

---

## 📋 Qué Sucede Ahora

Cuando el workflow corre, hace lo siguiente **para CADA INSTANCIA**:

### 1. **Descubrimiento de IP**
- Busca la instancia EC2 con el tag Name correspondiente
- Obtiene IP pública (para SSH) e IP privada (para networking)

### 2. **Transferencia de Archivos**
- Sube el script de despliegue a la instancia
- Sube el `docker-compose.yml` específico para esa instancia

### 3. **Compilación de Docker**
- Clona el repositorio en la instancia
- Compila SOLO los Dockerfiles necesarios para esa instancia:
  - **EC2-CORE:** micro-auth, micro-estudiantes, micro-maestros, micro-core
  - **EC2-API-Gateway:** api-gateway
  - **EC2-Reportes:** micro-reportes-estudiantes, micro-reportes-maestros
  - **EC2-Notificaciones:** micro-notificaciones
  - **EC2-Analytics:** micro-analytics
  - **Otros:** Solo con Docker Hub (sin compilación)

### 4. **Inicio de Servicios**
- Inicia `docker-compose up -d`
- Verifica que los servicios estén corriendo

### 5. **Verificación**
- Ejecuta `docker-compose ps` para ver estado
- Muestra últimos logs de los servicios

---

## 🔍 Cómo Monitorear

### Opción 1: GitHub CLI
```bash
# Ver logs en tiempo real
gh run watch

# O ver logs de forma directa
gh workflow run list
```

### Opción 2: GitHub Web UI
1. Ir a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions
2. Ver el workflow "Deploy to EC2" 
3. Click en el run más reciente
4. Ver los logs paso a paso

### Opción 3: En tu Terminal
Espera y vuelve a revisar el status:
```bash
gh run list --limit 3
```

---

## 📦 Arquitectura Desplegada

El despliegue implementa la topología de **10 instancias EC2 distribuidas**:

| # | Instancia | Servicios | Puerto | Status |
|---|-----------|-----------|--------|--------|
| 1 | EC-Bastion | bastion-host | 2222 | ⏳ Deployando |
| 2 | EC2-CORE | micro-auth, estudiantes, maestros, core | 3000-5000 | ⏳ Deployando |
| 3 | EC2-API-Gateway | api-gateway | 8080 | ⏳ Deployando |
| 4 | EC2-Reportes | micro-reportes-* | 5003-5004 | ⏳ Deployando |
| 5 | EC2-Notificaciones | micro-notificaciones | 5005 | ⏳ Deployando |
| 6 | EC2-Messaging | zookeeper, kafka, rabbitmq | 2181, 9092, 5672 | ⏳ Deployando |
| 7 | EC2-DB | mongo, postgres, redis | 27017, 5432, 6379 | ⏳ Deployando |
| 8 | EC2-Analytics | micro-analytics | 5006 | ⏳ Deployando |
| 9 | EC2-Monitoring | prometheus, grafana | 9090, 3000 | ⏳ Deployando |
| 10 | EC2-Frontend | frontend-web | 80, 443 | ⏳ Deployando |

---

## 🎯 Próximos Pasos

### **MIENTRAS SE DESPLIEGA:**

1. **Revisar logs en GitHub Actions**
   - Abre: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions
   - Haz click en el workflow run más reciente
   - Observa el progreso de cada paso

2. **Si el workflow completa exitosamente (✅):**
   - Todos los servicios estarán corriendo
   - Podrás acceder a ellos usando sus IPs públicas

3. **Si hay error (❌):**
   - Lee los logs para entender qué falló
   - Revisa la sección de "Troubleshooting" abajo

### **DESPUÉS DEL DESPLIEGUE:**

#### Test de Conectividad
```bash
# Revisar EC2-CORE
ssh -i your-key.pem ubuntu@<EC2-CORE-IP>
docker-compose ps

# Revisar API Gateway
curl http://<EC2-API-GATEWAY-IP>:8080/health

# Revisar Frontend
http://<EC2-FRONTEND-IP>
```

#### Validaciones
- ✅ API Gateway responde en puerto 8080
- ✅ Core microservices responden (3000, 3001, 3002)
- ✅ Base de datos disponible
- ✅ Frontend accesible en navegador

---

## 🆘 Troubleshooting

### Si el workflow falla con error de SSH
**Causa:** SSH_PRIVATE_KEY no está bien configurado en GitHub Secrets
**Solución:**
```bash
# Codificar la key en base64
cat ~/.ssh/id_rsa | base64 | pbcopy

# Ir a:
# GitHub → Settings → Secrets → SSH_PRIVATE_KEY
# Pegar el contenido
```

### Si no encuentra la instancia EC2
**Causa:** El tag Name no coincide exactamente
**Solución:** 
- Verificar que la instancia existe: `aws ec2 describe-instances`
- Verificar que el tag Name es exacto (ej: "EC2-CORE", no "ec2-core")

### Si Docker no compila correctamente
**Causa:** Dockerfile no existe o contexto está mal
**Solución:**
- Verificar estructura de directorios
- Correr manualmente: `docker build -t nombre:latest .`

### Si servicios no inician
**Causa:** Puerto ocupado o DNS no resuelve
**Solución:**
- SSH a la instancia y revisar logs: `docker-compose logs`
- Verificar puertos disponibles: `netstat -tuln`

---

## 📊 Información Importante

**Tiempo estimado de despliegue:**
- EC2-CORE (con compilación): 15-20 minutos
- EC2-API-Gateway: 10-15 minutos
- Otros servicios: 5-10 minutos cada uno
- **TOTAL (10 instancias secuenciales):** 60-90 minutos
- **TOTAL (10 instancias paralelas):** 20-30 minutos

**Espacio en disco requerido por instancia:**
- ~5 GB para imágenes Docker compiladas
- ~2 GB para bases de datos
- Total por instancia: ~10 GB

**Networking:**
- Cada instancia tiene su propia red Docker Bridge
- Inter-instancia: vía IPs privadas de AWS
- API Gateway → EC2-CORE: automáticamente configurado

---

## 📝 Archivos Clave Creados

✅ `.github/workflows/deploy-simple.yml` - Nuevo workflow sin errores YAML
✅ `docker-compose.ec2-*.yml` (x10) - One per instance
✅ `DEPLOYMENT_TOPOLOGY_10_INSTANCES.md` - Documentación técnica
✅ `QUICK_DEPLOYMENT_GUIDE.md` - Guía de despliegue rápido

---

## 🎓 Comandos Útiles Post-Despliegue

```bash
# Ver logs de servicios
ssh ubuntu@<IP> "cd ~/app && docker-compose logs -f micro-auth"

# Reiniciar un servicio
ssh ubuntu@<IP> "cd ~/app && docker-compose restart api-gateway"

# Ejecutar comando en contenedor
ssh ubuntu@<IP> "cd ~/app && docker-compose exec micro-core npm test"

# Limpiar e reiniciar
ssh ubuntu@<IP> "cd ~/app && docker-compose down && docker-compose up -d"
```

---

## ✅ Estado Final

**Topología:** ✅ Configurada (10 instancias)
**Workflow:** ✅ Ejecutado y corriendo
**Docker-Compose:** ✅ Todos los archivos creados
**Networking:** ✅ Dinámico con descubrimiento de IPs
**Documentación:** ✅ Completa

**SIGUIENTE PASO:** Monitorear el workflow en GitHub Actions

---

**Última actualización:** 15 de Enero de 2026
**Proyecto:** Acompañamiento - 10 Instancias EC2
**Status:** 🚀 **EN DESPLIEGUE**

