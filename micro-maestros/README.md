# Micro-Maestros Service

Microservicio para la gestión de horarios y operaciones de maestros/profesores.

## 🎯 Descripción

El servicio **Micro-Maestros** maneja toda la funcionalidad relacionada con maestros, incluyendo la creación, lectura, actualización y gestión de horarios.

## Technologies

- **Node.js** 18+
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request body parsing
- **Dotenv** - Environment variable management
- **Nodemon** - Development auto-reload (optional)

## Project Structure

```
micro-maestros/
├── src/
│   ├── app.js                 # Express app setup
│   ├── controllers/
│   │   └── horariosController.js   # Schedule logic
│   ├── models/
│   │   └── Horario.js              # Schedule schema
│   ├── routes/
│   │   └── horariosRoutes.js       # Schedule routes
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
MONGO_URL=mongodb://localhost:27017/maestros
PORT=5001

# Run the service
npm start

# Or in development mode with auto-reload
npm run dev
```

### Docker Setup

```bash
# Build the image
docker build -t micro-maestros:local .

# Run the container
docker run -d \
  --name micro-maestros \
  -p 5001:5001 \
  -e MONGO_URL=mongodb://mongo:27017/maestros \
  micro-maestros:local
```

## API Endpoints

All endpoints are prefixed with `/` when accessed directly or `/maestros` when through the API Gateway.

### Schedules (Horarios)

- `POST /horarios` - Create a new schedule
- `GET /horarios` - Get all schedules
- `GET /horarios/maestro/:id` - Get schedules for a specific teacher
- `DELETE /horarios/:id` - Delete a schedule

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/maestros` |
| `PORT` | Service port | `5001` |

## Database

The service connects to MongoDB and uses Mongoose for schema validation.

**Collections:**
- `horarios` - Teacher schedules

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
docker build -t micro-maestros:1.0.0 .
docker run -d --name micro-maestros -p 5001:5001 micro-maestros:1.0.0
```

## Development

For local development with hot-reload:

```bash
npm run dev
```

(Requires `nodemon` in devDependencies)

## Troubleshooting

- **Connection refused to MongoDB**: Ensure MongoDB is running and `MONGO_URL` is correct.
- **Port already in use**: Change the `PORT` environment variable or kill the process using port 5001.

## License

MIT

## Support

For issues or questions, please contact the development team.
