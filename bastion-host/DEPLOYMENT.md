# Bastion Host - Guía de Despliegue

## 📋 Despliegue en AWS EC2

El Bastion Host se despliega en AWS EC2 usando GitHub Actions y se integra completamente con el workflow de CI/CD.

## 🚀 Opción 1: Despliegue Automático (GitHub Actions) ⭐ RECOMENDADO

### Paso 1: Configurar Claves SSH

1. Generar una clave SSH (si no la tienes):
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/bastion-key -N ""
```

2. Copiar la clave pública al archivo authorized_keys:
```bash
cat ~/.ssh/bastion-key.pub >> bastion-host/ssh-keys/authorized_keys
chmod 600 bastion-host/ssh-keys/authorized_keys
```

3. Agregar la clave privada como secret en GitHub:
   - Ir a: GitHub Repo → Settings → Secrets and variables → Actions
   - Crear nuevo secret: `BASTION_SSH_KEY`
   - Contenido: Clave privada (`cat ~/.ssh/bastion-key`)

### Paso 2: Ejecutar el Workflow

```bash
# Opción A: Usando GitHub CLI
gh workflow run deploy.yml -f instance=EC2_BASTION

# Opción B: Manualmente en GitHub Actions
# 1. Ir a: GitHub Repo → Actions
# 2. Seleccionar: "Deploy to EC2 (Latest Fixed)"
# 3. Click: "Run workflow"
# 4. Seleccionar: Instance = EC2_BASTION
# 5. Click: "Run workflow"
```

### Paso 3: Monitorear el Despliegue

```bash
# Ver logs en tiempo real (GitHub CLI)
gh run watch [run-id]

# O en GitHub Web UI:
# 1. Ir a: Actions
# 2. Seleccionar el workflow run
# 3. Expandir "deploy-ec2" para ver logs detallados
```

## 🛠️ Opción 2: Despliegue Local (Manual)

### Paso 1: Construir la Imagen Docker

```bash
cd bastion-host
docker build -t bastion-host:1.0 .
```

### Paso 2: Iniciar con Docker Compose

```bash
# Configurar claves SSH
mkdir -p ssh-keys
chmod 700 ssh-keys

# Copiar tu clave pública
cat ~/.ssh/id_rsa.pub >> ssh-keys/authorized_keys
chmod 600 ssh-keys/authorized_keys

# Iniciar servicios
docker-compose up -d
```

### Paso 3: Verificar

```bash
# Ver logs
docker-compose logs -f bastion

# Verificar salud
docker-compose exec bastion /opt/bastion/scripts/health-check.sh

# Conectar al Bastion
ssh -i ~/.ssh/id_rsa ec2-user@localhost -p 22
```

## 📦 Despliegue en EC2 (Manual via SSH)

Si prefieres un despliegue manual sin GitHub Actions:

### Paso 1: Conectar a la Instancia EC2

```bash
ssh -i your-key.pem ec2-user@54.172.74.210
```

### Paso 2: Clonar el Repositorio

```bash
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-/bastion-host
```

### Paso 3: Configurar y Desplegar

```bash
# Instalar Docker (si no está instalado)
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar claves SSH
mkdir -p ssh-keys
# Copiar authorized_keys manualmente o usar scp

# Dar permisos
chmod 600 ssh-keys/authorized_keys

# Construir y desplegar
sudo docker-compose up -d
```

## ✅ Verificación Post-Despliegue

### 1. Verificar que el Contenedor está Ejecutándose

```bash
docker ps | grep bastion
# Esperado: bastion-host container in "Up" status
```

### 2. Verificar Conectividad SSH

```bash
# Desde tu máquina local
ssh -i ~/.ssh/bastion-key -o ConnectTimeout=5 ec2-user@54.172.74.210 "whoami"
# Esperado: "ec2-user"
```

### 3. Verificar Health Check

```bash
docker-compose exec bastion /opt/bastion/scripts/health-check.sh
# Esperado: ✅ SSH está disponible en puerto 22
```

### 4. Verificar Logs

```bash
docker logs bastion-host
# Verificar que no haya errores
```

### 5. Verificar Auditoría

```bash
docker-compose exec bastion cat /var/log/bastion/startup.log
# Esperado: Logs de inicialización correcta
```

## 🔍 Troubleshooting

### Error: "Connection refused"
```bash
# Verificar que el contenedor está ejecutándose
docker ps | grep bastion

# Revisar logs
docker logs bastion-host

# Reiniciar contenedor
docker-compose restart bastion
```

### Error: "Permission denied (publickey)"
```bash
# Verificar que authorized_keys existe y tiene permisos
ls -la ssh-keys/authorized_keys
chmod 600 ssh-keys/authorized_keys

# Verificar que la clave pública está en el archivo
cat ssh-keys/authorized_keys

# Reconstruir imagen si es necesario
docker-compose up --build -d
```

### SSH timeout o lentitud
```bash
# Verificar recursos del contenedor
docker stats bastion-host

# Revisar logs detallados
docker logs bastion-host | tail -50

# Aumentar límites de recursos en docker-compose.yml si es necesario
```

## 📊 Monitoreo Post-Despliegue

### Verificar Estado Regular

```bash
# Revisar logs de monitoreo
docker-compose exec bastion tail -f /var/log/bastion/monitor.log

# Revisar logs de auditoría
docker-compose exec bastion tail -f /var/log/bastion/audit.log

# Ejecutar health check
docker-compose exec bastion /opt/bastion/scripts/health-check.sh
```

### Métricas

```bash
# CPU y Memoria
docker stats bastion-host

# Conexiones SSH activas
docker-compose exec bastion ss -tnp | grep :22
```

## 🔄 Actualizar el Bastion

### Actualizar Imagen Docker

```bash
# Hacer pull de cambios
git pull origin main

# Reconstruir imagen
docker-compose up --build -d bastion

# Verificar
docker-compose logs -f bastion
```

### Actualizar Configuración SSH

```bash
# Editar ssh-keys/authorized_keys
nano ssh-keys/authorized_keys

# Reconstruir imagen
docker-compose up --build -d bastion
```

## 🗑️ Limpiar

### Detener Servicios

```bash
docker-compose down
```

### Eliminar Volúmenes (CUIDADO)

```bash
docker-compose down -v
```

### Eliminar Imagen

```bash
docker rmi bastion-host:latest
```

## 📚 Archivos Importantes

| Archivo | Propósito |
|---------|----------|
| `Dockerfile` | Definición de imagen Docker |
| `docker-compose.yml` | Composición de servicios |
| `scripts/entrypoint.sh` | Script de inicialización |
| `scripts/health-check.sh` | Verificación de salud |
| `ssh-keys/authorized_keys` | Claves SSH autorizadas |
| `ssh-keys/.gitkeep` | Marca carpeta en Git |

## 🎯 Próximos Pasos

1. ✅ Configurar claves SSH en `ssh-keys/authorized_keys`
2. ✅ Ejecutar workflow desde GitHub Actions
3. ✅ Verificar conectividad SSH
4. ✅ Usar para acceder a otras instancias
5. ✅ Monitorear logs regularmente

## 📞 Referencias

- `README.md` - Documentación general del Bastion
- `../BASTION_HOST_SETUP.md` - Setup detallado
- `../BASTION_QUICK_START.md` - Guía rápida de uso
- `../deploy.yml` - GitHub Actions workflow

---

**Bastion Host - AWS Infrastructure Security** 🔐
