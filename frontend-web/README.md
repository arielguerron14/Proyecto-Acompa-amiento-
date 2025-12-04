# Frontend Web

Interfaz web estática para la plataforma de acompañamiento educativo.

## 🎯 Descripción

El servicio **Frontend Web** proporciona la interfaz de usuario para interactuar con el sistema de acompañamiento de estudiantes. Sirve archivos HTML, CSS y JavaScript estáticos desde un servidor HTTP.

## 🛠️ Tecnologías

- **HTML5** - Estructura de marcado
- **CSS3** - Estilos y diseño responsive
- **JavaScript (Vanilla)** - Lógica del lado del cliente
- **HTTP Server** - Servidor de archivos estáticos (Node.js o Nginx)

## 📁 Estructura del Proyecto

```
frontend-web/
├── public/
│   ├── index.html              # Página de inicio
│   ├── estudiante.html         # Interfaz de estudiante
│   ├── maestro.html            # Interfaz de maestro (futuro)
│   ├── styles.css              # Estilos globales
│   ├── curriculum.js           # Datos/utilidades de currículo
│   └── images/                 # Imágenes
├── src/
│   ├── estudiante.js           # Lógica de página estudiante
│   ├── maestro.js              # Lógica de página maestro
│   └── common.js               # Lógica compartida
├── styles/
│   ├── styles.css              # Estilos adicionales
│   └── responsive.css          # Media queries
├── Dockerfile                  # Imagen Docker (nginx)
├── .dockerignore               # Exclusiones build
├── package.json                # Dependencias (http-server)
└── README.md                   # Este archivo
```

## Installation

### Prerequisites

- Node.js 18+ (para desarrollo con http-server) o Docker

### Local Setup con HTTP Server

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo en puerto 5500
npm start

# El frontend estará disponible en http://localhost:5500
```

### Docker Setup (Nginx - Recomendado)

```bash
# Construir la imagen
docker build -t frontend-web:local .

# Ejecutar el contenedor
docker run -d \
  --name frontend-web \
  -p 5500:80 \
  frontend-web:local
```

## 🎨 Páginas Disponibles

### index.html
Página de inicio con:
- Presentación de la plataforma
- Links de navegación a estudiantes y maestros
- Información general

### estudiante.html
Interfaz de estudiante con:
- Visualización de horarios disponibles
- Creación de reservas
- Listado de mis reservas
- Visualización de reportes personales

### maestro.html (Futuro)
Interfaz de maestro con:
- Gestión de horarios
- Visualización de reservas
- Reportes de estudiantes

## 🔗 API Endpoints Consumidos

El frontend se comunica con el API Gateway en `http://localhost:8080`:

```javascript
// Maestros
GET  /maestros/horarios              // Obtener horarios
POST /maestros/horarios              // Crear horario
DELETE /maestros/horarios/:id        // Eliminar horario

// Estudiantes
GET  /estudiantes/reservas           // Obtener mis reservas
POST /estudiantes/reservas           // Crear reserva
DELETE /estudiantes/reservas/:id     // Cancelar reserva

// Reportes
GET  /reportes/estudiantes           // Mi reporte
GET  /reportes/maestros              // Reportes (maestros)
```

## 🚀 Funcionalidades Principales

### Estudiante - Crear Reserva
```javascript
// src/estudiante.js
async function crearReserva(horarioId) {
  const response = await fetch(
    'http://localhost:8080/estudiantes/reservas',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estudianteId: localStorage.getItem('userId'),
        horarioId: horarioId
      })
    }
  );
  return response.json();
}
```

### Estudiante - Listar Reservas
```javascript
async function obtenerReservas() {
  const response = await fetch(
    'http://localhost:8080/estudiantes/reservas'
  );
  return response.json();
}
```

## 🎯 Variables Globales

**localStorage:**
```javascript
localStorage.userId        // ID del usuario actual
localStorage.userRole      // Rol del usuario (estudiante/maestro)
localStorage.userEmail     // Email del usuario
```

## 📱 Responsive Design

- **Mobile First** - Diseño adaptable
- **Breakpoints:**
  - `mobile`: < 768px
  - `tablet`: 768px - 1024px
  - `desktop`: > 1024px

## 🔧 Configuración

### Variables de Entorno (en Dockerfile)

```dockerfile
ENV API_GATEWAY_URL=http://api-gateway:8080
ENV PORT=5500
```

### Para modificar URL del API Gateway

Editar en `public/index.html` o `src/common.js`:

```javascript
const API_GATEWAY = 'http://localhost:8080';
```

## 📦 Dependencies

```json
{
  "http-server": "^14.1.1"
}
```

## ⚡ Desarrollo

### Modo desarrollo con hot-reload (opcional)

```bash
# Con nodemon (requiere instalación global)
npx nodemon -e "html,css,js" --exec "npm start"
```

### Browser DevTools

Abrir: **F12** o **Ctrl+Shift+I**

### Debugging

```javascript
// En consola del navegador
console.log('Datos:', data);
fetch('http://localhost:8080/maestros/horarios')
  .then(r => r.json())
  .then(data => console.table(data))
```

## 🔒 Seguridad

- ✅ CORS habilitado (API Gateway maneja)
- ✅ Tokens almacenados en localStorage (en desarrollo)
- ⚠️ IMPORTANTE: En producción usar httpOnly cookies

## 📊 Testing

Para probar endpoints desde la consola:

```javascript
// Test: Obtener horarios
fetch('http://localhost:8080/maestros/horarios')
  .then(r => r.json())
  .then(console.log)

// Test: Crear reserva
fetch('http://localhost:8080/estudiantes/reservas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    estudianteId: 'EST-001',
    horarioId: 'HORARIO-001'
  })
}).then(r => r.json()).then(console.log)
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:5500
- **API Gateway**: http://localhost:8080
- **Kafka UI**: http://localhost:8081
- **MongoDB**: mongodb://localhost:27017

## 📝 Build para Producción

```bash
# No requiere build (es estático)
# Solo copiar archivos de public/ al servidor
```

## 🐳 Docker Multi-stage Build

```dockerfile
# Stage 1: Copy static files
FROM nginx:alpine
COPY public/ /usr/share/nginx/html/
```
