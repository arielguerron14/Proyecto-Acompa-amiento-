# ✅ Verificación de Configuración de Rutas AWS

## 1. INSTANCIAS EC2 Y SUS IPs

### 📍 Instancias Registradas
| Instancia | IP Pública | IP Privada | Región | Tipo |
|-----------|-----------|-----------|--------|------|
| EC2-Bastion | 34.235.224.202 | 172.31.72.222 | us-east-1 | t3.micro |
| EC2-CORE | 18.232.51.134 | 172.31.79.241 | us-east-1 | t3.large |
| EC2-DB | 100.28.252.104 | 172.31.67.126 | us-east-1 | t3.xlarge |
| EC2-Frontend | 44.220.126.89 | 172.31.69.107 | us-east-1 | t3.medium |
| EC2-API-Gateway | 52.7.168.4 | 172.31.70.85 | us-east-1 | t3.medium |
| EC2-Messaging | 44.192.50.144 | 172.31.67.203 | us-east-1 | t3.medium |
| EC2-Monitoring | 98.88.93.98 | 172.31.66.203 | us-east-1 | t3.medium |
| EC2-Notificaciones | 3.229.118.110 | 172.31.68.227 | us-east-1 | t3.medium |
| EC2-Reportes | 52.200.32.56 | 172.31.64.219 | us-east-1 | t3.medium |

---

## 2. RUTAS DE COMUNICACIÓN INTERNA (IP Privada)

### 🔐 Comunicación Base de Datos (EC2-DB: 172.31.67.126)

**Todos los microservicios usan esta IP privada para conectarse a BD:**

```
PostgreSQL:  172.31.67.126:5432
MongoDB:     172.31.67.126:27017
Redis:       172.31.67.126:6379
```

**Variables de entorno en .env.aws:**
```
DB_HOST=172.31.67.126
MONGO_URL=mongodb://172.31.67.126:27017/acompanamiento
POSTGRES_HOST=172.31.67.126
REDIS_HOST=172.31.67.126
```

### ✅ Estado: **CORRECTO**
- ✓ IP privada de BD coincide en todos los servicios
- ✓ Puertos correctos (5432, 27017, 6379)
- ✓ Rutas accesibles dentro de VPC AWS

---

## 3. ACCESO SSH A INSTANCIAS (IPs Públicas)

### 🔑 Rutas SSH Configuradas en .ssh/config

**Bastion (punto de entrada):**
```
Host bastion
  HostName: 34.235.224.202
  User: ec2-user
  Puerto: 22
```

**Instancias a través de Bastion (ProxyJump):**
```
Host core           → HostName: 18.232.51.134
Host db             → HostName: 100.28.252.104
Host frontend       → HostName: 44.220.126.89
Host api-gateway    → HostName: 52.7.168.4
Host messaging      → HostName: 44.192.50.144
Host monitoring     → HostName: 98.88.93.98
Host notificaciones → HostName: 3.229.118.110
Host reportes       → HostName: 52.200.32.56
```

### ✅ Estado: **CORRECTO**
- ✓ Bastion como punto de entrada único
- ✓ Todas las instancias configuradas con ProxyJump
- ✓ Claves SSH asignadas correctamente

---

## 4. WORKFLOWS DE DESPLIEGUE Y RESOLUCIÓN DINÁMICA DE IPs

### 🔄 Flujo de Despliegue

Cada workflow (`deploy-ec2-*.yml`) sigue este flujo:

```
1. Checkout del código
2. Setup Docker Buildx
3. Login a Docker Hub
4. Ejecutar update_instance_ips.py
   ↓ (Obtiene IPs actuales de AWS)
5. Obtener INSTANCE_IP con get_instance_ip.py
   ↓ (Lee config/instance_ips.json)
6. Configurar SSH keys
7. SSH a la instancia (IP pública)
8. Pull, stop, remove, run Docker container
9. Verificar logs y estado
```

### 📋 Mapeo de Servicios

**get_instance_ip.py - SERVICE_MAPPING:**
```python
'bastion': 'EC-Bastion' → 34.235.224.202
'core': 'EC2-CORE' → 18.232.51.134
'db': 'EC2-DB' → 100.28.252.104
'frontend': 'EC2-Frontend' → 44.220.126.89
'api-gateway': 'EC2-API-Gateway' → 52.7.168.4
'messaging': 'EC2-Messaging' → 44.192.50.144
'monitoring': 'EC2-Monitoring' → 98.88.93.98
'notificaciones': 'EC2-Notificaciones' → 3.229.118.110
'reportes': 'EC2-Reportes' → 52.200.32.56
```

