# Redis Session Store Integration

Este documento describe la integración de Redis con el sistema de caché de sesiones en `micro-auth`.

## Overview

El sistema de autenticación ahora soporta Redis como almacén de sesiones persistente. Si Redis no está disponible, el sistema automáticamente usa un fallback a caché en memoria (Map).

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   API Request                            │
│              (login, logout, verify)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │   authController      │
           │  (async handlers)     │
           └──────────┬────────────┘
                      │
                      ▼
           ┌───────────────────────┐
           │   tokenCache.js       │
           │  (cache abstraction)  │
           └──────────┬────────────┘
                      │
              ┌───────┴────────┐
              │                │
              ▼                ▼
         ┌─────────┐      ┌──────────┐
         │  Redis  │      │  Map     │
         │ (async) │      │(in-mem)  │
         └─────────┘      └──────────┘
```

## Features

- **Persistent Sessions**: Redis mantiene sesiones incluso después de reinicios del servicio
- **Distributed Architecture**: Múltiples instancias de `micro-auth` pueden compartir sesiones
- **Automatic Fallback**: Si Redis no está disponible, funciona con caché en memoria
- **TTL Management**: Sesiones automáticamente se expiran después de 7 días (configurable)
- **Graceful Degradation**: El sistema no falla si Redis no está disponible

## Configuration

### Environment Variables

```bash
# Redis connection settings (optional)
REDIS_HOST=localhost              # Default: localhost
REDIS_PORT=6379                   # Default: 6379
REDIS_PASSWORD=                   # Default: empty (no auth)
REDIS_DB=0                        # Default: 0

# Session expiry (default: 7 days, matches REFRESH_TOKEN_EXPIRY)
# Note: Token expiry is configured via ACCESS_TOKEN_EXPIRY and REFRESH_TOKEN_EXPIRY
```

### Development (Local)

1. **Without Redis** (uses in-memory fallback):
```bash
cd micro-auth
npm install
npm start
```

2. **With Redis** (local Docker container):
```bash
# Start Redis container
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Then start the service
cd micro-auth
npm start
```

### Production (Docker Compose)

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - REQUIREPASS=your-strong-password

  micro-auth:
    build: ./micro-auth
    depends_on:
      - redis
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=your-strong-password
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_SECRET=${REFRESH_SECRET}
    ports:
      - "5005:5005"

volumes:
  redis_data:
```

### Kubernetes

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: redis-credentials
type: Opaque
stringData:
  password: your-strong-password

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: micro-auth-config
data:
  REDIS_HOST: redis-service
  REDIS_PORT: "6379"
  REDIS_DB: "0"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: micro-auth
spec:
  replicas: 3  # Multiple instances share Redis sessions
  template:
    spec:
      containers:
      - name: micro-auth
        image: micro-auth:latest
        env:
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: micro-auth-config
              key: REDIS_HOST
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: jwt-secret
        - name: REFRESH_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secrets
              key: refresh-secret
```

## How It Works

### Token Cache Operations

1. **Login** (`set`):
   - Token se almacena en Redis con TTL de 7 días
   - Si Redis falla, se usa Map en memoria

2. **Verify** (`get`):
   - Primero verifica JWT signature
   - Luego confirma que el token está en caché (Redis o Map)
   - Si no está en caché, retorna 401

3. **Logout** (`delete`):
   - Remueve el token del caché (Redis o Map)
   - Token expira inmediatamente

4. **Fallback**:
   - Si Redis tiene error, automáticamente usa Map
   - Si Redis se recupera, no migra sesiones existentes

## Performance

### Redis (Recommended for Production)

- **Read/Write**: ~1-2ms per operation
- **Memory Usage**: ~1KB per session token
- **Max Sessions**: Limitado solo por memoria Redis
- **Persistence**: Optional (snapshots y AOF)

### In-Memory Map (Development)

- **Read/Write**: <0.1ms per operation
- **Memory Usage**: ~1KB per session token
- **Max Sessions**: Limitado por RAM del proceso Node
- **Persistence**: Se pierden al reiniciar

## Security Best Practices

1. **Redis Password**:
   - Usar contraseña fuerte en producción
   - Cambiar `requirepass` en redis.conf
   ```bash
   # Generate strong password
   openssl rand -base64 32
   ```

2. **Network Security**:
   - Redis debería estar en private network, no expuesto públicamente
   - Si es remoto, usar SSH tunnel o VPN

3. **Data Encryption**:
   - Usar Redis 6+ con ACLs (Access Control Lists)
   - Configurar SSL/TLS en redis.conf (Redis 6+)

4. **Monitoring**:
   - Monitorear uso de memoria de Redis
   - Configurar alertas si memoria es crítica
   - Revisar logs de acceso

## Troubleshooting

### Redis Connection Fails

```
INFO: Redis not available, using in-memory session cache
```

**Causas posibles**:
- Redis no está corriendo: `redis-cli ping`
- Credenciales incorrectas
- Host/puerto incorrecto
- Firewall bloqueando conexión

**Solución**:
```bash
# Verificar Redis está corriendo
redis-cli ping  # Debe retornar PONG

# Verificar conexión
redis-cli -h <REDIS_HOST> -p <REDIS_PORT> -a <REDIS_PASSWORD> ping
```

### Sessions Lost After Restart

Si estás usando Map en memoria (no Redis), las sesiones se pierden al reiniciar. Solución: Configurar Redis.

### Memory Issues

```bash
# Check Redis memory usage
redis-cli INFO memory

# Clear old sessions (if needed)
redis-cli KEYS "session:token:*" | xargs redis-cli DEL
```

### Performance Issues

```bash
# Monitor Redis
redis-cli MONITOR

# Check slow queries
redis-cli CONFIG GET slowlog*
```

## Testing

### Test con Redis disponible

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Run tests
npm test

# Check logs
docker logs <redis-container-id>
```

### Test sin Redis (fallback)

```bash
# Kill Redis if running
docker kill <redis-container-id> || true

# Run tests (usará Map en memoria)
npm test
```

## Migration Guide

Si necesitas migrar de Map en memoria a Redis en producción:

1. Instalar Redis (recomendado en separate server/pod)
2. Configurar variables de entorno
3. Hacer rolling update de `micro-auth`:
   ```bash
   # Instancia 1: actualizar con REDIS_HOST
   # Esperar conexión
   # Instancia 2: actualizar con REDIS_HOST
   # Esperar conexión
   # etc.
   ```
4. Las sesiones existentes en Map se mantendrán hasta logout/refresh
5. Las nuevas sesiones irán a Redis

## Monitoring & Maintenance

### Redis Monitoring

```bash
# Monitor keys in real-time
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory

# List all session keys
redis-cli KEYS "session:token:*" | wc -l

# Get TTL of a token
redis-cli TTL "session:token:<token>"
```

### Backup & Restore

```bash
# Backup Redis data
redis-cli BGSAVE

# Copy RDB file
docker cp redis:/data/dump.rdb ./redis-backup.rdb

# Restore
docker cp ./redis-backup.rdb redis:/data/dump.rdb
```

## Related Documentation

- [ENVIRONMENT.md](./ENVIRONMENT.md) - JWT secrets configuration
- [micro-auth README](./micro-auth/README.md) - Service details
- [Redis Documentation](https://redis.io/docs/) - Official Redis docs
