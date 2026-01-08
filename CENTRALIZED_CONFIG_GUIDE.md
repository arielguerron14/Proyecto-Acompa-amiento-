# Configuración Centralizada - Guía de Integración

## Propósito

Centralizar todas las IPs y URLs de los servicios en un único archivo (`infrastructure.config.js`) para facilitar:
- ✅ Cambios rápidos de infraestructura sin modificar código
- ✅ Reutilización de configuración en todos los servicios
- ✅ Fallbacks automáticos a localhost para desarrollo
- ✅ Validación centralizada de configuración

## Estructura

```
infrastructure.config.js          ← IPs hardcodeadas (ÚNICA FUENTE DE VERDAD)
    ↓
shared-config/index.js           ← Módulo para acceder a la config
    ↓
Todos los servicios usan shared-config
```

## IPs Hardcodeadas

Las IPs están definidas en `infrastructure.config.js` con dos secciones:

### PUBLIC (para acceso externo)
```javascript
{
  DB_IP: '44.192.114.31',
  CORE_IP: '13.216.12.61',
  API_GATEWAY_IP: '52.71.188.181',  // IP elástica
  FRONTEND_IP: '107.21.124.81',
  REPORTES_IP: '54.175.62.79',
  // ... etc
}
```

### PRIVATE (para comunicación interna VPC)
```javascript
{
  DB_IP: '172.31.79.193',           // IP privada (más rápida dentro de VPC)
  CORE_IP: '172.31.78.183',
  REPORTES_IP: '172.31.69.133',
  // ... etc
}
```

## Cómo Usarlo en Tus Servicios

### Opción 1: Usar `shared-config` (RECOMENDADO)

```javascript
// En tu microservicio
const sharedConfig = require('../shared-config');

// Obtener URL de Mongo
const mongoUrl = sharedConfig.getMongoUrl();

// Obtener URL de un servicio
const authService = sharedConfig.getServiceUrl('auth');
const reportesService = sharedConfig.getServiceUrl('reportes-est');

// Obtener IP privada
const coreIp = sharedConfig.getPrivateIp('core');

// Obtener puerto
const authPort = sharedConfig.getPort('auth');
```

### Opción 2: Acceder al config completo

```javascript
const sharedConfig = require('../shared-config');
const fullConfig = sharedConfig.getConfig();

console.log(fullConfig.PRIVATE.DB_IP);      // '172.31.79.193'
console.log(fullConfig.PUBLIC.API_GATEWAY_IP); // '52.71.188.181'
```

### Opción 3: Obtener todas las variables de entorno

```javascript
const sharedConfig = require('../shared-config');
const envVars = sharedConfig.getEnvVars();

// Exportar como variables de entorno
Object.assign(process.env, envVars);
```

## Servicios Disponibles

```javascript
const servicios = [
  'auth',              // micro-auth
  'estudiantes',       // micro-estudiantes
  'maestros',          // micro-maestros
  'gateway',           // api-gateway
  'reportes-est',      // micro-reportes-estudiantes
  'reportes-maest',    // micro-reportes-maestros
  'notificaciones',    // micro-notificaciones
  'messaging',         // MQTT Broker
];

// Uso
servicios.forEach(servicio => {
  const url = sharedConfig.getServiceUrl(servicio);
  console.log(`${servicio}: ${url}`);
});
```

## Instancias Disponibles

```javascript
const instancias = [
  'db',
  'core',
  'reportes',
  'notificaciones',
  'messaging',
  'api-gateway-replica',
  'frontend',
  'monitoring',
];

// Uso
const corePrivateIp = sharedConfig.getPrivateIp('core');  // '172.31.78.183'
const corePublicIp = sharedConfig.getPublicIp('core');    // '13.216.12.61'
```

## Ejemplo Completo: Microservicio

### micro-estudiantes/server.js

```javascript
const express = require('express');
const mongoose = require('mongoose');
const sharedConfig = require('../shared-config');

const app = express();

// Conectar a MongoDB usando config centralizada
const mongoUrl = sharedConfig.getMongoUrl();
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'micro-estudiantes' });
});

// Llamar a otro servicio (auth) usando config centralizada
const authServiceUrl = sharedConfig.getServiceUrl('auth');
app.post('/verify-token', async (req, res) => {
  const response = await fetch(`${authServiceUrl}/auth/verify-token`, {
    method: 'POST',
    body: JSON.stringify(req.body),
  });
  res.json(await response.json());
});

const PORT = sharedConfig.getPort('estudiantes') || 3001;
app.listen(PORT, () => {
  console.log(`✅ micro-estudiantes escuchando en puerto ${PORT}`);
  console.log(`📍 MongoDB: ${mongoUrl}`);
  console.log(`🔗 Auth Service: ${authServiceUrl}`);
});
```

