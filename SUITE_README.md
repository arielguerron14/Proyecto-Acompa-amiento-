# 🚀 Deploy & Validate Suite

## Descripción Rápida

Suite completa de **deployment, monitoreo y debugging** para todas las instancias EC2 del proyecto. Todo integrado en un único flujo de trabajo.

## 🎯 Comienza Aquí

```powershell
# Opción 1: Menú interactivo (RECOMENDADO)
.\INDEX.ps1

# Opción 2: Menú con más opciones
.\suite.ps1

# Opción 3: Deploy directo
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE"
```

## ✨ Características

### 1️⃣ Deploy Completo
- ✅ Rebuild automático de imagen Docker
- ✅ Upload de configuración centralizada (.env.prod.*)
- ✅ Inicio automático de contenedor
- ✅ Validación de logs iniciales

### 2️⃣ Monitoreo en Tiempo Real
- ✅ Ver logs del contenedor en vivo
- ✅ Probar todos los endpoints
- ✅ Verificar conectividad de red
- ✅ Métricas de CPU/Memoria

### 3️⃣ Diagnóstico Completo
- ✅ 9 fases de verificación
- ✅ Detección automática de problemas
- ✅ Reporte JSON generado
- ✅ Recomendaciones automáticas

### 4️⃣ Orquestación Masiva
- ✅ Deploy a múltiples instancias
- ✅ Orden crítico automático
- ✅ Modo paralelo o secuencial
- ✅ Reportes de ejecución

## 📦 Archivos de la Suite

```
Deploy & Validate Suite
├── INDEX.ps1                      ← COMIENZA AQUÍ
├── suite.ps1                      ← Menú interactivo
├── deploy-and-validate.ps1        ← Orquestador principal
├── deploy-complete.ps1            ← Deploy + validación
├── post-deploy-monitor.ps1        ← Monitoreo en vivo
├── debug-post-deployment.ps1      ← Diagnóstico
├── DEPLOY_AND_VALIDATE_SUITE.md   ← Documentación completa
├── DEPLOY_VALIDATE_SUMMARY.md     ← Resumen
└── README.md                       ← Este archivo
```

## 🚀 Uso Rápido

### Deploy Nueva Instancia

```powershell
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE"
```

**Qué hace:**
1. Deploy de instancia con rebuild Docker
2. Prueba de endpoints HTTP
3. Diagnóstico completo
4. Reporte final

**Duración:** 8-20 minutos

### Ver Logs en Vivo

```powershell
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -FollowLogs
```

Presiona `Ctrl+C` para salir.

### Diagnosticar Problema

```powershell
.\debug-post-deployment.ps1 -InstanceName "EC2_DB"
```

Genera: `debug-report-EC2_DB-TIMESTAMP.json`

### Deploy Múltiple

```powershell
# Todas las instancias
.\deploy-orchestrator.ps1

# O desde menú interactivo
.\suite.ps1
```

## 🎯 Instancias Soportadas

```
✅ EC2_CORE              Servidor central
✅ EC2_DB                Bases de datos
✅ EC2_API_GATEWAY       API Gateway
✅ EC2_AUTH              Autenticación
✅ EC2_ESTUDIANTES       Microservicio
✅ EC2_MAESTROS          Microservicio
✅ EC2_MESSAGING         Mensajería
✅ EC2_NOTIFICACIONES    Notificaciones
✅ EC2_REPORTES          Reportes
✅ EC2_SOAP_BRIDGE       Integraciones
✅ EC2_MONITORING        Monitoreo
✅ EC2_KAFKA             Broker Kafka
```

## 📊 Flujo de Trabajo

