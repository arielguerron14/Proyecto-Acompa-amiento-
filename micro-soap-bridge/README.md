# micro-soap-bridge

Microservicio puente para integración con servicios SOAP legacy. Convierte llamadas REST a SOAP y viceversa.

## Características
- ✅ Adaptador REST → SOAP
- ✅ Gestión de servicios legacy
- ✅ Transformación de datos
- ✅ WSDL management
- ✅ Integración con shared-auth
- ✅ Health check

## API Endpoints

### `POST /soap/call`
Realiza una llamada a un servicio SOAP legacy.

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

### `GET /soap/services`
Retorna la lista de servicios SOAP disponibles.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "services": [
    {
      "name": "ALUMNOS",
      "url": "http://legacy-system:8080/ws/alumnos",
      "methods": ["getAlumno", "listAlumnos", "createAlumno", "updateAlumno"]
    },
    {
      "name": "CALIFICACIONES",
      "url": "http://legacy-system:8080/ws/calificaciones",
      "methods": ["getCalificacion", "setCalificacion", "reporteCalificaciones"]
    },
    {
      "name": "ASISTENCIA",
      "url": "http://legacy-system:8080/ws/asistencia",
      "methods": ["registrarAsistencia", "reporteAsistencia", "getAsistencia"]
    }
  ]
}
```

### `POST /soap/transform`
Transforma datos de REST a SOAP.

**Request:**
```json
{
  "data": {
    "alumnoId": "ALU-001",
    "nombre": "Juan Pérez"
  },
  "format": "soap"
}
```

### `GET /soap/wsdl/:serviceName`
Obtiene el WSDL de un servicio.

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://schemas.xmlsoap.org/wsdl/">
  ...
</definitions>
```

## Servicios Legacy Soportados

### ALUMNOS
- `getAlumno` - Obtiene datos de un alumno
- `listAlumnos` - Lista todos los alumnos
- `createAlumno` - Crea un nuevo alumno
- `updateAlumno` - Actualiza datos de alumno

### CALIFICACIONES
- `getCalificacion` - Obtiene calificación
- `setCalificacion` - Registra calificación
- `reporteCalificaciones` - Genera reporte de calificaciones

### ASISTENCIA
- `registrarAsistencia` - Registra asistencia de alumno
- `reporteAsistencia` - Genera reporte de asistencia
- `getAsistencia` - Obtiene historial de asistencia

## Environment Variables
- `PORT` - Puerto en el que escucha (default: 5008)
- `SOAP_ALUMNOS_URL` - URL del servicio SOAP de alumnos
- `SOAP_CALIFICACIONES_URL` - URL del servicio SOAP de calificaciones
- `SOAP_ASISTENCIA_URL` - URL del servicio SOAP de asistencia
- `JWT_SECRET` - Secreto para validar JWT

## Instalación
```bash
npm install
```

## Ejecución
```bash
npm start
```

## Docker
```bash
docker build -t micro-soap-bridge .
docker run -p 5008:5008 \
  -e SOAP_ALUMNOS_URL=http://legacy:8080/alumnos \
  -e SOAP_CALIFICACIONES_URL=http://legacy:8080/calificaciones \
  -e SOAP_ASISTENCIA_URL=http://legacy:8080/asistencia \
  micro-soap-bridge
```
