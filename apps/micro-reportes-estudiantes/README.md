# Micro-Reportes-Estudiantes

Microservicio para la generación de reportes y análisis de estudiantes.

## 🎯 Descripción

El servicio **Micro-Reportes-Estudiantes** maneja toda la funcionalidad de generación de reportes y recuperación de datos relacionados con el desempeño y actividades de estudiantes. Procesa eventos de otros servicios.

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM
- **CORS** - Soporte CORS
- **Dotenv** - Gestión de variables de entorno

## 📁 Estructura del Proyecto

```
micro-reportes-estudiantes/
├── src/
│   ├── app.js                          # Express app setup
│   ├── controllers/
│   │   └── reportesEstController.js    # HTTP handlers
│   ├── models/
│   │   └── ReporteEstudiante.js        # Esquema MongoDB
│   ├── routes/
│   │   └── reportesEstRoutes.js        # Rutas HTTP
│   └── database/
│       └── conexion.js                 # Conexión MongoDB
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
MONGO_URL=mongodb://localhost:27017/reportes-estudiantes
PORT=5003

# Ejecutar el servicio
npm start
```

### Docker Setup

```bash
# Construir la imagen
docker build -t micro-reportes-estudiantes:local .

# Ejecutar el contenedor
docker run -d \
  --name micro-reportes-estudiantes \
  -p 5003:5003 \
  -e MONGO_URL=mongodb://mongo:27017/reportes-estudiantes \
  micro-reportes-estudiantes:local
```

## 📡 API Endpoints

### Reportes de Estudiantes

- `GET /reportes` - Obtener todos los reportes
- `GET /reportes/:estudianteId` - Obtener reporte de un estudiante
- `POST /eventos` - Registrar evento (usado internamente por otros servicios)

## Ejemplos cURL

```bash
# Obtener todos los reportes
curl http://localhost:5003/reportes

# Obtener reporte de un estudiante
curl http://localhost:5003/reportes/EST-001

# Registrar evento (desde otro servicio)
curl -X POST http://localhost:5003/eventos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "reserva_creada",
    "estudianteId": "EST-001",
    "timestamp": "2024-12-01T10:30:00Z"
  }'
```

## 🔌 Eventos que Procesa

- `reserva_creada` - Cuando un estudiante crea una reserva
- `reserva_cancelada` - Cuando se cancela una reserva
- `sesion_completada` - Cuando se completa una sesión

## Environment Variables

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `MONGO_URL` | Cadena de conexión MongoDB | `mongodb://localhost:27017/reportes-estudiantes` |
| `PORT` | Puerto del servicio | `5003` |

## Database

**Colecciones:**
- `reportes_estudiantes` - Reportes agregados de estudiantes
- `eventos` - Log de eventos procesados
