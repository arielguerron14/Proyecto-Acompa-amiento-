# 🚀 GUÍA RÁPIDA - Cambiar IPs del Proyecto

**Tiempo**: 15 minutos | **Dificultad**: Fácil | **Riesgo**: Bajo

---

## 1️⃣ Editar Configuración

Abre el archivo `.env.infrastructure` y actualiza solo las IPs que cambiaron:

```bash
# Ejemplo: AWS cambió las IPs
CORE_IP=13.223.196.229              ← Cambiar esto si cambió
DB_IP=13.220.99.207                 ← Cambiar esto si cambió
API_GATEWAY_IP=100.48.66.29         ← Cambiar esto si cambió
FRONTEND_IP=44.210.134.93           ← Cambiar esto si cambió
NOTIFICACIONES_IP=100.28.217.159    ← Cambiar esto si cambió
```

---

## 2️⃣ Compilar Configuración

```bash
npm run build:infrastructure
```

**Resultado esperado**:
```
✅ CONFIGURATION COMPILED SUCCESSFULLY
Generated .env from .env.infrastructure
...
API Gateway:    100.48.66.29:8080
Frontend:       44.210.134.93:80
...
```

---

## 3️⃣ Validar Cambios

```bash
npm run validate:infrastructure
```

**Resultado esperado**:
```
✅ VALIDACIÓN EXITOSA
✅ infrastructure.config.js válido
✅ .env contiene configuración generada
✅ Todos los servicios usando variables de entorno
```

---

## 4️⃣ Reconstruir Servicios

```bash
npm run rebuild:services
```

**O si prefieres paso a paso**:
```bash
npm run build:infrastructure  # Compile config
npm run validate:infrastructure # Validate
docker-compose up -d --build  # Rebuild containers
```

---

## ✅ Verificación Final

Una vez completado, verifica que los servicios estén corriendo:

```bash
# Ver logs
docker-compose logs -f micro-auth

# Probar conexión
curl http://API_GATEWAY_IP:8080/health
```

---

## ❓ Problemas Comunes

**P: ¿Qué archivo edito?**
R: Solo `.env.infrastructure` - Los demás archivos se generan automáticamente.

**P: ¿Necesito cambiar código?**
R: NO - La configuración está centralizada. Solo edita `.env.infrastructure`.

**P: ¿Qué pasa con los contenedores antiguos?**
R: Se recrean automáticamente cuando ejecutas `npm run rebuild:services`.

**P: ¿Cómo sé si funcionó?**
R: Ejecuta `npm run validate:infrastructure` - Si muestra ✅ VALIDACIÓN EXITOSA, está bien.

---

## 📞 Referencia de Archivos

| Archivo | Propósito |
|---------|-----------|
| `.env.infrastructure` | EDITAR AQUÍ cuando cambien IPs |
| `infrastructure.config.js` | NO EDITAR - Configuración central |
| `.env` | AUTO-GENERADO - No editar |
| `PROCEDIMIENTO_CAMBIAR_IPS.md` | Guía detallada con screenshots |

---

## 🎯 Resumen

1. Edita `.env.infrastructure`
2. Corre `npm run build:infrastructure`
3. Corre `npm run validate:infrastructure`
4. Corre `npm run rebuild:services`
5. Listo ✅

**Eso es todo. Completado en 15 minutos.**
