# ✅ Bastion Host - Instancia AWS Actualizada

**Fecha**: 13 Enero 2026  
**Estado**: 🚀 LISTO PARA DESPLEGAR  
**Instancia**: i-0bd13b8e83e8679bb

---

## 📋 Información de la Instancia

| Propiedad | Valor |
|-----------|-------|
| **ID de Instancia** | i-0bd13b8e83e8679bb |
| **IP Pública** | 13.217.194.108 |
| **IP Privada** | 172.31.29.204 |
| **Usuario** | ubuntu |
| **Puerto SSH** | 22 |
| **Clave SSH** | ssh-key-ec2.pem |
| **Tipo de SO** | Amazon Linux 2 / Ubuntu |

---

## 📁 Archivos Actualizados

Se han actualizado los siguientes archivos con la nueva IP **13.217.194.108**:

### 1. `infrastructure.config.js`
```javascript
BASTION_IP: '13.217.194.108'  // ← ACTUALIZADO
BASTION_USER: 'ec2-user'
BASTION_PORT: 22
```

### 2. `.ssh/config`
```
Host bastion
    HostName 13.217.194.108  # ← ACTUALIZADO
    User ec2-user
```

### 3. `.github/workflows/deploy.yml`
```yaml
EC2_BASTION)
  echo "ip=13.217.194.108" >> $GITHUB_OUTPUT  # ← ACTUALIZADO
```

### 4. Nuevos Scripts de Despliegue

- **`bastion-host/deploy-bastion.sh`** (Bash)
  - Script automático para Linux/Mac
  - Prepara EC2, transfiere archivos, despliega Docker
  - Verifica el despliegue

- **`bastion-host/Deploy-Bastion.ps1`** (PowerShell)
  - Script automático para Windows
  - Mismo funcionamiento que versión Bash
  - Compatible con Windows PowerShell

---

## 🚀 Cómo Desplegar Ahora

### Opción 1: Script Automático (Recomendado)

**Linux/Mac:**
```bash
cd bastion-host
bash deploy-bastion.sh
```

**Windows PowerShell:**
```powershell
cd bastion-host
.\Deploy-Bastion.ps1
```

### Opción 2: Manual Paso a Paso

**1. Conectar a la instancia:**
```bash
ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108
```

**2. Preparar la instancia:**
```bash
# En la instancia
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
newgrp docker
```

**3. Transferir archivos (desde tu máquina):**
```bash
scp -r -i ssh-key-ec2.pem bastion-host ubuntu@13.217.194.108:~/
```

**4. Desplegar (en la instancia):**
```bash
cd ~/bastion-host
docker build -t bastion-host:latest .
docker-compose up -d
```

**5. Verificar:**
```bash
docker-compose ps
docker logs bastion-host
```

### Opción 3: GitHub Actions Workflow

```bash
# Usar el workflow existente
gh workflow run deploy.yml -f instance=EC2_BASTION
```

---

## ✅ Post-Despliegue

### 1. Configurar SSH Keys

```bash
# Agregar tu clave pública
cat ~/.ssh/id_rsa.pub | ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108 \
  'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

### 2. Conectar como ec2-user

```bash
ssh -i ssh-key-bastion.pem ec2-user@13.217.194.108
```

### 3. Ver Logs

```bash
ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108 'docker logs bastion-host -f'
```

### 4. Verificar Health

```bash
ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108 \
  'docker-compose -f ~/bastion-host/docker-compose.yml exec bastion /opt/bastion/scripts/health-check.sh'
```

---

## 📊 Verificación Rápida

```bash
# Desde tu máquina local

# 1. Verificar conectividad
ping 13.217.194.108

# 2. Conectar SSH
ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108

# 3. Ver estado Docker
docker ps

# 4. Ver logs Bastion
docker logs bastion-host --tail=50
```

---

## 📚 Archivos Relacionados

- `bastion-host/Dockerfile` - Definición de imagen
- `bastion-host/docker-compose.yml` - Orquestación
- `bastion-host/README.md` - Documentación general
- `bastion-host/DEPLOYMENT.md` - Guía completa
- `bastion-host/QUICK_DEPLOYMENT.md` - Instrucciones rápidas
- `bastion-host/deploy-bastion.sh` - Script Linux/Mac
- `bastion-host/Deploy-Bastion.ps1` - Script Windows
- `infrastructure.config.js` - Configuración centralizada
- `.ssh/config` - Configuración SSH

---

## 🔄 Resumen de Cambios

### Archivos Modificados
1. ✅ `infrastructure.config.js` - IP actualizada a 13.217.194.108
2. ✅ `.ssh/config` - IP actualizada a 13.217.194.108
3. ✅ `.github/workflows/deploy.yml` - IP actualizada a 13.217.194.108

### Archivos Nuevos
1. ✅ `bastion-host/deploy-bastion.sh` - Script de despliegue Bash
2. ✅ `bastion-host/Deploy-Bastion.ps1` - Script de despliegue PowerShell
3. ✅ `bastion-host/QUICK_DEPLOYMENT.md` - Instrucciones rápidas
4. ✅ `BASTION_INSTANCE_UPDATED.md` - Este documento

---

## 🎯 Próximos Pasos

1. **Ejecutar script de despliegue**:
   ```bash
   cd bastion-host && bash deploy-bastion.sh
   ```

2. **Configurar SSH keys** (si no se hace automáticamente)

3. **Verificar que SSH funciona**:
   ```bash
   ssh -i ssh-key-bastion.pem ec2-user@13.217.194.108
   ```

4. **Usar para acceder a otras instancias**:
   ```bash
   ssh -J ec2-user@13.217.194.108 ubuntu@[INSTANCE_IP]
   ```

---

## 📞 Referencia Rápida

| Comando | Propósito |
|---------|----------|
| `bash deploy-bastion.sh` | Desplegar automáticamente |
| `.\Deploy-Bastion.ps1` | Desplegar (Windows) |
| `ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108` | Conectar manualmente |
| `ssh -i ssh-key-bastion.pem ec2-user@13.217.194.108` | SSH como ec2-user |
| `docker logs bastion-host -f` | Ver logs en tiempo real |
| `docker-compose ps` | Ver estado de servicios |

---

**Estado**: ✅ **LISTO PARA DESPLEGAR**

Bastion Host completamente configurado con la instancia AWS correcta.

