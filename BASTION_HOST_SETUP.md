# Bastion Host - Configuración y Setup

## 📋 Descripción

El **Bastion Host** (también llamado Jump Host) es una instancia EC2 que actúa como punto de acceso seguro a todas las demás instancias en la VPC. Permite:

- ✅ Acceso SSH seguro a todas las instancias
- ✅ Control centralizado de acceso
- ✅ Auditoría de conexiones
- ✅ Protección contra acceso directo a instancias privadas
- ✅ Tunnel seguro para conexiones a base de datos

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│         Internet (tu máquina)               │
└────────────────┬────────────────────────────┘
                 │ SSH :22
                 ▼
┌──────────────────────────────────────────────┐
│     Bastion Host (54.172.74.210)             │
│  - Security Group: bastion-sg                │
│  - Inbound: SSH from 0.0.0.0/0 (puerto 22)  │
│  - Outbound: SSH a todas las instancias      │
└────────┬──────────────────────────────────────┘
         │
    ┌────┴────┬─────────┬──────────┬──────────┐
    │          │         │          │          │
    ▼          ▼         ▼          ▼          ▼
EC2_CORE  EC2_FRONTEND EC2_DB  EC2_MESSAGING...
(privada) (privada)   (privada) (privada)
```

## 🔑 Credenciales

| Propiedad | Valor |
|-----------|-------|
| **IP Pública** | 54.172.74.210 |
| **Usuario** | ec2-user (Amazon Linux) o ubuntu (Ubuntu) |
| **Puerto SSH** | 22 |
| **Archivo Clave** | ssh-key-bastion.pem |
| **Security Group** | bastion-sg |

## 🚀 Acceso Directo (SSH)

### 1. Conectar al Bastion Host

```bash
ssh -i ssh-key-bastion.pem ec2-user@54.172.74.210
# o para Ubuntu:
# ssh -i ssh-key-bastion.pem ubuntu@54.172.74.210
```

### 2. Dentro del Bastion, conectar a otras instancias

```bash
# Una vez dentro del Bastion, conectar a EC2_CORE
ssh -i /home/ec2-user/.ssh/ec2-key.pem ec2-user@3.234.198.34

# o con IP privada (si el Bastion está en la misma VPC)
ssh -i /home/ec2-user/.ssh/ec2-key.pem ubuntu@172.31.66.255
```

## 🔗 SSH ProxyJump (Acceso en una línea)

Conectar a una instancia privada a través del Bastion sin entrar manualmente:

```bash
# Conectar a EC2_CORE (3.234.198.34) a través del Bastion
ssh -i ssh-key-bastion.pem \
    -J ec2-user@54.172.74.210 \
    ec2-user@3.234.198.34

# O con IP privada
ssh -i ssh-key-bastion.pem \
    -J ec2-user@54.172.74.210 \
    ubuntu@172.31.66.255
```

## 🔌 Port Forwarding (Túneles SSH)

### 1. Túnel a MongoDB (EC2_DB: 27017)

```bash
ssh -i ssh-key-bastion.pem \
    -L 27017:3.237.32.106:27017 \
    ec2-user@54.172.74.210

# Ahora acceder localmente:
mongosh localhost:27017
```

### 2. Túnel a API Gateway (EC2_API_GATEWAY: 8080)

```bash
ssh -i ssh-key-bastion.pem \
    -L 8080:3.214.212.205:8080 \
    ec2-user@54.172.74.210

# Ahora acceder localmente:
curl http://localhost:8080/health
```

### 3. Túnel a Grafana (EC2_MONITORING: 3000)

```bash
ssh -i ssh-key-bastion.pem \
    -L 3000:34.203.175.72:3000 \
    ec2-user@54.172.74.210

# Acceder en navegador: http://localhost:3000
```

## 🛡️ Security Group Configuración

### Bastion Security Group (bastion-sg)

**Inbound Rules:**
- SSH (Port 22) from 0.0.0.0/0 (permite acceso desde cualquier IP)
- O más restrictivo: SSH (Port 22) from tu IP específica

**Outbound Rules:**
- SSH (Port 22) a todas las instancias privadas
- HTTPS (Port 443) para actualizaciones del SO
- HTTP (Port 80) opcional para descargas

### Instancias Privadas Security Group

**Inbound Rules:**
- SSH (Port 22) from Bastion Security Group
- (No requiere acceso directo desde Internet)

**Outbound Rules:**
- Depende del servicio (típicamente HTTPS para actualizaciones)

## 📝 Configuración Recomendada en .env

```bash
# .env o archivo de configuración
BASTION_IP=54.172.74.210
BASTION_PORT=22
BASTION_USER=ec2-user
BASTION_KEY_PATH=./ssh-key-bastion.pem