### ✅ Estado: **CORRECTO**
- ✓ Mapeo de servicios a instancias actualizado
- ✓ IPs públicas se resuelven dinámicamente desde AWS
- ✓ Cada workflow obtiene IP correcta antes de SSH

---

## 5. SEGURIDAD - GRUPOS DE SEGURIDAD REQUERIDOS

### 🛡️ EC2-DB Security Group

**Debe permitir tráfico entrante:**
```
Protocolo | Puerto | Origen
----------|--------|--------
TCP      | 5432   | EC2-Microservicios SG
TCP      | 27017  | EC2-Microservicios SG
TCP      | 6379   | EC2-Microservicios SG
```

### 🛡️ EC2-Bastion Security Group

**Debe permitir tráfico entrante:**
```
Protocolo | Puerto | Origen
----------|--------|--------
TCP      | 22     | 0.0.0.0/0 (o tu IP)
```

### 🛡️ EC2-Microservicios Security Groups (todos menos Bastion y DB)

**Debe permitir tráfico entrante:**
```
Protocolo | Puerto | Origen
----------|--------|--------
TCP      | 22     | Bastion SG
TCP      | 8080   | 0.0.0.0/0 (API Gateway)
TCP      | 5500   | 0.0.0.0/0 (Frontend)
TCP      | 5000-5999 | EC2-Microservicios SG (comunicación inter-servicios)
```

---

## 6. VERIFICACIÓN DE CONECTIVIDAD

### ✅ Comando para Verificar SSH (desde tu máquina local):
```bash
# Test Bastion
ssh bastion

# Test instancias a través del Bastion
ssh core
ssh db
ssh frontend
ssh api-gateway
ssh messaging
ssh monitoring
ssh notificaciones
ssh reportes
```

### ✅ Comando para Verificar BD (desde cualquier microservicio EC2):
```bash
# PostgreSQL
nc -zv 172.31.67.126 5432

# MongoDB
nc -zv 172.31.67.126 27017

# Redis
nc -zv 172.31.67.126 6379
```

---

## 7. ESTADO FINAL DE CONFIGURACIÓN

| Componente | Estado | Verificación |
|-----------|--------|--------------|
| IPs Públicas (SSH) | ✅ Actualizado | Todas las IPs públicas en .ssh/config |
| IPs Privadas (BD) | ✅ Actualizado | EC2-DB 172.31.67.126 en .env.aws |
| Mapeo de Servicios | ✅ Actualizado | get_instance_ip.py con 9 instancias |
| Backup de IPs | ✅ Actualizado | config/instance_ips.json con JSON completo |
| Workflows | ✅ Dinámico | Todos usan update_instance_ips.py + get_instance_ip.py |
| Security Groups | ⚠️ Manual | Requiere verificación en AWS Console |
| Networking | ✅ Verificado | VPC default con subnet 172.31.0.0/16 |

---

## 8. PRÓXIMOS PASOS RECOMENDADOS

1. **Verificar Security Groups en AWS Console:**
   - Asegurar que EC2-DB permite conexiones desde microservicios
   - Asegurar que Bastion permite SSH desde tu IP

2. **Ejecutar Deploy Manual:**
   ```bash
   # En GitHub Actions o localmente:
   git push origin main
   # Trigger workflow: deploy-ec2-db
   # Trigger workflow: deploy-ec2-core
   ```

3. **Monitorear Logs:**
   ```bash
   ssh core
   docker logs <container_id>
   ```

4. **Actualizar Secrets en GitHub (si es necesario):**
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_SESSION_TOKEN
   - AWS_REGION

---

## 📝 Notas Importantes

- **IPs dinámicas:** Las IPs públicas pueden cambiar si las instancias se reinician. El workflow las actualiza automáticamente.
- **Backups:** config/instance_ips.json se actualiza cada vez que corre update-ips workflow.
- **Comunicación Interna:** Los microservicios SIEMPRE usan IP privada 172.31.67.126 para BD (no cambia dentro de VPC).
- **Seguridad:** Nunca hardcodees IPs en código - usa variables de entorno desde .env.aws.

