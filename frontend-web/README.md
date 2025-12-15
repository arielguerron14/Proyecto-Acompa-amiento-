# Frontend - Acompañamiento Educativo

Aplicación React + TypeScript para la interfaz de usuario del sistema de acompañamiento educativo.

## Arquitectura

### Estructura de Carpetas
```
src/
├── components/     # Componentes UI reutilizables
├── pages/         # Páginas principales (feature-based)
├── services/      # Servicios API desacoplados
├── store/         # State management (Zustand)
├── guards/        # Guards de autenticación y autorización
├── hooks/         # Custom hooks
├── types/         # Definiciones TypeScript
└── utils/         # Utilidades
```

### Tecnologías
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client

## Autenticación y Seguridad

### JWT Management
- Tokens almacenados de forma segura
- Refresh token automático
- Interceptors para manejo de errores 401/403

### RBAC (Role-Based Access Control)
- Roles: admin, maestro, estudiante, auditor
- Guards de ruta por rol
- Renderizado condicional

## Integración con Backend

### API Gateway
Todo el tráfico pasa por `http://localhost:3000` (API Gateway).

### Servicios API
- Capa desacoplada con Axios
- Timeouts y retries configurables
- Manejo centralizado de errores

## Desarrollo

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Variables de Entorno

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Acompañamiento Educativo
```

## Flujo de Autenticación

1. Usuario ingresa credenciales
2. POST /auth/login → API Gateway
3. Validación JWT en micro-auth
4. Token almacenado en Zustand + localStorage
5. Interceptors agregan Authorization header
6. Refresh automático en caso de expiración
7. Logout limpia estado y redirige

## Roles y Permisos

| Rol | Permisos |
|-----|----------|
| admin | CRUD completo, gestión usuarios |
| maestro | Gestión estudiantes, reportes |
| estudiante | Ver reportes propios |
| auditor | Solo lectura, reportes |

## Rendimiento

- Lazy loading de rutas
- Code splitting automático
- Optimización de renders con React.memo
- Tailwind CSS para estilos eficientes

## Accesibilidad

- ARIA labels
- Navegación por teclado
- Contraste de colores
- Screen reader support
npm install -g http-server

# Navegar a la carpeta del proyecto
cd frontend-web

# Ejecutar servidor estático en puerto 5500
http-server ./public -p 5500 -c-1

# Acceder en el navegador
http://localhost:5500/login.html
```

O usa el script batch incluido en Windows:

```batch
start-frontend.bat
```

## 🎨 Páginas Disponibles

### 1. Login (login.html)
```
http://localhost:5500/login.html
```

**Funcionalidad actual (simplificada):**
- ✅ Inicia sesión pegando un token JWT válido (testing/dev)
- ✅ El frontend valida el token consultando `GET /auth/me` y guarda el payload en `localStorage`

Nota: Los endpoints de login/register/refresh/logout han sido eliminados del servicio de autenticación en esta rama; para pruebas pega un JWT válido en la página de login.

### 2. Panel de Maestros (index.html)
```
http://localhost:5500/index.html
```

**Funcionalidades:**
- Ver horarios y reservas
- Generar reportes
- Gestionar estudiantes

### 3. Panel de Estudiantes (estudiante.html)
```
http://localhost:5500/estudiante.html
```

**Funcionalidades:**
- Reservar sesiones
- Ver reportes personales
- Visualizar currículo
- Verificar tokens JWT

## 🔄 Flujo de Autenticación (actualizado)

```
1. Usuario accede a login.html
  ↓
2. Pega un token JWT válido en el campo de login
  ↓
3. Frontend guarda el token en `localStorage` y llama `GET http://localhost:8080/auth/me` con `Authorization: Bearer <token>`
  ↓
4. Si el token es válido, se guarda el payload (`user`) en `localStorage` y se redirige al dashboard correspondiente
  ↓
5. Cada request posterior incluye: `Authorization: Bearer <token>`
```

## 📝 Archivo de Configuración

En cada HTML, se define:

```javascript
const API = 'http://localhost:8080';
```

Para cambiar la URL del API Gateway, edita esta línea en los archivos HTML.

## 🚀 Despliegue

### Con HTTP Server (Desarrollo)

```bash
http-server ./public -p 5500 -c-1
```

### Con Docker

```bash
docker build -t frontend-web .
docker run -p 5500:5500 frontend-web
```

### Con docker-compose

```bash
docker-compose up -d frontend-web
```

## 🛠️ Desarrollo

### Estructura de Carpetas

```
frontend-web/public/
├── index.html           # Dashboard maestros
├── estudiante.html      # Dashboard estudiantes
├── login.html           # Página de login
├── styles.css           # Estilos globales
├── curriculum.js        # Datos de currículo
└── images/              # Imágenes y assets
```

### Agregar Nueva Página

1. Crear archivo HTML en `public/`
2. Incluir estilos: `<link rel="stylesheet" href="styles.css">`
3. Incluir scripts al final: `<script src="common.js"></script>`
4. Usar `const API = 'http://localhost:8080';` para solicitudes

### Ejemplo de Solicitud HTTP

```javascript
// Guardar token (desde login.html) y obtener perfil
localStorage.setItem('token', '<ACCESS_TOKEN>');
fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
  .then(res => res.json())
  .then(data => {
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'index.html';
  });

// Request autenticado
fetch(`${API}/maestros/list`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## 🐛 Resolución de Problemas

### "NetworkError when attempting to fetch resource"

**Causa:** El API Gateway no está corriendo

**Solución:**
1. Verifica que `start-gateway.bat` está ejecutándose
2. Comprueba http://localhost:8080 en el navegador
3. Recarga la página con Ctrl+Shift+R

### "Access to fetch has been blocked by CORS"

**Causa:** Mismatch en puertos o protocolos

**Solución:**
- Usa `http://localhost:5500` (no `127.0.0.1`)
- Asegúrate que el API Gateway está en `http://localhost:8080`
- Recarga con Ctrl+Shift+R

### "Uncaught ReferenceError: function is not defined"

**Causa:** JavaScript fuera del tag `<script>`

**Solución:**
- Verifica que todas las funciones están dentro de `<script>...</script>`
- El `</script>` debe ser el último elemento antes de `</body>`

## 📱 Responsive Design

El CSS incluye media queries para:
- ✅ Desktop (1024px+)
- ✅ Tablet (768px - 1023px)
- ✅ Móvil (< 768px)

## 🔐 Seguridad

- ✅ Token almacenado en localStorage
- ✅ Token enviado en header Authorization
- ✅ CORS validado por API Gateway
- ✅ Contraseñas no se guardan localmente

## 📦 Dependencias

El proyecto NO requiere npm en producción (solo archivos estáticos), pero para desarrollo:

```json
{
  "dependencies": {
    "http-server": "^14.1.1"
  }
}
```

---

**Última actualización:** Diciembre 5, 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Funcionando - Login y dashboards listos

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
