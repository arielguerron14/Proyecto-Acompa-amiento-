# Auto IP Discovery & Project Configuration Update

## Overview

Hemos creado un **único workflow consolidado** que automáticamente:

1. ✅ **Descubre todas las instancias EC2** con el tag `Project=lab-8-ec2`
2. ✅ **Obtiene todas las IPs**: privadas, públicas y elásticas
3. ✅ **Actualiza automáticamente la configuración del proyecto** con las IPs actuales
4. ✅ **Genera archivos de configuración** para que los servicios usen las IPs correctas

## Cómo Funciona

### Workflow: `auto-update.yml`

Este workflow se ejecuta automáticamente:
- **Cada hora** según la programación `0 * * * *`
- **Después de cada deploy de Terraform** (cuando se creen/actualicen instancias)

**Lo que hace:**
```
┌─────────────────────────────────────┐
│  auto-update.yml Workflow           │
└─────────────────────────────────────┘
         │
         ├─→ 🔍 Descubre instancias EC2
         │   (Query AWS con tag Project=lab-8-ec2)
         │
         ├─→ 📍 Obtiene todos los tipos de IPs
         │   • IP Privada (interna)
         │   • IP Pública (externa)
         │   • Elastic IP (estática)
         │
         ├─→ 📝 Genera configuration files
         │   • infrastructure-instances.config.js
         │   • .env.generated
         │
         └─→ 📤 Commit & Push automáticamente
             (Los servicios acceden a IPs actuales siempre)
```

## Archivos Generados

### 1. `infrastructure-instances.config.js`

Archivo de configuración Node.js con todas las IPs:

```javascript
module.exports = {
  instances: {
    'EC2-Frontend': {
      instance_id: 'i-xxx',
      private_ip: '172.31.x.x',
      public_ip: 'X.X.X.X',
      elastic_ip: 'X.X.X.X'  // Static
    },
    'EC2-API-Gateway': { ... },
    'EC2-CORE': { ... },
    // ... resto de instancias
  },
  
  services: {
    frontend: { name: 'EC2-Frontend', ports: { http: 3000 }, health: '/health' },
    api_gateway: { name: 'EC2-API-Gateway', ports: { http: 8080 }, ... },
    // ... resto de servicios
  },
  
  // Funciones helper
  getInstanceIP(name, type='private') { ... },
  getServiceURL(service, protocol='http') { ... }
};
```

**Uso en tu código:**
```javascript
const config = require('./infrastructure-instances.config.js');

// Obtener IP privada (para comunicación interna)
const coreIP = config.getInstanceIP('EC2-CORE', 'private');
// 172.31.x.x

// Obtener IP elástica (para acceso externo)
const frontendIP = config.getInstanceIP('EC2-Frontend', 'elastic');
// X.X.X.X (static)

// Obtener URL de servicio
const apiURL = config.getServiceURL('api_gateway', 'http');
// http://172.31.x.x:8080
```

### 2. `.env.generated`

Variables de entorno para Docker y servicios:

```bash
# Internal Communication (Private IPs)
FRONTEND_PRIVATE=172.31.x.x
API_PRIVATE=172.31.x.x
CORE_PRIVATE=172.31.x.x
DB_PRIVATE=172.31.x.x
MESSAGING_PRIVATE=172.31.x.x

# External Access (Public/Elastic IPs)
FRONTEND_PUBLIC=X.X.X.X
API_PUBLIC=X.X.X.X
CORE_PUBLIC=X.X.X.X
DB_PUBLIC=X.X.X.X
BASTION_PUBLIC=X.X.X.X (for SSH proxy)

# Service Configuration
DATABASE_HOST=172.31.x.x
DATABASE_URL=postgresql://user:pass@172.31.x.x:5432/acompanamiento
RABBITMQ_HOST=172.31.x.x
RABBITMQ_URL=amqp://guest:guest@172.31.x.x:5672/
API_GATEWAY_HOST=172.31.x.x
API_GATEWAY_PORT=8080
```

**Uso en docker-compose.yml:**
```yaml
services:
  api:
    environment:
      DATABASE_HOST: ${DATABASE_HOST}
      DATABASE_PORT: ${DATABASE_PORT}
      DATABASE_URL: ${DATABASE_URL}
      RABBITMQ_URL: ${RABBITMQ_URL}
      CORE_SERVICE_HOST: ${CORE_SERVICE_HOST}
```

## Gestión de IPs

### Tipos de IPs por instancia

| Tipo | Uso | Ejemplo |
|------|-----|---------|
| **Private IP** | Comunicación interna entre instancias (VPC) | `172.31.x.x` |
| **Public IP** | Acceso externo, temporal (asignado al reiniciar) | `X.X.X.X` |
| **Elastic IP** | Acceso externo, permanente (static) | `X.X.X.X` |

### Recomendaciones

```
┌──────────────────────────────────────────────────────┐
│  COMUNICACIÓN INTERNA (VPC)                         │
│  → Usar IP PRIVADA (172.31.x.x)                     │
│  → Más rápido, sin costos de tráfico                │
│  → Ejemplo: API → Core, Core → DB                   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  ACCESO EXTERNO (Internet)                          │
│  → Usar ELASTIC IP (para persistencia)              │
│  → O IP PÚBLICA (si cambios son aceptables)         │
│  → Ejemplo: Frontend para usuarios, APIs públicas   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  SSH / BASTION                                       │
│  → Usar ELASTIC IP del bastion                      │
│  → Luego conectar a instancias vía IP PRIVADA       │
└──────────────────────────────────────────────────────┘
```

