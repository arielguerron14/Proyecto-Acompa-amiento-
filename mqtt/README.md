# MQTT Broker Configuration

## Overview

Configuración centralizada para **Eclipse Mosquitto**, el broker MQTT que maneja:
- **Telemetría en tiempo real** desde microservicios
- **Eventos de dominio** asíncronos
- **Alertas del sistema** de monitoreo
- **Notificaciones** a usuarios
- **Métricas** para Prometheus

## Estructura de Carpeta

```
mqtt/
├── mosquitto.conf          # Configuración principal de Mosquitto
├── acl.acl                 # Control de acceso por usuario/tópico
├── passwords.txt           # Hashes de contraseñas de usuarios (gitignored)
├── docker-compose.yml      # Orquestación del servicio
├── TOPICS.md               # Documentación de tópicos
└── README.md               # Este archivo
```

## Inicio Rápido

### 1. Copiar configuración
```bash
# El archivo passwords.txt debe generarse por seguridad
cp passwords.txt.example passwords.txt
```

### 2. Generar contraseñas (si no existen)
```bash
# Instalar mosquitto-users si no está disponible
brew install mosquitto  # macOS
apt-get install mosquitto-clients  # Linux

# Crear usuario admin
mosquitto_passwd -c mqtt/passwords.txt admin
# Crear usuario para cada microservicio
mosquitto_passwd mqtt/passwords.txt micro_analytics
mosquitto_passwd mqtt/passwords.txt micro_notificaciones
mosquitto_passwd mqtt/passwords.txt monitoring
```

### 3. Iniciar con Docker
```bash
# Opción 1: Con docker-compose
docker-compose up -d

# Opción 2: Desde raíz del proyecto
docker-compose -f mqtt/docker-compose.yml up -d
```

### 4. Verificar que está corriendo
```bash
# Verificar logs
docker logs mqtt

# Conectar como cliente de prueba
docker exec mqtt mosquitto_sub -h localhost -u admin -P admin_password -t "test"

# En otra terminal, publicar mensaje
docker exec mqtt mosquitto_pub -h localhost -u admin -P admin_password -t "test" -m "Hello MQTT"
```

## Configuración

### mosquitto.conf
Define el comportamiento del broker:
- **Listeners:** Puerto 1883 (MQTT) y 9001 (WebSocket)
- **Autenticación:** Habilitada, requiere usuario/contraseña
- **Persistencia:** Habilitada, datos guardados en `/mqtt/data/`
- **Logging:** Escrito en `/mqtt/logs/mosquitto.log`

### acl.acl
Define permisos por usuario:
- **Tópicos de lectura:** Qué puede consumir cada usuario
- **Tópicos de escritura:** Qué puede publicar cada usuario
- **Patrones:** Soporta wildcards (`+` para nivel, `#` para multi-nivel)

**Ejemplo:**
```
user micro_analytics
topic write metrics/#      # Puede escribir en metrics/...
topic write telemetry/#    # Puede escribir en telemetry/...
topic read commands/analytics/#  # Puede leer comandos
```

## Tópicos Principales

Consulta [TOPICS.md](TOPICS.md) para documentación completa.

### Ejemplos Comunes

| Tópico | Uso | Publisher | Subscriber |
|--------|-----|-----------|-----------|
| `metrics/system/cpu` | CPU del host | Sistema | Prometheus, Dashboard |
| `telemetry/analytics/user_events` | Eventos de usuario | Analytics | Reporting, BI |
| `events/orders/created` | Orden creada | Core | Notifications, Inventory |
| `alerts/critical/#` | Alertas críticas | Monitoring | Dashboard, Ops |
| `commands/api/generate_report` | Comando asíncrono | API | Reporting |

## Usuarios y Credenciales

Usuarios configurados en `acl.acl`:

| Usuario | Contraseña | Permisos |
|---------|-----------|----------|
| `admin` | (admin_password) | Acceso total |
| `micro_analytics` | (app_password) | Leer eventos, escribir métricas |
| `micro_notificaciones` | (app_password) | Leer alertas, escribir notificaciones |
| `monitoring` | (monitor_password) | Leer-only de métricas |
| `micro_reportes` | (app_password) | Leer métricas, escribir reportes |

**⚠️ Cambiar contraseñas en producción:**
```bash
mosquitto_passwd mqtt/passwords.txt admin
mosquitto_passwd mqtt/passwords.txt micro_analytics
# etc.
```

## Conectar desde Microservicios

