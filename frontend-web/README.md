# Frontend Web

Interfaz web estática para la plataforma de acompañamiento.

## 🎯 Descripción

El servicio **Frontend Web** proporciona la interfaz de usuario para interactuar con el sistema de acompañamiento de estudiantes. Sirve archivos HTML, CSS y JavaScript estáticos.

## 🛠️ Tecnologías

- **HTML5** - Estructura de marcado
- **CSS3** - Estilos
- **JavaScript** - Lógica del lado del cliente
- **HTTP Server** - Servidor de archivos estáticos

## Project Structure

```
frontend-web/
├── public/
│   ├── index.html              # Main landing page
│   ├── estudiante.html         # Student interface
│   ├── styles.css              # Global styles
│   └── curriculum.js           # Curriculum data/utilities
├── src/
│   ├── estudiante.js           # Student page logic
│   └── maestro.js              # Teacher page logic
├── styles/
│   └── styles.css              # Additional styles
├── Dockerfile                  # Docker image definition (nginx)
├── .dockerignore               # Docker build exclusions
├── package.json                # Dependencies (http-server)
└── README.md                   # This file
```

## Installation

### Prerequisites

- Node.js 18+ (for local development with http-server) or Docker

### Local Setup with HTTP Server

```bash
# Install dependencies
npm install

# Run the development server on port 5500
npm start
```

Access the application at `http://localhost:5500`

### Docker Setup with Nginx

```bash
# Build the image
docker build -t frontend-web:local .

# Run the container (serves on port 80)
docker run -d \
  --name frontend-web \
  -p 5500:80 \
  frontend-web:local
```

Access the application at `http://localhost:5500`

## Pages

### index.html
Main landing page with navigation and overview.

**Available from:**
- Local: `http://localhost:5500/index.html`
- Via Gateway: `http://localhost:8080/index.html`

### estudiante.html
Student-facing interface for managing reservations and viewing reports.

**Available from:**
- Local: `http://localhost:5500/estudiante.html`
- Via Gateway: `http://localhost:8080/estudiante.html`

## API Integration

The frontend communicates with the API Gateway at port `8080`:

- **Teachers Schedules**: `GET http://localhost:8080/maestros/horarios`
- **Student Reservations**: `GET http://localhost:8080/estudiantes/reservas`
- **Student Reports**: `GET http://localhost:8080/reportes/estudiantes`
- **Teacher Reports**: `GET http://localhost:8080/reportes/maestros`

### Example API Call

```javascript
// From browser console
fetch('http://localhost:8080/maestros/horarios')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

## Environment

The frontend is entirely client-side and requires no environment variables. Configure API endpoints in the JavaScript files as needed.

## Development

### Structure

- **`public/`**: Files served directly to clients
- **`src/`**: JavaScript logic for different pages
- **`styles/`**: CSS stylesheets

### Browser Developer Tools

Open DevTools (F12) to:
- Inspect Network requests to the API Gateway
- Debug JavaScript
- Check Console for errors

## Deployment

### Using Docker Compose

See the root `README.md` for instructions on deploying the entire stack.

### Standalone Docker (Nginx)

```bash
docker build -t frontend-web:1.0.0 .
docker run -d --name frontend-web -p 5500:80 frontend-web:1.0.0
```

### Standalone (HTTP Server)

```bash
npm install
npm start
```

## Testing

Access the frontend and check:
- [ ] Main page loads (`/`)
- [ ] Student page loads (`/estudiante.html`)
- [ ] Styles are applied correctly
- [ ] Console has no errors
- [ ] API calls from browser reach the gateway

### Example Test

```bash
curl -s http://localhost:5500/index.html | head -20
```

## Troubleshooting

- **404 Not Found**: Ensure files are in the `public/` directory
- **Port already in use**: Change the port in `npm start` or use Docker
- **API calls failing**: Verify the API Gateway is running on `http://localhost:8080`
- **CORS errors**: Check API Gateway CORS configuration

## License

MIT

## Support

For issues or questions, please contact the development team.
