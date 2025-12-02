# Micro-Reportes-Estudiantes Service

Microservicio para la generación de reportes y análisis de estudiantes.

## 🎯 Descripción

El servicio **Micro-Reportes-Estudiantes** maneja toda la funcionalidad de generación de reportes y recuperación de datos relacionados con el desempeño y actividades de estudiantes.

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
micro-reportes-estudiantes/
├── src/
│   ├── app.js                      # Express app setup
│   ├── controllers/
│   │   └── reportesEstController.js    # Report logic
│   ├── models/
│   │   └── ReporteEstudiante.js        # Report schema
│   ├── routes/
│   │   └── reportesEstRoutes.js        # Report routes
│   └── database/
│       └── conexion.js                 # MongoDB connection
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
MONGO_URL=mongodb://localhost:27017/reportes-estudiantes
PORT=5003

# Run the service
npm start
```

### Docker Setup

```bash
# Build the image
docker build -t micro-reportes-estudiantes:local .

# Run the container
docker run -d \
  --name micro-reportes-estudiantes \
  -p 5003:5003 \
  -e MONGO_URL=mongodb://mongo:27017/reportes-estudiantes \
  micro-reportes-estudiantes:local
```

## API Endpoints

All endpoints are prefixed with `/` when accessed directly or `/reportes/estudiantes` when through the API Gateway.

### Student Reports

- `POST /` - Create a new student report
- `GET /` - Get all student reports
- `GET /:id` - Get a specific report by ID
- `DELETE /:id` - Delete a report

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/reportes-estudiantes` |
| `PORT` | Service port | `5003` |

## Database

The service connects to MongoDB and uses Mongoose for schema validation.

**Collections:**
- `reportestudiantes` - Student reports and analytics

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
docker build -t micro-reportes-estudiantes:1.0.0 .
docker run -d --name micro-reportes-estudiantes -p 5003:5003 micro-reportes-estudiantes:1.0.0
```

## Troubleshooting

- **Connection refused to MongoDB**: Ensure MongoDB is running and `MONGO_URL` is correct.
- **Port already in use**: Change the `PORT` environment variable or kill the process using port 5003.

## License

MIT

## Support

For issues or questions, please contact the development team.