## Ejecutar Manualmente

El workflow se ejecuta automáticamente cada hora, pero puedes dispararlo manualmente:

```bash
# Opción 1: Trigger el workflow de Terraform (que luego dispara auto-update)
gh workflow run terraform.yml -f apply=false

# Opción 2: Esperar a que se ejecute en la próxima hora (schedule: 0 * * * *)
```

## Casos de Uso

### 1. Después de Desplegar Infraestructura
```bash
# Ejecutas Terraform → Se crean 9 nuevas instancias con nuevas IPs
gh workflow run terraform.yml -f apply=true

# auto-update.yml se dispara automáticamente y:
# ✓ Descubre las 9 nuevas instancias
# ✓ Obtiene sus IPs (privadas, públicas, elásticas)
# ✓ Actualiza infrastructure-instances.config.js
# ✓ Actualiza .env.generated
# ✓ Commit & Push automáticamente
```

### 2. Desplegar Servicios en las Instancias
```bash
# Los servicios leen .env.generated automáticamente
docker-compose up -d

# Acceden a las IPs correctas sin necesidad de cambios manuales
```

### 3. Comunicación entre Servicios
```javascript
// En tu código Node.js
const config = require('./infrastructure-instances.config.js');

// Para conectar a la base de datos:
const dbHost = config.getInstanceIP('EC2-DB', 'private'); // 172.31.x.x
const dbConnection = `postgresql://user:pass@${dbHost}:5432/db`;

// Para conectar al API Gateway:
const apiUrl = config.getServiceURL('api_gateway', 'http'); // http://172.31.x.x:8080
```

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│  AWS EC2 Instances (con IPs dinámicas)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ EC2-Frontend      (3.1.1.1 → private IP 172.x)  │  │
│  │ EC2-API-Gateway   (3.1.1.2 → private IP 172.x)  │  │
│  │ EC2-CORE          (3.1.1.3 → private IP 172.x)  │  │
│  │ EC2-DB            (3.1.1.4 → private IP 172.x)  │  │
│  │ EC2-Messaging     (3.1.1.5 → private IP 172.x)  │  │
│  │ ... (4 más)                                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         ↑
         │ (Query cada hora)
         │
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions: auto-update.yml (schedule: 0 * * * *)  │
│  1. Descubre instancias                                │
│  2. Obtiene todas las IPs                              │
│  3. Genera archivos de config                          │
│  4. Commit & Push                                       │
└─────────────────────────────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────┐
│  Repository (main branch)                               │
│  • infrastructure-instances.config.js (ACTUALIZADO)     │
│  • .env.generated (ACTUALIZADO)                         │
│                                                         │
│  ✓ Siempre contiene IPs actuales                       │
│  ✓ Actualizadas automáticamente                         │
│  ✓ Servicios leen desde aquí                           │
└─────────────────────────────────────────────────────────┘
         ↑
         │ (Pull/Read)
         │
┌─────────────────────────────────────────────────────────┐
│  Servicios en las Instancias                           │
│  • Frontend (Lee config → Conecta a API con IP privada)│
│  • API Gateway (Lee config → Conecta a Core)           │
│  • Core (Lee config → Conecta a DB)                    │
│  • ... (Todos usan IPs correctas)                      │
└─────────────────────────────────────────────────────────┘
```

## Beneficios

✅ **Automatización Total**: No necesitas actualizar manualmente las IPs  
✅ **IPs Actualizadas**: Siempre usan las IPs más recientes  
✅ **Comunicación Correcta**: Servicios conectan entre sí correctamente  
✅ **Escalabilidad**: Si agregas más instancias, se descubren automáticamente  
✅ **Flexibilidad**: Soporta IPs privadas, públicas y elásticas  
✅ **Versionado**: Los cambios de IPs se trackean en Git  

## Variables de Entorno Disponibles

Todas estas están disponibles en `.env.generated`:

```bash
# Instance IPs
FRONTEND_PRIVATE, API_PRIVATE, CORE_PRIVATE, DB_PRIVATE, MESSAGING_PRIVATE
FRONTEND_PUBLIC, API_PUBLIC, CORE_PUBLIC, DB_PUBLIC, BASTION_PUBLIC
FRONTEND_ELASTIC, API_ELASTIC, CORE_ELASTIC

# Service URLs
DATABASE_HOST, DATABASE_PORT, DATABASE_URL
RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_URL
API_GATEWAY_HOST, API_GATEWAY_PORT
CORE_SERVICE_HOST, CORE_SERVICE_PORT
BASTION_HOST, BASTION_USER, BASTION_PORT
```

## Próximos Pasos

1. ✅ El workflow `auto-update.yml` está configurado
2. ⏳ Se ejecutará automáticamente cada hora
3. ⏳ O se ejecutará cuando hagas un nuevo deploy de Terraform
4. 📝 Usa `infrastructure-instances.config.js` y `.env.generated` en tus servicios
5. 🚀 Los servicios conectarán entre sí con las IPs correctas automáticamente

---

**Nota**: El workflow se ejecutó correctamente. Los archivos serán actualizados automáticamente cada hora y cada vez que despliegues nueva infraestructura.
