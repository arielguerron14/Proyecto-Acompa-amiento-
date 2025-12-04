# Micro-Reportes-Maestros

Microservicio para la generación de reportes y análisis de maestros.

## 🎯 Descripción

El servicio **Micro-Reportes-Maestros** maneja toda la funcionalidad de generación de reportes y recuperación de datos relacionados con actividades docentes y desempeño de maestros. Procesa eventos de otros servicios.

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM
- **CORS** - Soporte CORS
- **Dotenv** - Gestión de variables de entorno

## 📁 Estructura del Proyecto

```
micro-reportes-maestros/
├── src/
│   ├── app.js                           # Express app setup
│   ├── controllers/
│   │   └── reportesMaestroController.js # HTTP handlers
│   ├── models/
│   │   └── ReporteMaestro.js            # Esquema MongoDB
│   ├── routes/
│   │   └── reportesMaestroRoutes.js     # Rutas HTTP
│   └── database/
│       └── conexion.js                  # Conexión MongoDB
├── Dockerfile                  # Imagen Docker
├── .dockerignore               # Exclusiones build
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## Installation

### Prerequisites

- Node.js 18+ o Docker

### Local Setup

```bash
# Instalar dependencias
npm install

# Establecer variables de entorno (crear archivo .env)
MONGO_URL=mongodb://localhost:27017/reportes-maestros
PORT=5004

# Ejecutar el servicio
npm start
```

### Docker Setup

```bash
# Construir la imagen
docker build -t micro-reportes-maestros:local .

# Ejecutar el contenedor
docker run -d \
  --name micro-reportes-maestros \
  -p 5004:5004 \
  -e MONGO_URL=mongodb://mongo:27017/reportes-maestros \
  micro-reportes-maestros:local
```

## 📡 API Endpoints

### Reportes de Maestros

- `GET /reportes` - Obtener todos los reportes
- `GET /reportes/:maestroId` - Obtener reporte de un maestro
- `POST /eventos` - Registrar evento (usado internamente por otros servicios)

## Ejemplos cURL

```bash
# Obtener todos los reportes
curl http://localhost:5004/reportes

# Obtener reporte de un maestro
curl http://localhost:5004/reportes/MAE-001

# Registrar evento (desde otro servicio)
curl -X POST http://localhost:5004/eventos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "horario_creado",
    "maestroId": "MAE-001",
    "timestamp": "2024-12-01T10:30:00Z"
  }'
```

## 🔌 Eventos que Procesa

- `horario_creado` - Cuando un maestro crea un horario
- `horario_actualizado` - Cuando se actualiza un horario
- `sesion_realizada` - Cuando se realiza una sesión

## Environment Variables

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `MONGO_URL` | Cadena de conexión MongoDB | `mongodb://localhost:27017/reportes-maestros` |
| `PORT` | Puerto del servicio | `5004` |

## Database

**Colecciones:**
- `reportes_maestros` - Reportes agregados de maestros
- `eventos` - Log de eventos procesados
