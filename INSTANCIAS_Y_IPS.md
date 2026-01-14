# 🎯 QUICK REFERENCE - INSTANCIAS Y IPs DESPLEGADAS

## ✅ ESTADO: LISTO PARA PRODUCCIÓN

---

## 🌐 TABLA DE INSTANCIAS

```
┌─────────────────────┬────────────────┬───────────────┬──────────────────────┐
│ Instance Name       │ Private IP     │ Public IP     │ SSH Command          │
├─────────────────────┼────────────────┼───────────────┼──────────────────────┤
│ EC-Bastion          │ 172.31.78.45   │ 34.194.48.73  │ ssh ubuntu@34.194... │
│ EC2-Frontend        │ 172.31.65.226  │ 100.50.80.35  │ ssh ubuntu@100.50... │
│ EC2-API-Gateway     │ 172.31.72.142  │ 35.168.118.171│ ssh ubuntu@35.168... │
│ EC2-CORE            │ 172.31.71.182  │ 44.223.45.55  │ ssh ubuntu@44.223... │
│ EC2-DB              │ 172.31.64.131  │ 44.221.70.143 │ ssh ubuntu@44.221... │
│ EC2-Messaging       │ 172.31.73.88   │ 3.236.252.150 │ ssh ubuntu@3.236.... │
│ EC2-Notificaciones  │ 172.31.68.132  │ 98.92.59.97   │ ssh ubuntu@98.92...  │
│ EC2-Reportes        │ 172.31.70.166  │ 54.243.216.35 │ ssh ubuntu@54.243... │
│ EC2-Monitoring      │ 172.31.65.26   │ 204.236.250.202│ ssh ubuntu@204.236..│
└─────────────────────┴────────────────┴───────────────┴──────────────────────┘
```

---

## 🔗 ACCESO RÁPIDO

### Bastion Gateway (SSH Proxy)
```bash
IP: 34.194.48.73
User: ubuntu
Key: ssh-key-ec2.pem
```

### Frontend
```
Public IP: 100.50.80.35
Private IP: 172.31.65.226
Port: 3000
SSH: ssh -i ssh-key-ec2.pem ubuntu@100.50.80.35
```

### API Gateway
```
Public IP: 35.168.118.171
Private IP: 172.31.72.142
Port: 8080
SSH: ssh -i ssh-key-ec2.pem ubuntu@35.168.118.171
```

### CORE Service
```
Public IP: 44.223.45.55
Private IP: 172.31.71.182
Port: 8081
SSH: ssh -i ssh-key-ec2.pem ubuntu@44.223.45.55
```

### Database
```
Public IP: 44.221.70.143
Private IP: 172.31.64.131
Port: 5432
SSH: ssh -i ssh-key-ec2.pem ubuntu@44.221.70.143
```

### Messaging/RabbitMQ
```
Public IP: 3.236.252.150
Private IP: 172.31.73.88
Port: 5672
SSH: ssh -i ssh-key-ec2.pem ubuntu@3.236.252.150
```

### Notifications
```
Public IP: 98.92.59.97
Private IP: 172.31.68.132
Port: 8082
SSH: ssh -i ssh-key-ec2.pem ubuntu@98.92.59.97
```

### Reports
```
Public IP: 54.243.216.35
Private IP: 172.31.70.166
Port: 8083
SSH: ssh -i ssh-key-ec2.pem ubuntu@54.243.216.35
```

### Monitoring (Prometheus)
```
Public IP: 204.236.250.202
Private IP: 172.31.65.26
Port: 9090
SSH: ssh -i ssh-key-ec2.pem ubuntu@204.236.250.202
```

---

## 🚀 ACCESOS HTTP

### Via Bastion
```bash
# Tunneling local
ssh -L 3000:172.31.65.226:3000 ubuntu@34.194.48.73
# Then open: http://localhost:3000

ssh -L 8080:172.31.72.142:8080 ubuntu@34.194.48.73
# Then open: http://localhost:8080
```

### Direct (Public IP)
```bash
# Frontend
curl http://100.50.80.35:3000

# API Gateway
curl http://35.168.118.171:8080/api/health

# CORE
curl http://44.223.45.55:8081/api/status

# Reports
curl http://54.243.216.35:8083/reports/health

# Notifications
curl http://98.92.59.97:8082/notifications/health

# Prometheus
curl http://204.236.250.202:9090/-/healthy
```

