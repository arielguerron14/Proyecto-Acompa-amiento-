# Despliegue Manual de Bastion Host - EC2 (3.87.155.74)

## Instancia: i-0bd13b8e83e8679bb (t3.small, us-east-1b)
- **IP Pública**: 3.87.155.74
- **Key Pair**: key-acompanamiento
- **Usuario**: ec2-user
- **Estado**: Inicializando

## Requisitos
- Clave privada: `key-acompanamiento.pem`
- SSH acceso a la instancia

## Pasos de Despliegue

### 1. Conectar a la instancia
```bash
ssh -i key-acompanamiento.pem ec2-user@3.87.155.74
```

### 2. Instalar Docker y Docker Compose
```bash
# Actualizar sistema
sudo yum update -y

# Instalar Docker
sudo yum install docker -y

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario a docker group
sudo usermod -aG docker ec2-user
newgrp docker
```

### 3. Clonar repositorio
```bash
cd ~
git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
cd Proyecto-Acompa-amiento-/bastion-host
```

### 4. Desplegar Bastion Host
```bash
docker-compose down -v 2>/dev/null || true
docker-compose up -d

# Verificar que está corriendo
sleep 3
docker ps | grep bastion-host

# Ver logs
docker logs bastion-host | tail -20
```

### 5. Probar SSH al Bastion
```bash
# Desde otra terminal local
ssh -p 2222 -i bastion-key.pem root@3.87.155.74

# Debería mostrar prompt del root en el contenedor
```

## Troubleshooting

### Si el contenedor no inicia
```bash
# Ver logs completos
docker logs bastion-host

# Reintentar build sin cache
docker-compose build --no-cache
docker-compose up -d
```

### Si SSH no conecta
```bash
# Verificar puerto está expuesto
docker port bastion-host

# Esperado: 0.0.0.0:2222->22/tcp

# Probar conexión
ssh -v -p 2222 -i bastion-key.pem root@3.87.155.74
```

## Configuración Bastion
- **Base Image**: ubuntu:24.04
- **OpenSSH**: 9.6p1 (compatible con clientes modernos)
- **Puerto Externo**: 2222
- **Puerto Interno**: 22
- **Autenticación**: RSA Public Key
- **Usuario**: root
- **PermitRootLogin**: yes

## Git Commits Relacionados
- `917853e` - Add SSHD error logging to entrypoint
- `ae806b1` - Fix entrypoint: separate SSH audit config from runtime script
- `7169e8b` - Upgrade to ubuntu:24.04 with modern OpenSSH
- `f27fc58` - Remove unavailable awscli package
- `bedd27c` - Remove conflicting PermitRootLogin setting

## Status
- ✅ Código preparado en GitHub (branch: main)
- ⏳ Aguardando despliegue manual en nueva instancia
