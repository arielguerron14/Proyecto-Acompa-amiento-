# Workflow: Update Instance IPs and Routes

## 📋 Descripción

Este GitHub Actions workflow automatiza la actualización de todas las IPs, rutas y configuraciones del proyecto cuando ejecutas servicios en AWS o desarrollo local.

## 🎯 Funcionalidades

### ✅ Para Entorno LOCAL
- Genera `config/instance_ips.json` con localhost:puerto
- Genera `config/api_routes.json` con rutas localhost
- Perfecto para desarrollo en máquina local

### ✅ Para Entorno PROD (AWS)
- **Descubre automáticamente** todas las instancias EC2 en AWS
- **Mapea instancias EC2** a microservicios por nombre
- **Actualiza IPs públicas** de AWS automáticamente
- **Genera URLs completas** para cada servicio
- **Genera .env.aws** con todas las variables de entorno
- **Incluye databases** (MongoDB, PostgreSQL, Redis)

## 🚀 Cómo Usar

### Opción 1: Desde GitHub Web UI

1. Ve a **Actions** en tu repositorio
2. Selecciona **"Update Instance IPs and Routes for AWS"**
3. Haz clic en **"Run workflow"**
4. Elige el environment:
   - `local` - Para desarrollo local
   - `prod` - Para AWS (requiere credenciales)
5. Haz clic en **"Run workflow"**
6. El workflow se ejecutará y commitará automáticamente

### Opción 2: Desde la CLI

```bash
# Requiere GitHub CLI instalado
gh workflow run update-ips.yml -f environment=local
gh workflow run update-ips.yml -f environment=prod
```

## 🔐 Credenciales Necesarias (para prod)

Para que el workflow acceda a AWS, debes configurar estos secrets en GitHub:

```
AWS_ACCESS_KEY_ID        # Tu AWS Access Key
AWS_SECRET_ACCESS_KEY    # Tu AWS Secret Key
AWS_SESSION_TOKEN        # (Opcional) Token de sesión temporal
```

**Cómo agregar secrets:**
1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Haz clic en **New repository secret**
3. Agrega cada secret con su valor

## 📊 Qué Se Actualiza

### Archivos Generados/Actualizados

#### `config/instance_ips.json`
Mapeo de servicios a hosts e IPs:

```json
{
  "api-gateway": {
    "host": "52.123.45.67",
    "private_ip": "10.0.1.100",
    "port": 8080,
    "protocol": "http",
    "url": "http://52.123.45.67:8080",
    "instance_id": "i-0abc123",
    "instance_type": "t3.medium"
  },
  "micro-auth": {
    "host": "52.123.45.68",
    "port": 3000,
    "protocol": "http",
    "url": "http://52.123.45.68:3000"
  }
  // ... más servicios
}
```

#### `config/api_routes.json`
Rutas y endpoints completos:

```json
{
  "environment": "prod",
  "updated_at": "2026-01-20T14:30:00",
  "services": {
    "auth": {
      "baseUrl": "http://52.123.45.68:3000",
      "routes": {
        "register": "/auth/register",
        "login": "/auth/login",
        "verify": "/auth/verify-token"
        // ... más rutas
      }
    },
    "estudiantes": {
      "baseUrl": "http://52.123.45.69:3001",
      "routes": {
        "create": "/estudiantes/create",
        "list": "/estudiantes"
        // ... más rutas
      }
    }
    // ... más servicios
  },
  "databases": {
    "mongodb": { "host": "52.123.45.70", "port": 27017 },
    "postgresql": { "host": "52.123.45.71", "port": 5432 },
    "redis": { "host": "52.123.45.72", "port": 6379 }
  }
}
```

#### `.env.aws` (solo para prod)
Variables de entorno para AWS:

```bash
NODE_ENV=production
ENVIRONMENT=prod

API_GATEWAY_URL=http://52.123.45.67:8080
API_GATEWAY_HOST=52.123.45.67
API_GATEWAY_PORT=8080

MICRO_AUTH_URL=http://52.123.45.68:3000
MICRO_ESTUDIANTES_URL=http://52.123.45.69:3001
MICRO_MAESTROS_URL=http://52.123.45.70:3002

MONGODB_HOST=52.123.45.71
MONGODB_PORT=27017
MONGODB_URL=mongodb://52.123.45.71:27017/acompanamiento

POSTGRES_HOST=52.123.45.72
POSTGRES_PORT=5432

REDIS_HOST=52.123.45.73
REDIS_PORT=6379
```

