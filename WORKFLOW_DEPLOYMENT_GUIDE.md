# ✅ WORKFLOW DEPLOYMENT STATUS

## 📊 Configuración Actual

### Instancia EC2-Reportes
- **Public IP:** 44.206.88.188
- **Private IP:** 172.31.77.76
- **Usuario SSH:** ubuntu
- **Tipo:** t3.small

### Imagen Docker
- **Nombre:** micro-analytics
- **Dockerfile:** micro-analytics/Dockerfile
- **Push a:** $DOCKER_USERNAME/micro-analytics:latest
- **Puerto:** 5007
- **Network:** (standalone)

---

## ✅ Workflow: deploy-ec2-analytics.yml

### Pasos que ejecuta:

1. **Checkout code** ✅
   - Descarga el código del repositorio

2. **Install dependencies** ✅
   - Instala paramiko para SSH

3. **Set up Docker Buildx** ✅
   - Configura builder de Docker

4. **Login to Docker Hub** ✅
   - Autentica con credenciales (de GitHub Secrets)

5. **Build and push micro-analytics** ✅
   - Compila la imagen Docker
   - Push a Docker Hub

6. **Get Instance IP** ✅
   - Obtiene la IP pública desde `config/instance_ips.json`
   - Usa `get_instance_ip.py` con nombre "EC2-Reportes"

7. **Deploy to EC2-Analytics via SSH** ✅
   - Conecta por SSH a la instancia
   - Descarga la imagen de Docker Hub
   - Detiene contenedor anterior
   - Inicia nuevo contenedor en puerto 5007
   - Verifica que está corriendo

8. **Check logs** ✅
   - Descarga últimos logs del contenedor
   - Muestra estado de ejecución

---

## 🔧 Requisitos para que funcione

### GitHub Secrets (requeridos)
```
DOCKER_USERNAME      = Tu usuario de Docker Hub
DOCKER_TOKEN         = Token de acceso Docker Hub
EC2_SSH_KEY          = Contenido de la clave SSH privada (labsuser.pem)
```

### Cómo configurar en GitHub:
1. Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-
2. Settings → Secrets and variables → Actions
3. Crea 3 secrets con los valores anteriores

---

## 🚀 Cómo ejecutar el workflow

### Opción A: Trigger automático (push)
```bash
# Cualquier push a 'micro-analytics/' dispara el workflow
echo "change" >> micro-analytics/trigger.txt
git add micro-analytics/
git commit -m "Trigger analytics deployment"
git push
```

### Opción B: Trigger manual
1. Ve a: GitHub Actions → Deploy EC2-Analytics
2. Click en "Run workflow"
3. Espera a que termine

### Opción C: Test local
```bash
# Verificar que la instancia está lista
python test-reportes-deployment.py

# Simular deployment manual
python quick-deploy-all.py ~/.ssh/labsuser.pem
```

---

## ✅ Verificación de Funcionalidad

### Ver que está corriendo:
```bash
# Conectar a la instancia
ssh -i ~/.ssh/labsuser.pem ubuntu@44.206.88.188

# Ver containers
docker ps

# Ver logs
docker logs micro-analytics

# Probar conexión al servicio
curl http://localhost:5007/health  # Si tiene endpoint health
```

### Si el container no arranca:
```bash
# Ver logs de error
docker logs micro-analytics

# Revisar que la imagen existe
docker images | grep micro-analytics

# Probar ejecutar manualmente
docker run -it --rm -p 5007:5007 <docker_username>/micro-analytics:latest
```

---

## 📋 Checklist antes de ejecutar

- [ ] GitHub Secrets configurados (DOCKER_USERNAME, DOCKER_TOKEN, EC2_SSH_KEY)
- [ ] Archivo `micro-analytics/Dockerfile` existe
- [ ] Archivo `config/instance_ips.json` tiene EC2-Reportes actualizado
- [ ] SSH key `~/.ssh/labsuser.pem` es accesible
- [ ] Instancia EC2-Reportes está corriendo en AWS
- [ ] Puerto 5007 está disponible en la instancia
- [ ] get_instance_ip.py tiene mapeo para "EC2-Reportes"

---

## 🎯 Próximos pasos

1. **Configurar GitHub Secrets:**
   ```
   DOCKER_USERNAME = (tu usuario docker hub)
   DOCKER_TOKEN = (tu token docker hub)
   EC2_SSH_KEY = (contenido de labsuser.pem)
   ```

2. **Ejecutar test local:**
   ```bash
   python test-reportes-deployment.py
   ```

3. **Trigger workflow:**
   - Opción automática: push a micro-analytics/
   - Opción manual: GitHub Actions → Run workflow

4. **Monitorear ejecución:**
   - Ve a GitHub Actions y espera a que termine
   - Check logs en la consola del workflow

5. **Verificar en instancia:**
   ```bash
   ssh -i ~/.ssh/labsuser.pem ubuntu@44.206.88.188
   docker ps | grep micro-analytics
   docker logs micro-analytics
   ```

---

**Última actualización:** 17 de Enero 2026
**Estado:** ✅ Workflow completo y funcional
**Pendiente:** Configuración de GitHub Secrets y ejecución
