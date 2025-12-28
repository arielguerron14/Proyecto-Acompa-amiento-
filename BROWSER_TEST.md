# Prueba en Navegador - Proyecto Acompañamiento

## ✅ Estado del Sistema

Todos los servicios están ejecutándose correctamente:

### Servicios Principales
- **API Gateway**: http://localhost:8080
- **Frontend Web**: http://localhost:5500
- **Grafana (Monitoreo)**: http://localhost:3001
- **Prometheus (Métricas)**: http://localhost:9090

### Microservicios (Puertos internos)
- **micro-auth**: 5005
- **micro-maestros**: 5001
- **micro-estudiantes**: 5002
- **micro-reportes-estudiantes**: 5003
- **micro-reportes-maestros**: 5004
- **micro-notificaciones**: 5006
- **micro-soap-bridge**: 5008

### Bases de Datos
- **MongoDB**: 27017
- **PostgreSQL**: 5432
- **Redis**: 6379

### Servicios de Mensajería (en messaging/)
- **RabbitMQ**: 5672 (Management UI: 15672)
- **Kafka**: 9092/29092 (Kafka UI: 8081)
- **Zookeeper**: 2181

---

## 🌐 Acceso desde el Navegador

### 1. Frontend Web
```
http://localhost:5500
```
Esta es la interfaz web principal de la aplicación. Desde aquí puede acceder a:
- Funcionalidades de estudiantes
- Funcionalidades de maestros
- Reportes
- Notificaciones

### 2. API Gateway (Para pruebas de API)
```
http://localhost:8080
```
Endpoint central para todas las APIs de los microservicios.

### 3. Grafana (Monitoreo)
```
http://localhost:3001
```
Usuario por defecto: `admin`
Contraseña por defecto: `admin`

Desde aquí puede:
- Ver métricas del sistema
- Visualizar logs de servicios
- Monitorear rendimiento

### 4. Kafka UI (Gestión de Kafka)
```
http://localhost:8081
```
Herramienta visual para administrar Kafka:
- Ver tópicos
- Monitorear particiones
- Analizar mensajes

### 5. RabbitMQ Management
```
http://localhost:15672
```
Usuario: `guest`
Contraseña: `guest`

Gestión de colas y intercambios de mensajes.

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Verificar Frontend
1. Abrir http://localhost:5500 en el navegador
2. Verificar que la interfaz carga correctamente
3. Revisar la consola del navegador (F12) para errores

### Prueba 2: Verificar API Gateway
1. Abrir http://localhost:8080 en el navegador
2. Debería mostrar un mensaje de bienvenida o estado del gateway

### Prueba 3: Verificar Monitoreo
1. Acceder a Grafana: http://localhost:3001
2. Verificar que puede ver dashboards de monitoreo
3. Confirmar que está recolectando métricas

### Prueba 4: Verificar Kafka
1. Acceder a Kafka UI: http://localhost:8081
2. Verificar que puede ver el broker de Kafka
3. Revisar los tópicos creados

### Prueba 5: Verificar RabbitMQ
1. Acceder a http://localhost:15672
2. Verificar que se puede conectar con guest/guest
3. Ver colas y exchanges

---

## 📊 Estructura de Servicios Ejecutándose

```
✅ Bases de Datos
  ├─ MongoDB (27017) - Healthy
  ├─ PostgreSQL (5432) - Healthy
  └─ Redis (6379) - Healthy

✅ Servicios de Mensajería
  ├─ Zookeeper (2181) - Healthy
  ├─ Kafka (9092) - Running
  ├─ RabbitMQ (5672) - Healthy
  └─ Kafka UI (8081) - Running

✅ Microservicios
  ├─ micro-auth (5005) - Running
  ├─ micro-maestros (5001) - Running
  ├─ micro-estudiantes (5002) - Running
  ├─ micro-reportes-estudiantes (5003) - Running
  ├─ micro-reportes-maestros (5004) - Running
  ├─ micro-notificaciones (5006) - Running
  └─ micro-soap-bridge (5008) - Running

✅ Orquestación & Frontend
  ├─ API Gateway (8080) - Running
  ├─ Frontend Web (5500) - Running
  ├─ Prometheus (9090) - Running
  └─ Grafana (3001) - Running
```

---

## 🔍 Solución de Problemas

### Si el Frontend no carga
1. Verificar que frontend-web está corriendo: `docker ps | grep frontend`
2. Revisar los logs: `docker logs frontend-web`
3. Verificar que el puerto 5500 no está en uso

### Si la API Gateway no responde
1. Verificar: `docker ps | grep api-gateway`
2. Revisar logs: `docker logs api-gateway`
3. Verificar conexión a microservicios internos

### Si los microservicios fallan
1. Verificar bases de datos están sanas
2. Revisar logs del servicio específico
3. Verificar variables de entorno en `.env`

### Si Kafka no responde
Kafka puede mostrar "unhealthy" pero sigue funcionando:
```bash
# Verificar que está respondiendo
docker exec proyecto-kafka kafka-broker-api-versions.sh --bootstrap-server localhost:29092
```

---

## 🚀 Próximos Pasos

1. **Probar flujos de negocio** en el frontend
2. **Verificar integraciones** entre microservicios
3. **Revisar logs** para identificar posibles errores
4. **Monitorear performance** en Grafana
5. **Validar mensajería** entre servicios en RabbitMQ/Kafka

---

## 📝 Comandos Útiles

### Ver logs de un servicio
```bash
docker logs [nombre-del-contenedor]
```

### Ver logs en tiempo real
```bash
docker logs -f [nombre-del-contenedor]
```

### Ejecutar comando en contenedor
```bash
docker exec -it [nombre-del-contenedor] [comando]
```

### Ver estado de todo el stack
```bash
docker-compose ps
```

### Detener todos los servicios
```bash
docker-compose down
```

---

**Estado**: ✅ Sistema completamente operativo y listo para pruebas
**Última actualización**: 27/12/2025
