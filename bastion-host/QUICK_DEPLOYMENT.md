# Bastion Host - Deployment Instructions
# Para desplegar la imagen Docker del Bastion en AWS EC2

## 🚀 Opción 1: Despliegue Manual (Recomendado para esta instancia)

```bash
# 1. Conectar a la instancia
ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108

# 2. Una vez conectado, ejecutar en la instancia:
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
newgrp docker

# 3. Clonar el repositorio o copiar la carpeta bastion-host
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-/bastion-host

# 4. Construir y desplegar
docker build -t bastion-host:latest .
docker-compose up -d

# 5. Verificar
docker-compose ps
docker logs bastion-host
```

## 🐙 Opción 2: Usar SCP para transferir archivos

```bash
# Desde tu máquina local
scp -r -i ssh-key-ec2.pem bastion-host ubuntu@13.217.194.108:~/

# Luego conectar y desplegar
ssh -i ssh-key-ec2.pem ubuntu@13.217.194.108

# En la instancia:
cd ~/bastion-host
sudo docker build -t bastion-host:latest .
sudo docker-compose up -d
```

## 📝 Configuración Importante

**Archivo**: `bastion-host/ssh-keys/authorized_keys`

Antes de desplegar, agregar tus claves públicas SSH:

```bash
# En la instancia (después de clonar):
cat > ~/bastion-host/ssh-keys/authorized_keys << 'EOF'
[Tu clave pública aquí - ejemplo:]
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... usuario@localhost
EOF

chmod 600 ~/bastion-host/ssh-keys/authorized_keys
```

## 🔄 Despliegue Completo (Comando único)

Si tienes acceso SSH configurado, ejecuta:

```bash
cd bastion-host
bash deploy-bastion.sh
```

O en Windows:

```powershell
cd bastion-host
.\Deploy-Bastion.ps1
```

## ✅ Verificación Post-Despliegue

```bash
# Ver logs
docker logs bastion-host

# Ver estado de servicios
docker-compose ps

# Verificar health
docker-compose exec bastion /opt/bastion/scripts/health-check.sh

# Conectar como ec2-user
ssh -i ssh-key-bastion.pem ec2-user@13.217.194.108
```

## 🌐 Instancia AWS Actual

- **ID**: i-0bd13b8e83e8679bb
- **IP Pública**: 13.217.194.108
- **IP Privada**: 172.31.29.204
- **Usuario**: ubuntu
- **Puerto**: 22

## 📚 Documentación Relacionada

- `README.md` - Descripción general
- `DEPLOYMENT.md` - Guía detallada
- `.github/workflows/deploy.yml` - Workflow de CI/CD