```
┌─────────────────┐
│  Selecciona     │
│  Instancia      │
└────────┬────────┘
         │
    ┌────▼─────────────────┐
    │  FASE 1: DEPLOYMENT  │
    │  • Load config       │
    │  • SSH connect       │
    │  • Docker rebuild    │
    │  • Start container   │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │  FASE 2: MONITORING  │
    │  • Test endpoints    │
    │  • Check health      │
    │  • View logs         │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │  FASE 3: DEBUG       │
    │  • Full diagnostics  │
    │  • Generate report   │
    │  • Recommendations   │
    └────┬─────────────────┘
         │
    ┌────▼─────────────────┐
    │  REPORTE FINAL       │
    │  ✅ Listo para usar  │
    └─────────────────────┘
```

## ⏱️ Tiempos Estimados

| Acción | Tiempo |
|--------|--------|
| Deploy single | 8-20 min |
| Monitoreo | 1-2 min |
| Debug | 2-3 min |
| Deploy 3 críticas | 30-45 min |
| Deploy todas (12) | 2-3 horas |

## 🔍 Troubleshooting

| Problema | Solución |
|----------|----------|
| SSH failed | Verificar security group puerto 22 |
| Docker build fail | Ver logs: `post-deploy-monitor.ps1 -FollowLogs` |
| Endpoints timeout | Diagnosticar: `debug-post-deployment.ps1` |
| Logs con errores | Ejecutar debug completo para más info |

Ver `DEPLOY_AND_VALIDATE_SUITE.md` para troubleshooting completo.

## 📚 Documentación

- **DEPLOY_AND_VALIDATE_SUITE.md** - Guía completa (500+ líneas)
- **DEPLOY_VALIDATE_SUMMARY.md** - Resumen técnico
- **QUICK_START.md** - Inicio rápido general
- **README.md** - Proyecto principal

## 💡 Ejemplos Comunes

### 1. Desplegar y validar EC2_CORE
```powershell
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE" -AutoContinue
```

### 2. Monitorear todas las instancias
```powershell
.\post-deploy-monitor.ps1 -InstanceName "EC2_CORE" -TestEndpoints
.\post-deploy-monitor.ps1 -InstanceName "EC2_DB" -TestEndpoints
# ... etc
```

### 3. Debugging rápido
```powershell
.\debug-post-deployment.ps1 -InstanceName "EC2_API_GATEWAY"
```

### 4. Deploy sin rebuild (más rápido)
```powershell
.\deploy-complete.ps1 -InstanceName "EC2_CORE" -SkipImageBuild
```

### 5. Deploy batch con auto-continue
```powershell
$instances = "EC2_CORE", "EC2_DB", "EC2_API_GATEWAY"
foreach ($instance in $instances) {
    .\deploy-and-validate.ps1 -InstanceName $instance -AutoContinue
    Start-Sleep -Seconds 30
}
```

## ✅ Pre-Requisitos

- ✅ PowerShell 5.0+
- ✅ Node.js (para leer configuración)
- ✅ AWS CLI configurada
- ✅ AWS Secrets Manager con SSH keys
- ✅ Security groups con puertos correctos (22, 3000, etc)
- ✅ Instancias EC2 en running state
- ✅ Docker instalado en las instancias

## 🎓 Aprender Más

1. **Primer uso:** Ejecutar `.\INDEX.ps1` y seleccionar Menú Interactivo
2. **Entender el flujo:** Leer `DEPLOY_AND_VALIDATE_SUITE.md`
3. **Ver ejemplos:** Buscar sección "EJEMPLOS" en la documentación
4. **Troubleshoot:** Ejecutar `debug-post-deployment.ps1`

## 🚀 Comenzar Ahora

```powershell
# Abre el menú principal
.\INDEX.ps1

# O directamente
.\suite.ps1

# O deploy directo
.\deploy-and-validate.ps1 -InstanceName "EC2_CORE"
```

## 📞 Soporte

Para más información:
- Lee: `DEPLOY_AND_VALIDATE_SUITE.md`
- Ejecuta: `debug-post-deployment.ps1`
- Consulta: Logs en `deploy-report-*.json`

---

**Versión:** 3.0  
**Estado:** ✅ Production Ready  
**Última actualización:** 2024
