# Bastion Host - Jump Host para AWS

Sistema de acceso seguro y centralizado a instancias EC2 privadas.

## 📋 Descripción

El Bastion Host (Jump Host) es un servidor SSH especializado que actúa como punto de entrada único para acceder a todas las instancias EC2 privadas del proyecto. Implementa:

- ✅ SSH seguro con autenticación por clave
- ✅ Auditoría completa de conexiones
- ✅ Monitoreo de salud y métricas
- ✅ Health checks automáticos
- ✅ Configuración de seguridad hardened
- ✅ Logging detallado de acciones

## 🏗️ Estructura del Proyecto

```
bastion-host/
├── Dockerfile              # Imagen Docker del Bastion
├── docker-compose.yml      # Composición de servicios
├── .dockerignore          # Archivos a ignorar en build
├── scripts/               # Scripts de configuración
│   ├── entrypoint.sh      # Script de inicio
│   ├── health-check.sh    # Verificación de salud
│   ├── bastion-monitor.sh # Monitoreo de métricas
│   └── audit-log.sh       # Auditoría de conexiones
├── ssh-keys/              # Claves SSH (no commitar)
│   └── authorized_keys    # Claves públicas autorizadas
└── README.md             # Este archivo
```

## 🚀 Construcción y Despliegue

### Opción 1: Construcción Local

```bash
cd bastion-host
docker build -t bastion-host:latest .
docker-compose up -d
```

### Opción 2: Usando GitHub Actions Workflow

El Bastion se despliega automáticamente en AWS EC2 con el workflow:

```bash
gh workflow run deploy.yml -f instance=EC2_BASTION
```

## 🔐 Configuración de Seguridad

### Características de Seguridad

1. **Autenticación por Clave SSH**
   - Solo acepte autenticación por clave pública
   - No se permite autenticación por contraseña
   - Máximo 3 intentos de autenticación

2. **Hardening SSH**
   ```
   - PermitRootLogin: prohibit-password
   - PubkeyAuthentication: yes
   - PasswordAuthentication: no
   - X11Forwarding: no
   - MaxSessions: 10
   ```

3. **Auditoría**
   - Todas las conexiones se registran en `/var/log/bastion/`
   - Logs estructurados con timestamp
   - Integridad de logs verificable

4. **Límites de Recursos**
   - CPU: 1 core máximo
   - Memoria: 1GB máximo
   - Reserva mínima: 0.5 CPU, 512MB RAM

## 📝 Configuración

### Variables de Ambiente

```bash
TZ=UTC                    # Timezone
BASTION_PORT=22          # Puerto SSH (por defecto)
LOG_LEVEL=INFO           # Nivel de logging
```

### Authorized Keys

Colocar las claves públicas en `ssh-keys/authorized_keys`:

```bash
# Copiar clave pública al archivo
cat ~/.ssh/id_rsa.pub >> ssh-keys/authorized_keys

# Configurar permisos
chmod 600 ssh-keys/authorized_keys
```

## 🌐 Acceso al Bastion

### Desde Máquina Local

```bash
# Conectar al Bastion
ssh -i ~/.ssh/bastion-key.pem ec2-user@54.172.74.210

# O usando el script
./bastion-connect.sh connect bastion
```

### Acceder a Instancias a Través del Bastion

```bash
# ProxyJump (recomendado)
ssh -J ec2-user@54.172.74.210 ubuntu@3.234.198.34

# O usando el script
./bastion-connect.sh connect core
```

## 📊 Monitoreo

### Health Check

```bash
# Verificar estado del Bastion
docker-compose exec bastion /opt/bastion/scripts/health-check.sh

# Ver logs en tiempo real
docker-compose logs -f bastion
```

### Métricas

```bash
# Ejecutar monitoreo
docker-compose exec bastion /opt/bastion/scripts/bastion-monitor.sh

# Ver logs de monitoreo
docker-compose exec bastion tail -f /var/log/bastion/monitor.log
```

### Auditoría

```bash
# Ver eventos de auditoría
docker-compose exec bastion /opt/bastion/scripts/audit-log.sh

# Ver logs de auditoría
docker-compose exec bastion tail -f /var/log/bastion/audit.log
```

## 🔍 Troubleshooting

### SSH: Connection refused
```bash
# Verificar que el contenedor está corriendo
docker ps | grep bastion

# Revisar logs
docker logs bastion-host
```

### Permission denied (publickey)
```bash
# Verificar que la clave SSH está en lugar correcto
ls -la ssh-keys/authorized_keys

# Verificar permisos
chmod 600 ssh-keys/authorized_keys
```

### Bastion no responde a health check
```bash
# Revisar logs del contenedor
docker-compose logs bastion

# Reiniciar el contenedor
docker-compose restart bastion
```

## 📋 Puertos Expuestos

| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 22 | SSH | Acceso SSH (host → contenedor) |

## 📦 Volúmenes

| Volumen | Tipo | Propósito |
|---------|------|----------|
| bastion-logs | Local | Logs de auditoría y monitoreo |
| bastion-auth | Local | Logs de autenticación |
| bastion-ssh-config | Local | Configuración SSH persistente |
| ./ssh-keys | Host | Claves SSH autorizadas (RO) |

## 🔄 Limpieza

```bash
# Detener servicios
docker-compose down

# Eliminar volúmenes (CUIDADO)
docker-compose down -v

# Eliminar imagen
docker rmi bastion-host:latest
```

## 📚 Archivos Relacionados

- `../deploy.yml` - GitHub Actions workflow
- `../infrastructure.config.js` - Configuración de infraestructura
- `../BASTION_HOST_SETUP.md` - Documentación completa
- `../bastion-connect.sh` - Script de conexión (Linux/Mac)
- `../bastion-connect.ps1` - Script de conexión (Windows)

## 🎯 Próximos Pasos

1. Configurar `ssh-keys/authorized_keys` con tus claves
2. Construir la imagen: `docker build -t bastion-host:latest .`
3. Iniciar servicios: `docker-compose up -d`
4. Verificar salud: `docker-compose healthcheck`
5. Usar para conectar a otras instancias

## 📞 Soporte

Para más información, consulta:
- `../BASTION_HOST_SETUP.md` - Setup y configuración
- `../BASTION_VALIDATION.md` - Validación técnica
- `../BASTION_QUICK_START.md` - Guía rápida

---

**Bastion Host - AWS Infrastructure Security Layer** 🔐
