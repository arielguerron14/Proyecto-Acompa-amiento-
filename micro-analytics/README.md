# micro-analytics

Microservicio de analytics: Kafka consumer para procesamiento de eventos en tiempo real.

## Características
- ✅ Kafka consumer para consumir eventos
- ✅ Almacenamiento de eventos
- ✅ Estadísticas agregadas
- ✅ Generación de reportes
- ✅ Integración con shared-auth
- ✅ Health check

## API Endpoints

### `GET /analytics/events`
Retorna los eventos registrados.

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

### `GET /analytics/stats`
Retorna estadísticas agregadas.

**Query Parameters:**
- `period` - Período de tiempo (default: 7d)

**Response:**
```json
{
  "success": true,
  "period": "7d",
  "stats": {
    "totalEvents": 125,
    "eventsByType": {
      "reservas": 75,
      "horarios": 30,
      "reportes": 20
    },
    "eventsByUser": {...}
  }
}
```

### `POST /analytics/events`
Registra un evento manualmente.

**Request:**
```json
{
  "eventType": "reservas",
  "userId": "user-001",
  "metadata": {
    "reservaId": "RES-123",
    "action": "created"
  }
}
```

### `GET /analytics/report`
Genera un reporte de analytics (admin only).

**Query Parameters:**
- `startDate` - Fecha inicial
- `endDate` - Fecha final
- `format` - Formato de respuesta: json o csv (default: json)

## Kafka Configuration
- **Topics**: reservas, horarios, reportes
- **Consumer Group**: analytics-group
- **KAFKA_ENABLED**: true para habilitar consumer
- **KAFKA_BROKERS**: localhost:9092 (default)

## Environment Variables
- `PORT` - Puerto en el que escucha (default: 5007)
- `KAFKA_ENABLED` - Habilitar Kafka consumer (true/false)
- `KAFKA_BROKERS` - Brokers de Kafka (comma-separated)
- `KAFKA_CLIENT_ID` - ID del cliente Kafka
- `JWT_SECRET` - Secreto para validar JWT

## Instalación
```bash
npm install
```

## Ejecución
```bash
npm start
```

## Docker
```bash
docker build -t micro-analytics .
docker run -p 5007:5007 \
  -e KAFKA_ENABLED=true \
  -e KAFKA_BROKERS=kafka:9092 \
  micro-analytics
```
