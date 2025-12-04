# micro-soap-bridge

Microservicio puente para integración con servicios SOAP legacy. Convierte llamadas REST a SOAP y viceversa.

## 🎯 Descripción

El servicio **micro-soap-bridge** actúa como adaptador entre la arquitectura REST moderna y sistemas legacy SOAP. Permite que los microservicios modernos se comuniquen con servicios legacy sin reescribirlos.

## ✨ Características

- ✅ Adaptador REST → SOAP
- ✅ Gestión de servicios legacy
- ✅ Transformación automática de datos
- ✅ WSDL management
- ✅ Integración con shared-auth
- ✅ Health check / Ping
- ✅ Error handling robusto

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** - Framework web
- **soap** - Cliente SOAP para Node.js
- **Dotenv** - Gestión de variables de entorno

## 📁 Estructura del Proyecto

```
micro-soap-bridge/
├── src/
│   ├── app.js                      # Express app setup (standardized)
│   ├── controllers/
│   │   └── soapController.js       # HTTP handlers
│   ├── routes/
│   │   └── soapRoutes.js           # Rutas HTTP
│   ├── services/
│   │   └── soapService.js          # Lógica SOAP
├── Dockerfile                  # Imagen Docker
├── .dockerignore               # Exclusiones build
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

## 📡 API Endpoints

### Llamada a Servicio SOAP

- `POST /soap/call` - Realiza una llamada a un servicio SOAP legacy

**Request:**
```json
{
  "serviceName": "ALUMNOS",
  "method": "getAlumno",
  "args": {
    "id": "ALU-001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "service": "ALUMNOS",
  "method": "getAlumno",
  "result": {
    "alumnoId": "ALU-001",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "activo": true
  }
}
```

### Listar Servicios SOAP Disponibles

- `GET /soap/services` - Retorna la lista de servicios SOAP disponibles

**Response:**
```json
{
  "success": true,
  "services": [
    {
      "name": "ALUMNOS",
      "wsdl": "http://legacy-system:8080/ALUMNOS?wsdl",
      "methods": [
        "getAlumno",
        "getAlumnos",
        "createAlumno",
        "updateAlumno",
        "deleteAlumno"
      ]
    },
    {
      "name": "DOCENTES",
      "wsdl": "http://legacy-system:8080/DOCENTES?wsdl",
      "methods": [...]
    }
  ]
}
```

### Obtener Métodos de un Servicio

- `GET /soap/services/:serviceName` - Obtiene métodos disponibles de un servicio

**Response:**
```json
{
  "success": true,
  "service": "ALUMNOS",
  "methods": [
    {
      "name": "getAlumno",
      "description": "Obtiene un alumno por ID"
    }
  ]
}
```

### Health Check

- `GET /ping` - Verifica que el servicio está activo

**Response:**
```json
{
  "status": "ok",
  "service": "micro-soap-bridge"
}
```

## Ejemplos cURL

```bash
# Llamar a método SOAP
curl -X POST http://localhost:5008/soap/call \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "ALUMNOS",
    "method": "getAlumno",
    "args": {
      "id": "ALU-001"
    }
  }'

# Listar servicios disponibles
curl http://localhost:5008/soap/services

# Obtener métodos de un servicio
curl http://localhost:5008/soap/services/ALUMNOS

# Crear alumno
curl -X POST http://localhost:5008/soap/call \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "ALUMNOS",
    "method": "createAlumno",
    "args": {
      "nombre": "Carlos López",
      "email": "carlos@example.com",
      "carrera": "Ingeniería"
    }
  }'

# Health check
curl http://localhost:5008/ping
```

## Installation

### Prerequisites

- Node.js 18+ o Docker
- Acceso a servicios SOAP legacy (URLs configuradas)

### Local Setup

```bash
# Instalar dependencias
npm install

# Establecer variables de entorno (crear archivo .env)
PORT=5008
SOAP_ALUMNOS_WSDL=http://legacy-system:8080/ALUMNOS?wsdl
SOAP_DOCENTES_WSDL=http://legacy-system:8080/DOCENTES?wsdl
SOAP_CURSOS_WSDL=http://legacy-system:8080/CURSOS?wsdl

# Ejecutar el servicio
npm start
```

### Docker Setup

```bash
# Construir la imagen
docker build -t micro-soap-bridge:local .

# Ejecutar el contenedor
docker run -d \
  --name micro-soap-bridge \
  -p 5008:5008 \
  -e PORT=5008 \
  -e SOAP_ALUMNOS_WSDL=http://legacy-system:8080/ALUMNOS?wsdl \
  micro-soap-bridge:local
```

## 🏛️ Patrones Implementados

- **Adapter Pattern**: Convierte REST → SOAP
- **Thin Controllers**: Solo orquestación HTTP
- **Centralized Logger**: Logging consistente
- **Error Handling**: Manejo robusto de errores SOAP

## ⚙️ Configuración de Servicios SOAP

Los servicios SOAP se configuran vía variables de entorno:

```bash
SOAP_<SERVICE_NAME>_WSDL=<URL_DEL_WSDL>
```

**Ejemplo:**
```bash
SOAP_ALUMNOS_WSDL=http://legacy.company.com:8080/AlumnosService?wsdl
SOAP_DOCENTES_WSDL=http://legacy.company.com:8080/DocentesService?wsdl
SOAP_CURSOS_WSDL=http://legacy.company.com:8080/CursosService?wsdl
```

## Environment Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servicio | `5008` |
| `SOAP_<NAME>_WSDL` | URL WSDL del servicio SOAP | `http://legacy-system:8080/SERVICE?wsdl` |

## 🔄 Flujo de Transformación

```
Cliente REST
    ↓
micro-soap-bridge (REST → SOAP)
    ↓
Servicio SOAP Legacy
    ↓
Response SOAP → JSON
    ↓
Cliente REST
```

## 🔌 Integración

Otros servicios pueden usar el bridge:

```javascript
// Desde cualquier microservicio
const { post } = require('../utils/httpClient');
const resultado = await post('http://micro-soap-bridge:5008/soap/call', {
  serviceName: 'ALUMNOS',
  method: 'getAlumno',
  args: { id: 'ALU-001' }
});
```

## ⚠️ Consideraciones

- **Timeout**: Los servicios SOAP pueden ser lentos, se recomienda timeout alto
- **Caching**: Considerar cachear resultados SOAP frecuentes
- **Transformación**: Los datos pueden necesitar transformación adicional
- **Errores SOAP**: Se convierten a errores HTTP estándar (400, 404, 500, etc)
