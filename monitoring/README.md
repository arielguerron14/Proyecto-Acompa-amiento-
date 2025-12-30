# Guía de Monitoreo con Prometheus y Grafana

## Acceso

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Usuario: admin
  - Contraseña: admin

## Servicios Monitoreados

Los siguientes servicios exponen métricas en `/metrics` (puertos por defecto):
- api-gateway:8080
- micro-auth:5005
- micro-maestros:5001
- micro-estudiantes:5002
- micro-reportes-estudiantes:5003
- micro-reportes-maestros:5004
- micro-notificaciones:5006
- micro-analytics:5007
- micro-soap-bridge:5008

Componentes de mensajería y puertos comunes:
- Kafka broker: 9092
- Zookeeper: 2181
- RabbitMQ: 5672 (management 15672)
- Kafka UI: 8081

## Dashboards

- **Microservices Monitoring Dashboard**: Visualiza CPU, RAM, latencia HTTP, errores y estado de servicios.

## Alertas

- **Service Down**: Alerta crítica si un servicio está caído por más de 1 minuto.
- **High CPU Usage**: Alerta de advertencia si CPU > 80% por 5 minutos.

## Inicio

1. Ejecutar `docker-compose up -d prometheus grafana`
2. Acceder a Grafana y configurar notificaciones si es necesario (email, Slack, etc.).

## Notas

- Las métricas se recolectan cada 15 segundos.
- Los datos se retienen por 200 horas en Prometheus.