# MQTT Topics Documentation

## Estructura de Tópicos

```
metrics/
├── system/
│   ├── cpu/
│   ├── memory/
│   └── disk/
├── application/
│   ├── requests/
│   ├── latency/
│   └── errors/
└── services/
    ├── {service_name}/health
    ├── {service_name}/performance
    └── {service_name}/connections

telemetry/
├── analytics/
│   ├── user_events/
│   ├── session_data/
│   └── funnel_data/
├── performance/
│   ├── response_times/
│   └── throughput/
└── business/
    ├── conversions/
    └── transactions/

events/
├── orders/
│   ├── created
│   ├── updated
│   └── completed
├── users/
│   ├── registered
│   ├── login
│   └── logout
└── payments/
    ├── initiated
    ├── completed
    └── failed

notifications/
├── email/
├── sms/
├── push/
└── in-app/

alerts/
├── critical/
├── warning/
└── info/

commands/
├── api/
│   └── {command_name}
├── analytics/
│   └── {command_name}
└── reporting/
    └── {command_name}

reports/
├── daily/
├── weekly/
└── monthly/
```

## Ejemplos de Uso

### Publicar Métrica
```javascript
// Analytics publicando métrica de usuarios activos
mqtt.publish('metrics/application/active_users', '1250');
mqtt.publish('telemetry/analytics/user_events', JSON.stringify({
  timestamp: Date.now(),
  type: 'login',
  user_id: 'usr_123',
  session_id: 'sess_456'
}));
```

### Suscribirse a Alertas
```javascript
// Dashboard suscrito a alertas críticas
mqtt.subscribe('alerts/critical/#');
mqtt.on('message', (topic, message) => {
  console.log(`⚠️ ALERTA: ${topic} - ${message}`);
});
```

### Enviar Comando
```javascript
// API enviando comando a analytics
mqtt.publish('commands/analytics/generate_report', JSON.stringify({
  report_type: 'daily',
  date: '2026-01-20',
  include_segments: true
}));
```

## Subscribers por Tópico

| Tópico | Subscribers | Frecuencia |
|--------|-------------|-----------|
| `metrics/#` | Dashboard, Prometheus | Real-time (10s) |
| `telemetry/#` | Analytics, Reporting | Real-time (1s) |
| `events/#` | Notifications, Logging | Real-time |
| `alerts/#` | Dashboard, Admin | Inmediato |
| `commands/#` | Microservices | Inmediato |

## Publishers por Tópico

| Tópico | Publishers | Descripción |
|--------|-----------|-------------|
| `metrics/` | System, Microservices | Métricas de performance |
| `telemetry/` | Analytics, Tracking | Datos de comportamiento |
| `events/` | Core Services | Eventos de dominio |
| `alerts/` | Monitoring | Alertas del sistema |
| `notifications/` | Notificaciones | Canales de notificación |
| `commands/` | API, Controllers | Comandos asíncronos |
| `reports/` | Reporting | Reportes generados |

## Retención y Persistencia

| Tipo | QoS | Retención |
|------|-----|-----------|
| Métrica en vivo | 0 | No |
| Evento importante | 1 | Sí (24h) |
| Comando crítico | 2 | Sí (7d) |
| Alerta | 2 | Sí (30d) |

## Seguridad

- **Autenticación:** Username + Password
- **Autorización:** ACL basado en tópicos
- **Encriptación:** TLS/SSL (opcional)
- **QoS Levels:**
  - 0: At most once (mejor esfuerzo)
  - 1: At least once (garantizado)
  - 2: Exactly once (máxima garantía)

## Troubleshooting

### Cliente no puede conectar
```bash
# Verificar si Mosquitto está corriendo
docker exec mqtt mosquitto_sub -h localhost -u testuser -P password123 -t "test"

# Ver logs
docker logs mqtt
```

### Topic no recibe mensajes
1. Verificar ACL de usuario
2. Verificar formato del tópico (sin espacios, caracteres válidos)
3. Verificar QoS (algunos clientes no soportan QoS 2)
4. Revisar conexión del publisher

### Alto uso de memoria
- Revisar cantidad de retained messages: `RETENTION` en config
- Reducir `max_queued_messages`
- Monitorear tamaño de mensajes

---

**Última actualización:** 20 Enero 2026
**Mantenedor:** DevOps Team
