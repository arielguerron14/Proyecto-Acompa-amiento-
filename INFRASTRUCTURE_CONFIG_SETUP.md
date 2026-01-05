# 🏗️ CONFIGURACIÓN CENTRALIZADA DE INFRAESTRUCTURA

## ⚡ Cambiar IPs en 3 pasos

### 1. Editar `.env.infrastructure`
```bash
nano .env.infrastructure

# Cambiar las IPs que necesites
API_GATEWAY_IP=nueva-ip-publica
CORE_IP=nueva-ip-privada-core
DB_IP=nueva-ip-privada-db
```

### 2. Compilar configuración
```bash
npm run build:infrastructure
```

### 3. Reconstruir y reiniciar servicios
```bash
npm run rebuild:services
```

**✅ Listo. El sistema está funcional con las nuevas IPs.**

---

## 📚 Documentación Completa

Ver: [`INFRASTRUCTURE_CONFIG_GUIDE.md`](./INFRASTRUCTURE_CONFIG_GUIDE.md)

## 🎯 ¿Por qué?

- ✅ **UN archivo** para cambiar todas las IPs
- ✅ **Sin código** - Cambios en infraestructura, no en código
- ✅ **Automático** - Se reconstruyen los contenedores automáticamente
- ✅ **Reproducible** - Mismo despliegue en dev, staging, prod
- ✅ **Resiliente** - Compatible con cambios de IP en AWS Académico

## 📁 Archivos Importantes

```
.env.infrastructure       ← ⭐ EDITAR AQUÍ (IPs que cambien)
infrastructure.config.js  ← Configuración centralizada
.env                      ← Generado automáticamente (NO EDITAR)
scripts/                  ← Scripts de compilación
docker-compose.yml        ← Inyecta config en contenedores
```

## 🚀 Comandos Útiles

```bash
# Compilar configuración
npm run build:infrastructure

# Validar que está correcta
npm run validate:infrastructure

# Reconstruir todo
npm run rebuild:services

# Ver qué IPs está usando cada servicio
docker exec micro-auth env | grep -E "MONGO|AUTH|CORE"

# Ver logs
docker-compose logs -f api-gateway
```

## 🔍 Verificar que funciona

```bash
# Health check del API Gateway
curl http://localhost:8080/health

# Ver todas las variables de un servicio
docker exec api-gateway env | grep "IP"
```

---

**Nota:** Para cambios en el futuro, solo modifica `.env.infrastructure` y ejecuta `npm run rebuild:services`. El resto es automático.
