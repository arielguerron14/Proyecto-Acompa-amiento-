# 🚀 BASTION HOST - QUICK START GUIDE

## ✅ Estado: COMPLETAMENTE OPERACIONAL

El Bastion Host está listo para usar. Esta es tu guía rápida.

---

## 📍 Información de Conexión

```
Bastion Host IP:   54.172.74.210
Usuario:           ec2-user
Puerto:            22
Clave:             ssh-key-bastion.pem
```

---

## 🎯 9 Instancias Accesibles

| Alias | IP Pública | Tipo |
|-------|-----------|------|
| `core` | 3.234.198.34 | EC2_CORE |
| `db` | 3.237.32.106 | EC2_DB |
| `frontend` | 54.85.92.175 | EC2_FRONTEND |
| `api-gateway` | 3.214.212.205 | EC2_API_GATEWAY |
| `messaging` | 34.207.206.13 | EC2_MESSAGING |
| `monitoring` | 34.203.175.72 | EC2_MONITORING |
| `notificaciones` | 35.175.200.15 | EC2_NOTIFICACIONES |
| `reportes` | 3.94.74.223 | EC2_REPORTES |

---

## 💻 Cómo Conectar

### Opción 1: Usar Scripts (Recomendado)

#### Linux/Mac
```bash
# Conectar a una instancia
./bastion-connect.sh connect core

# Listar todas las instancias
./bastion-connect.sh list

# Crear tunnel a MongoDB
./bastion-connect.sh tunnel mongodb

# Ejecutar comando remoto
./bastion-connect.sh exec core "docker ps"
```

#### Windows
```powershell
# Conectar a una instancia
.\bastion-connect.ps1 -Command connect -Target core

# Listar instancias
.\bastion-connect.ps1 -Command list

# Crear tunnel
.\bastion-connect.ps1 -Command tunnel -Target api-gateway
```

### Opción 2: SSH Directo (Con .ssh/config)

```bash
# Conectar automáticamente a través del Bastion
ssh core
ssh db
ssh api-gateway

# Directo al Bastion
ssh bastion
```

### Opción 3: SSH Manual

```bash
# Conectar a través del Bastion manualmente
ssh -i ssh-key-bastion.pem -o ProxyCommand="ssh -i ssh-key-bastion.pem -W %h:%p ec2-user@54.172.74.210" ubuntu@3.234.198.34
```

---

## 🌐 Servicios Internos (Tunnels)

Acceder a servicios internos desde tu máquina local:

```bash
# MongoDB (puerto 27017)
./bastion-connect.sh tunnel mongodb
# Luego: mongosh localhost:27017

# API Gateway Dashboard
./bastion-connect.sh tunnel api-gateway
# http://localhost:8080

# Grafana (puerto 3000)
./bastion-connect.sh tunnel grafana
# http://localhost:3000

# Prometheus (puerto 9090)
./bastion-connect.sh tunnel prometheus
# http://localhost:9090

# RabbitMQ Management (puerto 15672)
./bastion-connect.sh tunnel rabbitmq
# http://localhost:15672
```

---

## 📊 Comandos Disponibles

```bash
# connect [instance]    - Conectar SSH a una instancia
./bastion-connect.sh connect core

# list                  - Listar todas las instancias
./bastion-connect.sh list

# tunnel [service]      - Crear tunnel SSH
./bastion-connect.sh tunnel mongodb

# status                - Verificar que Bastion está accesible
./bastion-connect.sh status

# exec [instance] [cmd] - Ejecutar comando remoto
./bastion-connect.sh exec core "docker ps -a"
```

---

## 🔍 Verificar Conectividad

```bash
# Verificar que Bastion es accesible
./bastion-connect.sh status

# Conectar e inmediatamente desconectar (test)
./bastion-connect.sh exec bastion "whoami"
```

---

## 🛠️ Troubleshooting

### "Connection timed out"
- Verifica que tengas `ssh-key-bastion.pem` en el directorio actual
- Verifica que 54.172.74.210 sea accesible desde tu red

### "Permission denied (publickey)"
- Verifica que la clave ssh-key-bastion.pem tenga permisos correctos:
  ```bash
  chmod 600 ssh-key-bastion.pem
  ```

### "Host not found"
- Verifica que la instancia esté en la lista:
  ```bash
  ./bastion-connect.sh list
  ```

---

## 📁 Archivos Relacionados

- `infrastructure.config.js` - Configuración centralizada
- `bastion-connect.sh` - Script para Linux/Mac
- `bastion-connect.ps1` - Script para Windows
- `.ssh/config` - Configuración SSH automática
- `BASTION_HOST_SETUP.md` - Documentación completa
- `BASTION_VALIDATION.md` - Detalles técnicos
- `BASTION_FINAL_VERIFICATION.md` - Verificación final

---

## ✅ Checklist Rápido

- [x] Bastion Host creado: 54.172.74.210
- [x] 9 instancias registradas
- [x] Scripts funcionales (Bash y PowerShell)
- [x] SSH config preconfigurado
- [x] Documentación completa
- [x] Todo en Git

---

## 📞 Soporte

Para información más detallada, consulta:
- `BASTION_HOST_SETUP.md` - Setup completo
- `BASTION_VALIDATION.md` - Validación y detalles técnicos

---

**¡Bastion Host listo para usar! 🚀**