### Node.js
```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://mqtt:1883', {
  username: 'micro_analytics',
  password: process.env.MQTT_PASSWORD,
  clientId: `micro_analytics_${process.pid}`,
  reconnectPeriod: 1000,
  connectTimeout: 30000
});

client.on('connect', () => {
  console.log('✅ Conectado a MQTT');
  
  // Suscribirse a comandos
  client.subscribe('commands/analytics/#', (err) => {
    if (!err) console.log('📨 Suscrito a comandos');
  });
});

client.on('message', (topic, message) => {
  console.log(`📬 ${topic}: ${message.toString()}`);
});

// Publicar métrica
client.publish('metrics/application/requests', '1500', { qos: 1 });
```

### Python
```python
import paho.mqtt.client as mqtt
import os

def on_connect(client, userdata, flags, rc):
    print(f"✅ Conectado MQTT (código {rc})")
    client.subscribe("commands/analytics/#")

def on_message(client, userdata, msg):
    print(f"📬 {msg.topic}: {msg.payload.decode()}")

client = mqtt.Client()
client.username_pw_set(
    "micro_analytics",
    os.environ.get("MQTT_PASSWORD", "password")
)
client.on_connect = on_connect
client.on_message = on_message

client.connect("mqtt", 1883, 60)
client.loop_start()

# Publicar métrica
client.publish("metrics/application/requests", "1500", qos=1)
```

## Monitoreo

### Ver estadísticas del broker
```bash
docker exec mqtt mosquitto_sub -h localhost -u admin -P admin_password -t "\$SYS/broker/#" | head -20
```

### Verificar conexiones activas
```bash
docker exec mqtt mosquitto_sub -h localhost -u admin -P admin_password -t "\$SYS/broker/clients/connected"
```

### Logs en tiempo real
```bash
docker logs -f mqtt
```

## Troubleshooting

### Cliente no puede conectar
```bash
# 1. Verificar que Mosquitto está corriendo
docker ps | grep mqtt

# 2. Verificar logs de error
docker logs mqtt | grep -i error

# 3. Probar conexión desde dentro del contenedor
docker exec mqtt mosquitto_sub -h localhost -u testuser -P password -t "test"

# 4. Verificar credenciales en passwords.txt
docker exec mqtt cat /mqtt/acl/passwords.txt
```

### ACL no funciona
```bash
# 1. Recargar ACL sin reiniciar
docker exec mqtt kill -HUP 1

# 2. Verificar sintaxis de acl.acl
docker exec mqtt mosquitto -c /mosquitto/config/mosquitto.conf -t
```

### Alto uso de memoria
```bash
# Reducir retained messages en mosquitto.conf:
# max_queued_messages 500

# Reiniciar
docker-compose restart mqtt
```

## Desarrollo Local

### Conectarse al broker desde localhost
```bash
# Terminal 1: Ver mensajes
mosquitto_sub -h localhost -u admin -P admin_password -t "test"

# Terminal 2: Publicar mensajes
mosquitto_pub -h localhost -u admin -P admin_password -t "test" -m "Hola"
```

### Cliente WebSocket (desde navegador)
```html
<script src="https://cdn.paho.org/mqtt/js/mqttws31.js"></script>
<script>
  const client = new Paho.MQTT.Client("localhost", 9001, "web_client");
  client.connect({
    userName: "admin",
    password: "admin_password",
    onSuccess: () => console.log("✅ Conectado")
  });
</script>
```

## Seguridad en Producción

1. **Cambiar contraseñas por defecto**
2. **Habilitar TLS/SSL** (descomentar en mosquitto.conf)
3. **Usar certificados válidos** (not self-signed)
4. **Limitar conexiones** por IP si es posible
5. **Monitorear acceso** a tópicos sensibles
6. **Rotar credenciales** regularmente
7. **Usar vault externo** para contraseñas

## Performance Tuning

```bash
# Ver métricas de performance
docker exec mqtt mosquitto_sub -h localhost -t "\$SYS/broker/bytes/#"

# Ajustar en mosquitto.conf:
# max_inflight_messages 20  # Mensajes en vuelo
# max_queued_messages 1000  # Mensajes en cola
# message_size_limit 0      # Sin límite de tamaño
```

## Integraciones

### Con Prometheus
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'mqtt'
    static_configs:
      - targets: ['mqtt:1883']
```

### Con ELK Stack (logging)
```yaml
# beats/filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /mqtt/logs/*.log
```

---

**Última actualización:** 20 Enero 2026
**Documentación:** [TOPICS.md](TOPICS.md)
**Troubleshooting:** Consultar logs en `docker logs mqtt`