## 🏷️ Mapeo de Instancias EC2

El workflow busca instancias con estos nombres en AWS:

| EC2 Name Tag | Servicio | Puerto |
|---|---|---|
| `EC2-APIGateway` | api-gateway | 8080 |
| `EC2-Auth` | micro-auth | 3000 |
| `EC2-Estudiantes` | micro-estudiantes | 3001 |
| `EC2-Maestros` | micro-maestros | 3002 |
| `EC2-Analytics` | micro-analytics | 5007 |
| `EC2-Notificaciones` | micro-notificaciones | 5006 |
| `EC2-ReportesEstudiantes` | micro-reportes-estudiantes | 5003 |
| `EC2-ReportesMaestros` | micro-reportes-maestros | 5004 |
| `EC2-SoapBridge` | micro-soap-bridge | 5008 |
| `EC2-MongoDB` | mongo | 27017 |
| `EC2-PostgreSQL` | postgres | 5432 |
| `EC2-Redis` | redis | 6379 |

**⚠️ Importante:** Asegúrate de que tus instancias EC2 en AWS tengan estos **Name tags** exactamente.

## 🔄 Flujo de Ejecución

```
┌─ Trigger workflow (local o prod)
├─ Checkout código
├─ Setup Python + boto3
│
├─ Si LOCAL:
│  └─ Generar config con localhost:puertos
│
└─ Si PROD (AWS):
   ├─ Conectar a AWS con credenciales
   ├─ Listar todas las instancias EC2 running
   ├─ Mapear instancias a servicios por Name tag
   ├─ Extraer IPs públicas/privadas
   ├─ Generar URLs (http://IP:PUERTO)
   └─ Generar .env.aws
│
├─ Actualizar instance_ips.json con URLs
├─ Actualizar api_routes.json con baseUrls
├─ Git add, commit y push a main
└─ ✅ Listo para usar
```

## 📝 Logs y Debugging

Puedes ver los logs del workflow:

1. Ve a **Actions** en GitHub
2. Selecciona el último run del workflow
3. Haz clic en el job para ver detalles
4. Busca problemas comunes:

### Errores Comunes

**❌ "AWS credentials not valid"**
- Verifica que AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY estén correctos
- Las credenciales pueden haberse expirado

**❌ "Instances not found"**
- Las instancias EC2 en AWS no tienen los Name tags correctos
- Verifica que estén con el formato `EC2-NombreServicio`

**❌ "No changes to commit"**
- Las IPs no han cambiado desde la última ejecución
- Esto es normal si todo está actualizado

## ✅ Post-Ejecución

Después que el workflow termina:

1. **Verifica los archivos actualizados:**
   ```bash
   cat config/instance_ips.json
   cat config/api_routes.json
   cat .env.aws  # (si fue prod)
   ```

2. **Usa las URLs en tu código:**
   ```javascript
   const config = require('./config/api_routes.json');
   const authUrl = config.services.auth.baseUrl;
   // http://52.123.45.68:3000
   ```

3. **Para aplicaciones que usan .env:**
   ```bash
   # Copiar configuración a .env local
   cp .env.aws .env
   source .env
   ```

## 🔄 Automatización (Opcional)

Para ejecutar este workflow automáticamente cada cierto tiempo:

**Opción 1: Cada hora**
```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
```

**Opción 2: Diariamente a las 8 AM**
```yaml
on:
  schedule:
    - cron: '0 8 * * *'  # Todos los días a las 8 AM UTC
```

Edita `.github/workflows/update-ips.yml` en el bloque `on:` para agregar esto.

## 📚 Recursos Relacionados

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AWS EC2 Docs](https://docs.aws.amazon.com/ec2/)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del workflow en GitHub Actions
2. Verifica que los secrets están configurados
3. Confirma que los Name tags en EC2 son exactos
4. Revisa que las credenciales de AWS son válidas
5. Asegúrate de que las instancias estén en estado "running"

---

**Última actualización:** 20 Enero 2026
**Versión:** 2.0 (AWS-ready)