### Via Load Balancer
```bash
# ALB DNS Name
lab-alb-2074b0bbcd4d7bbc.us-east-1.elb.amazonaws.com

# Target Instances
# - EC2-Frontend (172.31.65.226:80)
# - EC2-API-Gateway (172.31.72.142:80)
# - EC2-Reportes (172.31.70.166:80)
```

---

## 📋 FORMATO JSON PARA SCRIPTS

```json
{
  "EC-Bastion": {
    "private_ip": "172.31.78.45",
    "public_ip": "34.194.48.73"
  },
  "EC2-Frontend": {
    "private_ip": "172.31.65.226",
    "public_ip": "100.50.80.35"
  },
  "EC2-API-Gateway": {
    "private_ip": "172.31.72.142",
    "public_ip": "35.168.118.171"
  },
  "EC2-CORE": {
    "private_ip": "172.31.71.182",
    "public_ip": "44.223.45.55"
  },
  "EC2-DB": {
    "private_ip": "172.31.64.131",
    "public_ip": "44.221.70.143"
  },
  "EC2-Messaging": {
    "private_ip": "172.31.73.88",
    "public_ip": "3.236.252.150"
  },
  "EC2-Notificaciones": {
    "private_ip": "172.31.68.132",
    "public_ip": "98.92.59.97"
  },
  "EC2-Reportes": {
    "private_ip": "172.31.70.166",
    "public_ip": "54.243.216.35"
  },
  "EC2-Monitoring": {
    "private_ip": "172.31.65.26",
    "public_ip": "204.236.250.202"
  }
}
```

---

## 🔐 ACCESO VIA BASTION (RECOMENDADO)

```bash
# Opción 1: SSH directo al Bastion
ssh -i ssh-key-ec2.pem ubuntu@34.194.48.73

# Opción 2: SSH proxy a través de Bastion
ssh -i ssh-key-ec2.pem -J ubuntu@34.194.48.73 ubuntu@172.31.65.226

# Opción 3: Port forwarding via Bastion
ssh -i ssh-key-ec2.pem -L 8080:172.31.72.142:8080 ubuntu@34.194.48.73
# Luego acceder: http://localhost:8080

# Opción 4: SOCKS proxy
ssh -i ssh-key-ec2.pem -D 1080 ubuntu@34.194.48.73
# Luego configurar navegador para usar SOCKS 127.0.0.1:1080
```

---

## 🐳 DOCKER COMMANDS (DENTRO DE INSTANCIAS)

```bash
# Ver contenedores ejecutándose
docker ps

# Ver todos los contenedores
docker ps -a

# Ver logs de un contenedor
docker logs <container-id>

# Seguir logs en vivo
docker logs -f <container-id>

# Reiniciar un servicio
docker restart <container-id>

# Detener/iniciar
docker stop <container-id>
docker start <container-id>
```

---

## 🎯 CHECKLIST DE CONEXIÓN

- [ ] SSH key configurada: `ssh-key-ec2.pem` con permisos 600
- [ ] Bastion IP: 34.194.48.73 es accesible
- [ ] Security Group permite puerto 22 desde tu IP
- [ ] Elastic IPs están asignadas a las instancias
- [ ] Instancias están en estado "running"
- [ ] AWS región: us-east-1

---

## 📊 RECURSOS DISPONIBLES

- **vCPU totales**: 9 × 2 vCPU = 18 vCPU
- **RAM total**: 9 × 4 GB = 36 GB
- **EBS Storage**: Por determinar (default gp3)
- **Elastic IPs**: 5 asignadas
- **ALB**: 1 activo distribuyendo tráfico

---

## ⏱️ TIEMPOS DE RESPUESTA TÍPICOS

- SSH connection: < 1 segundo
- HTTP request via ALB: < 100 ms
- API response: Depende de la aplicación
- Database query: Depende de la aplicación

---

**Generado**: 2026-01-14  
**Infraestructura**: AWS us-east-1  
**Estado**: ✅ OPERACIONAL  
**Última Actualización**: 2026-01-14T21:28:04Z
