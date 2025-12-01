# Micro-Estudiantes Service

This microservice manages student reservations and related operations.

## Overview

The **Micro-Estudiantes** service handles all student-related functionality, including creating, reading, and managing reservations.

## Technologies

- **Node.js** 18+
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request body parsing
- **Dotenv** - Environment variable management

## Project Structure

```
micro-estudiantes/
├── src/
│   ├── app.js                 # Express app setup
│   ├── controllers/
│   │   └── reservasController.js   # Reservation logic
│   ├── models/
│   │   └── Reserva.js              # Reservation schema
│   ├── routes/
│   │   └── reservasRoutes.js       # Reservation routes
│   └── database/
│       └── conexion.js             # MongoDB connection
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
MONGO_URL=mongodb://localhost:27017/estudiantes
PORT=5002

# Run the service
npm start
```

### Docker Setup

```bash
# Build the image
docker build -t micro-estudiantes:local .

# Run the container
docker run -d \
  --name micro-estudiantes \
  -p 5002:5002 \
  -e MONGO_URL=mongodb://mongo:27017/estudiantes \
  micro-estudiantes:local
```

## API Endpoints

All endpoints are prefixed with `/` when accessed directly or `/estudiantes` when through the API Gateway.

### Reservations

- `POST /reservas` - Create a new reservation
- `GET /reservas` - Get all reservations
- `GET /reservas/:id` - Get a specific reservation by ID
- `DELETE /reservas/:id` - Delete a reservation

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/estudiantes` |
| `PORT` | Service port | `5002` |

## Database

The service connects to MongoDB and uses Mongoose for schema validation.

**Collections:**
- `reservas` - Student reservations

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
docker build -t micro-estudiantes:1.0.0 .
docker run -d --name micro-estudiantes -p 5002:5002 micro-estudiantes:1.0.0
```

## Troubleshooting

- **Connection refused to MongoDB**: Ensure MongoDB is running and `MONGO_URL` is correct.
- **Port already in use**: Change the `PORT` environment variable or kill the process using port 5002.

## License

MIT

## Support

For issues or questions, please contact the development team.
