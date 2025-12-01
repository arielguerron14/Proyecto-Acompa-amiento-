# API Gateway

Central routing hub for the microservices architecture.

## Overview

The **API Gateway** serves as the single entry point for all client requests, routing them to the appropriate microservices and serving the frontend static files.

## Technologies

- **Node.js** 18+
- **Express.js** - Web framework
- **http-proxy-middleware** - Request proxying
- **Dotenv** - Environment variable management

## Project Structure

```
api-gateway/
├── server.js                   # Main gateway server
├── Dockerfile                  # Docker image definition
├── .dockerignore               # Docker build exclusions
├── package.json                # Dependencies
└── README.md                   # This file
```

## Installation

### Prerequisites

- Node.js 18+ or Docker
- Running microservices on the configured URLs

### Local Setup

```bash
# Install dependencies
npm install

# Set environment variables (create .env file)
PORT=8080
MAESTROS_URL=http://localhost:5001
ESTUDIANTES_URL=http://localhost:5002
REPORTES_EST_URL=http://localhost:5003
REPORTES_MAEST_URL=http://localhost:5004
FRONTEND_URL=http://localhost:5500

# Run the gateway
npm start
```

### Docker Setup

```bash
# Build the image
docker build -t api-gateway:local .

# Run the container (ensure microservices are accessible)
docker run -d \
  --name api-gateway \
  -p 8080:8080 \
  -e MAESTROS_URL=http://host.docker.internal:5001 \
  -e ESTUDIANTES_URL=http://host.docker.internal:5002 \
  -e REPORTES_EST_URL=http://host.docker.internal:5003 \
  -e REPORTES_MAEST_URL=http://host.docker.internal:5004 \
  api-gateway:local
```

## API Routes

The gateway proxies requests to microservices and serves the frontend:

### Microservice Routes

| Route | Target | Port |
|-------|--------|------|
| `/maestros/*` | Micro-Maestros | 5001 |
| `/estudiantes/*` | Micro-Estudiantes | 5002 |
| `/reportes/estudiantes/*` | Micro-Reportes-Estudiantes | 5003 |
| `/reportes/maestros/*` | Micro-Reportes-Maestros | 5004 |
| `/` | Frontend Static Files (from `../frontend-web/public`) | - |

### Examples

```bash
# Teachers schedules
curl http://localhost:8080/maestros/horarios

# Student reservations
curl http://localhost:8080/estudiantes/reservas

# Student reports
curl http://localhost:8080/reportes/estudiantes

# Teacher reports
curl http://localhost:8080/reportes/maestros

# Frontend
curl http://localhost:8080/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Gateway port | `8080` |
| `MAESTROS_URL` | Teachers microservice URL | `http://localhost:5001` |
| `ESTUDIANTES_URL` | Students microservice URL | `http://localhost:5002` |
| `REPORTES_EST_URL` | Student reports microservice URL | `http://localhost:5003` |
| `REPORTES_MAEST_URL` | Teacher reports microservice URL | `http://localhost:5004` |
| `FRONTEND_URL` | Frontend service URL (if proxying) | `http://localhost:5500` |

## Features

- **Request Routing**: Automatically routes to appropriate microservices
- **Static File Serving**: Serves frontend from `../frontend-web/public`
- **CORS Handling**: Manages cross-origin requests
- **Path Rewriting**: Cleans up URLs before forwarding to microservices

## Deployment

### Using Docker Compose

See the root `README.md` for instructions on deploying the entire stack.

### Standalone Docker

```bash
docker build -t api-gateway:1.0.0 .
docker run -d --name api-gateway -p 8080:8080 api-gateway:1.0.0
```

## Testing the Gateway

```bash
# Health check (returns frontend HTML)
curl http://localhost:8080/

# Test a microservice route
curl http://localhost:8080/maestros/horarios

# Create a new resource (example)
curl -X POST http://localhost:8080/maestros/horarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Horario 1"}'
```

## Troubleshooting

- **502 Bad Gateway**: Check that all microservices are running on their configured URLs
- **Port already in use**: Change the `PORT` environment variable or kill the process using port 8080
- **Frontend not loading**: Verify `../frontend-web/public` path exists relative to the gateway

## License

MIT

## Support

For issues or questions, please contact the development team.
