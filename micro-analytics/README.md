# micro-analytics

Microservicio de analytics: Kafka consumer para procesamiento de eventos en tiempo real.

## 🎯 Descripción

El servicio **micro-analytics** actúa como consumidor de Kafka para procesar eventos en tiempo real, generar estadísticas agregadas y proporcionar dashboards de analytics para toda la plataforma.

## ✨ Características

- ✅ Kafka consumer para consumir eventos
- ✅ Almacenamiento de eventos
- ✅ Estadísticas agregadas en tiempo real
- ✅ Generación de reportes
- ✅ Integración con shared-auth
- ✅ Health check / Ping

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **Apache Kafka** - Event streaming
- **Dotenv** - Gestión de variables de entorno

## 📁 Estructura del Proyecto

```
micro-analytics/
├── src/
│   ├── app.js                      # Express app setup (standardized)
│   ├── controllers/
│   │   └── analyticsController.js  # HTTP handlers
│   ├── routes/
│   │   └── analyticsRoutes.js      # Rutas HTTP
│   ├── kafka/
│   │   └── consumer.js             # Kafka consumer
├── Dockerfile                  # Imagen Docker
├── .dockerignore               # Exclusiones build
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## 📡 API Endpoints

### Obtener Eventos

- `GET /analytics/events` - Retorna los eventos registrados

**Query Parameters:**
- `limit` - Número de eventos a retornar (default: 50)
- `offset` - Desplazamiento (default: 0)
- `type` - Filtrar por tipo de evento

**Response:**
```json
{
  "success": true,
  "count": 10,
  "events": [
    {
      "id": "EVT-1699...",
      "eventType": "reservas",
      "userId": "user-001",
      "metadata": {...},
      "timestamp": "2024-12-01T10:30:00Z"
    }
  ]
}
```

### Obtener Estadísticas

- `GET /analytics/stats` - Retorna estadísticas agregadas

**Query Parameters:**
- `period` - Período de tiempo (default: 7d, opciones: 1d, 7d, 30d)

**Response:**
```json
{
  "success": true,
  "period": "7d",
  "stats": {
    "totalEvents": 1250,
    "eventsByType": {
      "reservas": 450,
      "horarios": 350,
      "reportes": 450
    },
    "activeUsers": 145,
    "topUsers": [...]
  }
}
```

### Health Check

- `GET /ping` - Verifica que el servicio está activo

**Response:**
```json
{
  "status": "ok",
  "service": "micro-analytics",
  "kafkaConsumer": "connected"
}
```

## Ejemplos cURL

```bash
# Obtener eventos de los últimos 7 días
curl "http://localhost:5007/analytics/events?limit=100&offset=0"

# Obtener eventos filtrados por tipo
curl "http://localhost:5007/analytics/events?type=reservas&limit=50"

# Obtener estadísticas de 30 días
curl "http://localhost:5007/analytics/stats?period=30d"

# Health check
curl http://localhost:5007/ping
```

## Installation

### Prerequisites

- Node.js 18+ o Docker
- Apache Kafka 7.5.0+ corriendo en localhost:9092

### Local Setup

```bash
# Instalar dependencias
npm install

# Establecer variables de entorno (crear archivo .env)
PORT=5007
KAFKA_BROKER=kafka:9092
KAFKA_CONSUMER_GROUP=micro-analytics-group

# Ejecutar el servicio
npm start
```

### Docker Setup

```bash
# Construir la imagen
docker build -t micro-analytics:local .

# Ejecutar el contenedor
docker run -d \
  --name micro-analytics \
  -p 5007:5007 \
  -e PORT=5007 \
  -e KAFKA_BROKER=kafka:9092 \
  micro-analytics:local
```

## 🏛️ Patrones Implementados

- **Kafka Consumer**: Consume eventos de múltiples tópicos
- **Thin Controllers**: Solo orquestación HTTP, sin lógica
- **Centralized Logger**: Logging consistente
- **Event Processing**: Procesa eventos en tiempo real

## 🎯 Eventos Consumidos de Kafka

El servicio consume eventos de los tópicos:

```
- reservas: Eventos de reservas de estudiantes
- horarios: Eventos de horarios de maestros
- reportes: Eventos de generación de reportes
- usuarios: Eventos de usuarios (login, etc)
```

## Environment Variables

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `PORT` | Puerto del servicio | `5007` |
| `KAFKA_BROKER` | Broker de Kafka | `kafka:9092` |
| `KAFKA_CONSUMER_GROUP` | Grupo de consumidor | `micro-analytics-group` |

## 🔌 Integración

Otros servicios publican eventos en Kafka:

```javascript
// Desde cualquier microservicio
const kafka = require('kafkajs');
const producer = kafka.producer();
await producer.send({
  topic: 'reservas',
  messages: [
    {
      key: 'reserva-001',
      value: JSON.stringify({
        type: 'reserva_creada',
        reservaId: 'RESERVA-001',
        timestamp: new Date()
      })
    }
  ]
});
```

## 📊 Dashboard Kafka UI

Monitorizar eventos en tiempo real en: **http://localhost:8081**
