# ════════════════════════════════════════════════════════════════
# DESPLIEGUE BASTION HOST - INSTANCIA EC2 (3.87.155.74)
# ════════════════════════════════════════════════════════════════

## INFORMACIÓN DE INSTANCIA
- ID: i-0bd13b8e83e8679bb
- Tipo: t3.small
- Región: us-east-1b
- IP Pública: 3.87.155.74
- DNS: ec2-3-87-155-74.compute-1.amazonaws.com
- Key Pair: key-acompanamiento
- Usuario: ec2-user
- Security Group: SG-ACOMPANAMIENTO-ALL

## ESTADO DEL DESPLIEGUE
✅ Código preparado en GitHub (main branch)
✅ Dockerfile optimizado con ubuntu:24.04 + OpenSSH 9.6p1
⏳ Instancia EC2 inicializando
⏳ Aguardando SSH acceso

## OPCIÓN 1: DESPLIEGUE AUTOMÁTICO (Recomendado)

### Si tienes SSH acceso a la instancia:

#### Paso 1: Conectar
```bash
ssh -i key-acompanamiento.pem ec2-user@3.87.155.74
```

#### Paso 2: Ejecutar script de despliegue (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/deploy-ec2-bastion.sh | bash
```

#### O en PowerShell (si tiene pwsh instalado):
```powershell
$script = (New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/deploy-ec2-bastion.ps1')
Invoke-Expression $script
```

---

## OPCIÓN 2: DESPLIEGUE MANUAL (Paso a Paso)

### 1. Conectar a instancia
```bash
ssh -i key-acompanamiento.pem ec2-user@3.87.155.74
```

### 2. Instalar Docker
```bash
# Actualizar
sudo yum update -y

# Instalar Docker
sudo yum install docker git -y

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario al grupo docker
sudo usermod -aG docker ec2-user

# Aplicar cambios de grupo
newgrp docker
```

### 3. Instalar Docker Compose
```bash
# Descargar Docker Compose v2.24.0
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

# Hacer ejecutable
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker-compose --version
```

### 4. Clonar Repositorio
```bash
# Si es la primera vez
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git

# Actualizar a última versión
cd Proyecto-Acompa-amiento-
git pull
cd bastion-host
```

### 5. Desplegar Bastion Host
```bash
cd ~/Proyecto-Acompa-amiento-/bastion-host

# Limpiar despliegues previos
docker-compose down -v 2>/dev/null || true

# Desplegar
docker-compose up -d

# Esperar a que inicie
sleep 3

# Ver estado
docker ps | grep bastion-host
```

### 6. Verificar Despliegue
```bash
# Ver logs completos
docker logs bastion-host

# Expected output (al final):
# [BASTION] Validando configuración SSH...
# [BASTION] ✅ Configuración SSH válida
# [BASTION] YYYY-MM-DD HH:MM:SS - Bastion Host iniciado

# Ver puerto mapeado
docker port bastion-host

# Expected:
# 0.0.0.0:2222->22/tcp
```

---

## OPCIÓN 3: DESDE CLIENTE LOCAL (PowerShell en Windows)

Si tienes PowerShell y SSH configurado localmente:

```powershell
# 1. Desde máquina local, conectar y ejecutar despliegue
ssh -i key-acompanamiento.pem ec2-user@3.87.155.74 `
  'bash -c "$(curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/deploy-ec2-bastion.sh)"'
```

---

## PRUEBA DE CONEXIÓN SSH

Una vez desplegado, probar desde cliente local:

### Desde PowerShell Windows:
```powershell
ssh -p 2222 -i bastion-key.pem root@3.87.155.74
# Debería mostrar: root@[container-id]:/# 
```

### Desde Bash/Linux/Mac:
```bash
ssh -p 2222 -i bastion-key.pem root@3.87.155.74
```

---

## TROUBLESHOOTING

### ¿El contenedor no inicia?
```bash
# Ver logs detallados
docker logs bastion-host

# Si hay error, reconstruir sin cache
docker-compose build --no-cache
docker-compose up -d

# Ver logs de nuevo
docker logs bastion-host
```

### ¿SSH no conecta al puerto 2222?
```bash
# Verificar puerto está expuesto
docker port bastion-host
# Debe mostrar: 0.0.0.0:2222->22/tcp

# Probar con verbose
ssh -v -p 2222 -i bastion-key.pem root@3.87.155.74

# Verificar security group en AWS
# Debe permitir: Inbound TCP 2222 from 0.0.0.0/0
```

### ¿Error de permisos con docker?
```bash
# Si aún no está en grupo docker
sudo usermod -aG docker ec2-user

# Reiniciar sesión SSH
exit
# Reconectar
ssh -i key-acompanamiento.pem ec2-user@3.87.155.74
```

---

## CONFIGURACIÓN BASTION HOST

- **Base Image**: ubuntu:24.04 (LTS)
- **OpenSSH**: 1:9.6p1-3ubuntu13.14
- **Puerto Externo**: 2222
- **Puerto Interno**: 22
- **Autenticación**: Public Key (RSA-4096)
- **Usuario**: root
- **PermitRootLogin**: yes
- **PasswordAuthentication**: no
- **PubkeyAuthentication**: yes

---

## INFORMACIÓN GIT

Commits relacionados:
- `917853e` - Add SSHD error logging to entrypoint
- `ae806b1` - Fix entrypoint: separate SSH audit config from runtime
- `7169e8b` - Upgrade to ubuntu:24.04 with modern OpenSSH
- `f27fc58` - Remove unavailable awscli package  
- `bedd27c` - Remove conflicting PermitRootLogin setting

Branch: main
Repositorio: https://github.com/arielguerron14/Proyecto-Acompa-amiento-

---

## PRÓXIMOS PASOS

1. ✅ Tener SSH acceso a instancia (key-acompanamiento.pem)
2. 🔄 Ejecutar uno de los scripts de despliegue
3. ✅ Verificar que `docker logs bastion-host` muestre "Configuración SSH válida"
4. ✅ Probar conexión SSH al puerto 2222
5. ✅ Usar bastion-host para acceder a otros servicios internos

---

## SOPORTE

Si hay problemas:

1. Compartir output de: `docker logs bastion-host`
2. Verificar: `docker ps -a`
3. Revisar Security Group en AWS Console
4. Confirmar key pair (key-acompanamiento.pem) es la correcta

---

**Estado**: Código listo ✅ | Instancia inicializando 🔄 | Aguardando despliegue ⏳