## Cambiar IPs en Producción

### 1. Editar infrastructure.config.js

```javascript
module.exports = {
  PUBLIC: {
    CORE_IP: '13.216.12.61',  // ← Cambiar aquí
    // ... resto de IPs
  },
  PRIVATE: {
    CORE_IP: '172.31.78.183',  // ← O aquí
    // ...
  }
}
```

### 2. O usar variables de entorno

```bash
# En .env o en docker-compose.yml
export CORE_PRIVATE_IP=172.31.78.183
export DB_PRIVATE_IP=172.31.79.193
```

### 3. Los servicios automáticamente cargarán las nuevas IPs

```javascript
// No necesitas cambiar nada en tu código
const authService = sharedConfig.getServiceUrl('auth');
// Automáticamente usará la IP actualizada
```

## Validación

Verificar que la configuración sea válida:

```javascript
const sharedConfig = require('../shared-config');

try {
  sharedConfig.validate();
  console.log('✅ Configuración validada');
} catch (err) {
  console.error('❌ Error en configuración:', err.message);
  process.exit(1);
}
```

## Debug

Ver toda la configuración cargada:

```javascript
const sharedConfig = require('../shared-config');
sharedConfig.debug();

// Output:
// 🔍 CONFIGURACIÓN CENTRALIZADA:
// 📍 IPs PRIVADAS:
//   DB: 172.31.79.193
//   CORE: 172.31.78.183
//   Reportes: 172.31.69.133
// 🌐 IPs PÚBLICAS:
//   API Gateway: 52.71.188.181
//   Frontend: 107.21.124.81
// 🔗 URLs:
//   Mongo: mongodb://172.31.79.193:27017
//   Auth: http://172.31.78.183:3000
//   Estudiantes: http://172.31.78.183:3001
```

## Fallback a Localhost

Si `infrastructure.config.js` no está disponible:
- ✅ Automáticamente usará `localhost` para desarrollo
- ✅ Todos los servicios funcionarán en desarrollo sin cambios

```javascript
// En desarrollo (sin infrastructure.config.js)
const mongoUrl = sharedConfig.getMongoUrl();
// → "mongodb://localhost:27017/acompaamiento"

const authService = sharedConfig.getServiceUrl('auth');
// → "http://localhost:3000"
```

## Integración en Dockerfile

Para que funcione en Docker:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar infrastructure.config.js
COPY infrastructure.config.js /app/
COPY shared-config/ /app/shared-config/

# Copiar código del servicio
COPY . .

# Los servicios automáticamente cargarán la config centralizada
CMD ["node", "server.js"]
```

## Pasos de Integración Rápida

1. **En tu microservicio**, reemplaza esto:
   ```javascript
   const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
   ```

   Con esto:
   ```javascript
   const sharedConfig = require('../shared-config');
   const mongoUrl = sharedConfig.getMongoUrl();
   ```

2. **Para servicios internos**, reemplaza:
   ```javascript
   const authUrl = process.env.AUTH_SERVICE || 'http://localhost:3000';
   ```

   Con:
   ```javascript
   const sharedConfig = require('../shared-config');
   const authUrl = sharedConfig.getServiceUrl('auth');
   ```

3. **Listo** - la configuración ahora es centralizada

## Matriz de Compatibilidad

| Servicio | Uso de shared-config | Estado |
|----------|----------------------|--------|
| api-gateway | ✅ | Actualizado |
| micro-auth | ⏳ | Pendiente |
| micro-estudiantes | ⏳ | Pendiente |
| micro-maestros | ⏳ | Pendiente |
| micro-reportes-estudiantes | ⏳ | Pendiente |
| micro-reportes-maestros | ⏳ | Pendiente |
| micro-notificaciones | ⏳ | Pendiente |
| frontend-web | ⏳ | Pendiente |

## Troubleshooting

### "Cannot find module '../shared-config'"
- Asegúrate que estés en la carpeta raíz del proyecto
- O usa la ruta completa: `require('../../shared-config')`

### "infrastructure.config.js not found"
- Esto es normal, automáticamente usará fallbacks
- Comprueba la consola: debe decir "⚠️ No se pudo cargar infrastructure.config.js, usando fallbacks"

### IPs incorrectas en logs
- Ejecuta `sharedConfig.debug()` para verificar
- Comprueba que `infrastructure.config.js` tenga las IPs correctas
- Verifica que las variables de entorno no sobrescriban los valores

## Referencias

- **infrastructure.config.js** - Archivo maestro de configuración
- **shared-config/index.js** - Módulo para acceder a la config
- **AWS_DEPLOYMENT.md** - Documentación de instancias y IPs