# Para scripts de despliegue
DEPLOY_VIA_BASTION=true
```

## 🔧 Uso en Scripts de Despliegue

### Con ProxyJump automático

En `.ssh/config` (Linux/Mac):

```ssh-config
Host bastion
    HostName 54.172.74.210
    User ec2-user
    IdentityFile ~/.ssh/ssh-key-bastion.pem
    StrictHostKeyChecking no

Host ec2-core
    HostName 3.234.198.34
    User ubuntu
    ProxyJump bastion
    IdentityFile ~/.ssh/ec2-key.pem
    StrictHostKeyChecking no

Host ec2-db
    HostName 3.237.32.106
    User ubuntu
    ProxyJump bastion
    IdentityFile ~/.ssh/ec2-key.pem
    StrictHostKeyChecking no
```

Uso:
```bash
ssh ec2-core
ssh ec2-db
```

## 📊 Monitoreo y Logs

### Ver conexiones activas en el Bastion

```bash
ssh -i ssh-key-bastion.pem ec2-user@54.172.74.210 "who"
ssh -i ssh-key-bastion.pem ec2-user@54.172.74.210 "last"
```

### Ver logs de SSH

```bash
ssh -i ssh-key-bastion.pem ec2-user@54.172.74.210 "sudo tail -f /var/log/auth.log"
# o en Amazon Linux:
# sudo tail -f /var/log/secure
```

## 🚀 GitHub Actions - Despliegue a través del Bastion

En `.github/workflows/deploy.yml`:

```yaml
- name: Deploy via Bastion
  env:
    BASTION_KEY: ${{ secrets.BASTION_SSH_KEY }}
    BASTION_IP: ${{ secrets.BASTION_IP }}
    TARGET_HOST: ${{ secrets.TARGET_PRIVATE_IP }}
  run: |
    mkdir -p ~/.ssh
    echo "$BASTION_KEY" > ~/.ssh/bastion.pem
    chmod 600 ~/.ssh/bastion.pem
    
    ssh -i ~/.ssh/bastion.pem \
        -J ec2-user@${BASTION_IP} \
        ubuntu@${TARGET_HOST} \
        "cd ~/app && docker-compose up -d"
```

## ⚠️ Consideraciones de Seguridad

1. **Gestión de Claves**:
   - Guardar `ssh-key-bastion.pem` en lugar seguro
   - Nunca commitear a Git
   - Usar AWS Secrets Manager para CI/CD

2. **Auditoría**:
   - Habilitar CloudTrail para logs de acceso
   - Configurar CloudWatch Logs para SSH activity
   - Implementar sesión recording (AWS Session Manager)

3. **Actualización de SO**:
   ```bash
   ssh -i ssh-key-bastion.pem ec2-user@54.172.74.210 \
       "sudo yum update -y"
   ```

4. **Restricción de IPs**:
   - En Security Group, cambiar `0.0.0.0/0` por IP específica si es posible
   - Usar IP estática de tu oficina/casa

## 📋 Checklist de Configuración Completa

- [ ] Bastion Host creado en AWS EC2
- [ ] Security Group configurado correctamente
- [ ] ssh-key-bastion.pem descargado y guardado
- [ ] SSH key agregada a ssh-agent: `ssh-add ssh-key-bastion.pem`
- [ ] Conexión de prueba exitosa: `ssh -i ssh-key-bastion.pem ec2-user@54.172.74.210`
- [ ] ProxyJump probado a una instancia privada
- [ ] infrastructure.config.js actualizado
- [ ] .ssh/config configurado (opcional pero recomendado)
- [ ] Security Groups de instancias privadas actualizados para permitir SSH desde Bastion

## 🔗 Referencias

- [AWS Bastion Host Best Practices](https://aws.amazon.com/articles/bastion-host-on-aws/)
- [SSH ProxyJump Documentation](https://man.openbsd.org/ssh_config)
- [AWS Session Manager (alternativa más segura)](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)

---

**Estado**: ✅ Configuración agregada al proyecto
