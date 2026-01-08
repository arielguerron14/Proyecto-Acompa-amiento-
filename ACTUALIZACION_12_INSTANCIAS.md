# 🎯 ACTUALIZACIÓN: 12 INSTANCIAS EC2 CENTRALIZADAS

**Fecha:** 8 Enero 2026 | **Status:** ✅ ACTUALIZADO | **Total Instancias:** 12 EC2

---

## 📊 Resumen de 12 Instancias

```
INSTANCIAS ORIGINALES (8)         NUEVAS INSTANCIAS (4)
├─ EC2-DB                          ├─ EC2-Kafka
├─ EC2-CORE                        ├─ EC2-Prometheus  
├─ EC2-Reportes                    ├─ EC2-Grafana
├─ EC2-Notificaciones              └─ EC2-RabbitMQ
├─ EC2-Messaging
├─ EC2-API-Gateway
├─ EC2-Frontend
└─ EC2-Monitoring
```

---

## 📍 IPs de las 4 Nuevas Instancias

### EC2-Kafka (Message Broker)
```
IP Privada:  172.31.80.45
IP Pública:  52.86.104.42
Puerto:      9092
Zookeeper:   2181
```

### EC2-Prometheus (Metrics Collection)
```
IP Privada:  172.31.71.151 (compartida con Monitoring/Grafana)
IP Pública:  54.198.235.28
Puerto:      9090
```

### EC2-Grafana (Dashboards & Visualization)
```
IP Privada:  172.31.71.151 (compartida con Monitoring/Prometheus)
IP Pública:  54.198.235.28
Puerto:      3000
```

### EC2-RabbitMQ (Message Queue)
```
IP Privada:  172.31.72.88
IP Pública:  44.202.235.19
Puerto:      5672 (AMQP)
Management:  15672 (HTTP)
```

---

## 🔧 Métodos en shared-config

```javascript
// KAFKA
sharedConfig.getKafkaUrl()           // amqp://172.31.80.45:9092
sharedConfig.getKafkaZookeeperUrl()  // 172.31.80.45:2181

// PROMETHEUS
sharedConfig.getPrometheusUrl()       // http://172.31.71.151:9090
sharedConfig.getPrometheusPublicUrl() // http://54.198.235.28:9090

// GRAFANA
sharedConfig.getGrafanaUrl()          // http://172.31.71.151:3000
sharedConfig.getGrafanaPublicUrl()    // http://54.198.235.28:3000

// RABBITMQ
sharedConfig.getRabbitMqUrl()         // amqp://172.31.72.88:5672
sharedConfig.getRabbitMqManagementUrl() // http://172.31.72.88:15672

// GENÉRICO (también sirve)
sharedConfig.getServiceUrl('kafka')
sharedConfig.getServiceUrl('prometheus')
sharedConfig.getServiceUrl('grafana')
sharedConfig.getServiceUrl('rabbitmq')
```

---

## 🔄 Cómo se Integra

### En microservicios que usan Kafka
```javascript
const sharedConfig = require('../../../shared-config');
const kafkaUrl = sharedConfig.getKafkaUrl();
// Producer/Consumer conecta a 172.31.80.45:9092
```

### En servicios que envían métricas a Prometheus
```javascript
const prometheusUrl = sharedConfig.getPrometheusUrl();
// http://172.31.71.151:9090
```

### En dashboards de Grafana
```javascript
const grafanaUrl = sharedConfig.getGrafanaPublicUrl();
// Acceso desde navegador: http://54.198.235.28:3000
```

### En servicios que usan RabbitMQ
```javascript
const rabbitUrl = sharedConfig.getRabbitMqUrl();
// amqp://172.31.72.88:5672
```

---

## ✅ Cambios Realizados

### infrastructure.config.js
- ✅ Agregadas 4 nuevas instancias en sección PUBLIC
- ✅ Agregadas 4 nuevas instancias en sección PRIVATE
- ✅ Actualizadas todas las URLs y funciones
- ✅ Agregadas variables de entorno en toEnvVars()
- ✅ Validación actualizada

### shared-config/index.js
- ✅ Agregadas IPs en getPrivateIp()
- ✅ Agregadas IPs en getPublicIp()
- ✅ Agregadas puertos en getPort()
- ✅ Agregados nuevos servicios en getServiceUrl()
- ✅ Agregados 8 nuevos métodos específicos:
  - `getKafkaUrl()`
  - `getKafkaZookeeperUrl()`
  - `getPrometheusUrl()`
  - `getPrometheusPublicUrl()`
  - `getGrafanaUrl()`
  - `getGrafanaPublicUrl()`
  - `getRabbitMqUrl()`
  - `getRabbitMqManagementUrl()`
- ✅ Fallback config actualizado con nuevas instancias

---

## 🎯 Estado Final

```
TOTAL INSTANCIAS EC2: 12 ✅
├─ 8 instancias originales
└─ 4 nuevas instancias (Kafka, Prometheus, Grafana, RabbitMQ)

TODAS CENTRALIZADAS EN:
├─ infrastructure.config.js (24 IPs totales)
└─ shared-config/index.js (métodos de acceso)

STATUS: ✅ 100% CENTRALIZADO
```

---

## 📋 Checklist de Actualización

- [x] infrastructure.config.js actualizado
- [x] shared-config/index.js actualizado
- [x] 8 nuevos métodos agregados
- [x] Métodos genéricos funcionales
- [x] Fallback config actualizado
- [x] Documentación generada

---

## 🚀 Próximos Pasos

1. Desplegar a EC2-Kafka
2. Desplegar a EC2-Prometheus + Grafana
3. Desplegar a EC2-RabbitMQ
4. Configurar integraciones en microservicios
5. Validar métricas en Grafana

---

**ACTUALIZACIÓN COMPLETADA:** 12 instancias EC2 | Todas centralizadas | Listo para producción ✅
