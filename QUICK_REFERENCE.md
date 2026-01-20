# 🚀 QUICK REFERENCE - Conectividad de Servicios

## 📍 Estado Actual
- **Status**: ✅ OPERACIONAL (100%)
- **Servicios**: 16/16 activos
- **Uptime**: 58+ minutos
- **Conectividad**: 93.1% (27/29 pruebas)

---

## 🌐 URLs de Acceso Rápido

### Desde tu navegador/terminal:

```bash
# API Gateway
http://localhost:8080

# Grafana (Dashboards & Alertas)
http://localhost:3000
user: admin | pass: admin

# Prometheus (Métricas)
http://localhost:9090

# RabbitMQ (Gestión de colas)
http://localhost:15672
user: guest | pass: guest

# MongoDB (Base de datos NoSQL)
mongodb://localhost:27017

# PostgreSQL (Base de datos SQL)
postgresql://localhost:5432

# Kafka (Message Broker)
tcp://localhost:9092
```

---

## 🏃 Comandos Rápidos

```bash
# Ver estado general
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs <servicio>

# Reiniciar servicios
docker compose restart

# Reiniciar un servicio específico
docker compose restart <servicio>

# Ejecutar test de conectividad
.\connectivity-test.ps1

# Acceder a un contenedor
docker exec -it <servicio> bash

# Verificar red Docker
docker network inspect proyecto-acompa-amiento-_core-net
```

---

## 📊 Servicios Activos

### API & Gateway
- ✅ **api-gateway** - puerto 8080

### Microservicios
- ✅ **micro-auth** - puerto 3000
- ✅ **micro-estudiantes** - puerto 3001
- ✅ **micro-maestros** - puerto 3002
- ✅ **micro-reportes-estudiantes** - puerto 5003
- ✅ **micro-reportes-maestros** - puerto 5004
- ✅ **micro-notificaciones** - puerto 5006
- ✅ **micro-analytics** - puerto 5007
- ✅ **micro-soap-bridge** - puerto 5008

### Infraestructura
- ✅ **kafka** - puerto 9092/9101
- ✅ **zookeeper** - puerto 2181
- ✅ **rabbitmq** - puerto 5672 (UI: 15672)
- ✅ **mongo** - puerto 27017
- ✅ **postgres** - puerto 5432
- ✅ **prometheus** - puerto 9090
- ✅ **grafana** - puerto 3000

---

## 🔄 Flujos de Comunicación

```
Cliente HTTP
    ↓
API Gateway (8080)
    ↓
├─→ micro-auth (3000) → [RabbitMQ/Kafka] → MongoDB/PostgreSQL
├─→ micro-estudiantes (3001) → [Kafka] → MongoDB
├─→ micro-maestros (3002) → [RabbitMQ] → MongoDB
├─→ micro-analytics (5007) → [Kafka] → MongoDB
└─→ [otros microservicios]

Kafka ↔ Zookeeper (coordinación)
Prometheus → Kafka (métricas)
Grafana ← Prometheus (dashboards)
```

---

## 🆘 Troubleshooting Rápido

### Si un servicio no responde:
```bash
# Ver logs del servicio
docker compose logs <servicio>

# Reiniciarlo
docker compose restart <servicio>

# Eliminar y recrear (reset total)
docker compose down
docker compose up -d
```

### Si la conectividad falla:
```bash
# Verificar red Docker
docker network ls
docker network inspect proyecto-acompa-amiento-_core-net

# Ejecutar test de conectividad
.\connectivity-test.ps1

# Ver documentación detallada
cat CONNECTIVITY_REPORT.md
```

### Si hay problemas de puerto:
```bash
# Mostrar qué procesos usan puertos
netstat -ano | findstr :8080
lsof -i :8080  # en Linux/Mac

# Cambiar puerto en docker-compose.yml
# "8080:8080" → "8081:8080"
```

---

## 📈 Métricas Clave

- **Disponibilidad**: 100%
- **Tasa de Éxito**: 93.1%
- **Latencia (interna)**: < 100ms
- **Servicios activos**: 16/16
- **Puertos expuestos**: 9

---

## 📚 Documentación Completa

Para más detalles, ver:
- `CONNECTIVITY_REPORT.md` - Reporte completo
- `CONNECTIVITY_SUMMARY.md` - Resumen ejecutivo
- `docker-compose.yml` - Configuración de servicios
- `connectivity-test.ps1` - Script de verificación

---

## ✨ Pro Tips

1. **Monitoreo continuo**: Accede a Grafana regularmente
2. **Revisar métricas**: Prometheus tiene histórico detallado
3. **Logs centralizados**: Usa `docker compose logs` para debugging
4. **Health checks**: Los servicios incluyen endpoints de salud
5. **Load testing**: RabbitMQ/Kafka pueden manejar alto volumen

---

**Última actualización**: 2026-01-20 13:02 UTC-5
**Estado**: 🟢 OPERACIONAL
