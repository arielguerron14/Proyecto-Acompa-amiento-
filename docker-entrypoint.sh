#!/bin/bash

# Entrypoint script para servicios - inyecta configuración centralizada
# Se ejecuta antes de iniciar el servicio en cada contenedor

set -e

echo "🔧 [Entrypoint] Inicializando servicio con configuración centralizada..."

# 1. Generar configuración de infraestructura (si exista infrastructure.config.js)
if [ -f "/usr/src/infrastructure.config.js" ]; then
  echo "📝 [Entrypoint] Generando .env.local desde infrastructure.config.js..."
  cd /usr/src
  node scripts/gen-config.js all 2>/dev/null || true
  echo "✅ [Entrypoint] Configuración inyectada"
else
  echo "ℹ️  [Entrypoint] infrastructure.config.js no encontrado, usando variables de entorno existentes"
fi

# 2. Validar que las variables críticas estén configuradas
if [ -z "$MONGO_URI" ] && [ -z "$DB_HOST" ]; then
  export DB_HOST="mongo"
  echo "⚙️  [Entrypoint] MONGO_URI no configurado, usando DB_HOST=mongo como fallback"
fi

# 3. Log de variables críticas para debug
if [ "$DEBUG" = "true" ]; then
  echo "🔍 [Entrypoint] Variables configuradas:"
  echo "   - MONGO_URI: ${MONGO_URI:-no configurado}"
  echo "   - DB_HOST: ${DB_HOST:-no configurado}"
  echo "   - AUTH_SERVICE: ${AUTH_SERVICE:-no configurado}"
  echo "   - PORT: ${PORT:-no configurado}"
fi

echo "✅ [Entrypoint] Listo para iniciar servicio"

# 4. Ejecutar el comando original
exec "$@"
