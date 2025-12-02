# Micro-Reportes-Maestros Service

Microservicio para la generación de reportes y análisis de maestros.

## 🎯 Descripción

El servicio **Micro-Reportes-Maestros** maneja toda la funcionalidad de generación de reportes y recuperación de datos relacionados con actividades docentes y desempeño de maestros.

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **MongoDB** - Base de datos
- **Mongoose** - ODM
- **CORS** - Soporte para CORS
- **Body Parser** - Parser de cuerpo de solicitudes
- **Dotenv** - Gestión de variables de entorno

## Project Structure

```
micro-reportes-maestros/
├── src/
│   ├── app.js                       # Express app setup
│   ├── controllers/
│   │   └── reportesMaestroController.js    # Report logic
│   ├── models/
│   │   └── ReporteMaestro.js               # Report schema
│   ├── routes/
│   │   └── reportesMaestroRoutes.js        # Report routes
│   └── database/
│       └── conexion.js                     # MongoDB connection
├── Dockerfile                  # Docker image definition
├── .dockerignore               # Docker build exclusions
├── package.json                # Dependencies
└── README.md                   # This file
```

## Installation

### Prerequisites

- Node.js 18+ or Docker

### Local Setup

```bash
# Install dependencies
npm install

# Set environment variables (create .env file)
MONGO_URL=mongodb://localhost:27017/reportes-maestros
PORT=5004

# Run the service
npm start
```

### Docker Setup

```bash
# Build the image
docker build -t micro-reportes-maestros:local .

# Run the container
docker run -d \
  --name micro-reportes-maestros \
  -p 5004:5004 \
  -e MONGO_URL=mongodb://mongo:27017/reportes-maestros \
  micro-reportes-maestros:local
```

## API Endpoints

All endpoints are prefixed with `/` when accessed directly or `/reportes/maestros` when through the API Gateway.

### Teacher Reports

- `POST /` - Create a new teacher report
- `GET /` - Get all teacher reports
- `GET /:id` - Get a specific report by ID
- `DELETE /:id` - Delete a report

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/reportes-maestros` |
| `PORT` | Service port | `5004` |

## Database

The service connects to MongoDB and uses Mongoose for schema validation.

**Collections:**
- `reportesmaestros` - Teacher reports and analytics

## Running Tests

```bash
# (Add test commands once tests are set up)
npm test
```

## Deployment

### Using Docker Compose

See the root `README.md` for instructions on deploying the entire stack.

### Standalone Docker

```bash
docker build -t micro-reportes-maestros:1.0.0 .
docker run -d --name micro-reportes-maestros -p 5004:5004 micro-reportes-maestros:1.0.0
```

## Troubleshooting

- **Connection refused to MongoDB**: Ensure MongoDB is running and `MONGO_URL` is correct.
- **Port already in use**: Change the `PORT` environment variable or kill the process using port 5004.

## License

MIT

## Support

For issues or questions, please contact the development team.
