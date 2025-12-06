# Environment Variables Configuration

Este documento explica cómo configurar variables de entorno para los servicios del proyecto.

## Overview

Todos los servicios usan variables de entorno para configuración sensible (secretos JWT, puertos, URLs de servicios, etc.). Esto permite diferentes configuraciones para desarrollo, testing y producción sin cambiar el código.

## Archivos .env.example

Cada servicio incluye un archivo `.env.example` que documenta las variables disponibles:

- `micro-auth/.env.example` - Configuración del servicio de autenticación
- `api-gateway/.env.example` - Configuración del gateway API
- `shared-auth/.env.example` - Configuración compartida de auth

## Variables Críticas

### JWT_SECRET
- **Descripción**: Secreto usado para firmar y verificar tokens de acceso (access tokens)
- **Valor por defecto (DEV)**: `dev-jwt-secret`
- **Recomendación (PROD)**: Usar un secreto aleatorio de al menos 32 caracteres
- **Generación**:
  ```powershell
  # En PowerShell
  [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()))
  ```

### REFRESH_SECRET
- **Descripción**: Secreto usado para firmar y verificar refresh tokens
- **Valor por defecto (DEV)**: `dev-refresh-secret`
- **Recomendación (PROD)**: Usar un secreto aleatorio de al menos 32 caracteres (diferente a JWT_SECRET)
- **Generación**: Ver JWT_SECRET arriba

## Configuración por Entorno

### Desarrollo (LOCAL)

1. Copiar archivos `.env.example` a `.env` (solo en local, no commitear `.env`):
```powershell
Copy-Item 'micro-auth\.env.example' 'micro-auth\.env'
Copy-Item 'api-gateway\.env.example' 'api-gateway\.env'
```

2. (Opcional) Editar `.env` si quieres cambiar valores por defecto

3. Arrancar servicios:
```powershell
cd micro-auth
npm install
npm start

# En otra consola
cd api-gateway
npm install
npm start
```

Los valores por defecto para DEV son seguros para testing local.

### Producción (DEPLOYMENT)

1. **Generar secretos fuertes**:
```powershell
# Generar un secreto de 64 caracteres
$secret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid + (New-Guid).Guid))
Write-Output $secret
```

2. **Configurar variables en tu plataforma de deployment**:
   - **Docker**: Usar `docker run -e JWT_SECRET=<value> ...` o Docker Compose `.env`
   - **Kubernetes**: Usar Secrets (`kubectl create secret generic jwt-secrets --from-literal=JWT_SECRET=<value>`)
   - **Heroku/Cloud**: Dashboard → Settings → Config Vars
   - **Node.js directo**: Exportar en shell `export JWT_SECRET=<value>`

3. **Asegurarse de**:
   - JWT_SECRET ≠ REFRESH_SECRET
   - Secretos de al menos 32 caracteres
   - No guardar `.env` en repositorio (ya está en `.gitignore`)
   - Rotar secretos periódicamente en producción

## Token Expiry

- `ACCESS_TOKEN_EXPIRY`: Tiempo de validez del access token (default: 15m)
- `REFRESH_TOKEN_EXPIRY`: Tiempo de validez del refresh token (default: 7d)

Cambiar estos si quieres ajustar la duración de sesiones.

## Testing

El script de integración `run-test-simple.ps1` usa los valores por defecto de DEV. Para testing con env vars específicos:

```powershell
$env:JWT_SECRET='test-secret-123'
$env:REFRESH_SECRET='test-refresh-456'
powershell -NoProfile -ExecutionPolicy Bypass -File run-test-simple.ps1
```

## Troubleshooting

**"Token not valid" después de cambiar JWT_SECRET**:
- Los tokens emitidos con el secreto viejo no serán válidos con el nuevo
- Solución: Hacer logout, login nuevamente

**Servicios no se comunican correctamente**:
- Verificar que JWT_SECRET y REFRESH_SECRET sean iguales en todos los servicios
- Verificar que los URLs de servicio sean correctos en `api-gateway/.env`

**Logs confusos sobre tokens**:
- Aumentar `LOG_LEVEL=debug` para más detalles (default: `info`)
