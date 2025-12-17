# 🚀 Guía de Deployment - Panel del Estudiante v2.0

## 📋 Pre-Deployment

### 1. Verificar Archivos

```bash
# Los siguientes archivos deben existir:
✅ frontend-web/public/estudiante.html          (modificado)
✅ frontend-web/public/js/ui-components.js      (nuevo)
✅ frontend-web/public/js/estudiante-dashboard.js (nuevo)
✅ frontend-web/public/css/ui-components.css    (nuevo)
✅ frontend-web/public/js/auth.js               (existente)
✅ frontend-web/public/curriculum.js            (existente)
```

### 2. Verificar Documentación

```bash
✅ STUDENT_DASHBOARD_IMPROVEMENTS.md
✅ COMPONENTS_QUICK_GUIDE.md
✅ INTEGRATION_GUIDE.md
✅ DASHBOARD_IMPROVEMENTS_INDEX.md
✅ VALIDATION_CHECKLIST.md
✅ VISUAL_SUMMARY.md
```

### 3. Backup

```bash
# Crear backup de archivo original (si aplica)
cp frontend-web/public/estudiante.html frontend-web/public/estudiante.html.backup
```

---

## 🔧 Instalación

### Opción 1: Copia Directa

```bash
# 1. Copiar archivos nuevos
cp /ruta/del/source/js/ui-components.js \
   /ruta/del/proyecto/frontend-web/public/js/

cp /ruta/del/source/js/estudiante-dashboard.js \
   /ruta/del/proyecto/frontend-web/public/js/

cp /ruta/del/source/css/ui-components.css \
   /ruta/del/proyecto/frontend-web/public/css/

# 2. Reemplazar archivo existente
cp /ruta/del/source/estudiante.html \
   /ruta/del/proyecto/frontend-web/public/

# 3. Copiar documentación
cp /ruta/del/source/*.md /ruta/del/proyecto/
```

### Opción 2: Git

```bash
# Desde el directorio del proyecto
git add -A
git commit -m "🎨 refactor: Panel del estudiante - rediseño completo v2.0

- Sistema de componentes reutilizables (11 componentes)
- Nueva estructura de dashboard organizada
- Mejora visual con paleta de colores y tipografía
- Feedback visual mejorado (loading, error, empty, success)
- Diseño responsive (desktop/tablet/móvil)
- Documentación completa
- 60% reducción de código
- 100% compatible con backend existente"

git push
```

---

## ✅ Post-Deployment

### 1. Verificación Inmediata

```bash
# Abrir navegador
http://localhost:3000/estudiante.html

# En consola del navegador verificar:
console.log(UI); // Debe mostrar componentes
window.dashboard; // Debe mostrar instancia
```

### 2. Testing Funcional

#### Test 1: Autenticación
```
✓ Sin JWT → redirige a login.html
✓ Con JWT → carga dashboard
✓ JWT expirado → error claro
```

#### Test 2: Carga de Datos
```
✓ Spinner aparece
✓ Datos cargan en paralelo
✓ Spinner desaparece
✓ No hay errores de consola
```

#### Test 3: Componentes
```
✓ Cards renderean
✓ Botones funcionan
✓ Modales abren/cierran
✓ Toasts notifican
```

#### Test 4: Responsividad
```
✓ Desktop: Layout multi-columna
✓ Tablet: Layout adaptado
✓ Mobile: Layout single-column
```

### 3. Monitoreo

```javascript
// En consola, monitorear:
// Tiempo de carga
console.time('dashboard');
await dashboard.loadAllData();
console.timeEnd('dashboard'); // Debe ser < 2000ms

// Errores de API
fetch('/estudiantes/reservas/estudiante/1')
  .then(r => r.json())
  .then(d => console.log('✓ API OK', d.length + ' reservas'))
  .catch(e => console.error('✗ API ERROR', e));

// Memory leaks
console.memory; // Verificar heap usage
```

---

## 🐛 Troubleshooting

### Problema: "UI is not defined"

**Causa**: `ui-components.js` no cargó  
**Solución**:
```bash
# 1. Verificar archivo existe
ls -la frontend-web/public/js/ui-components.js

# 2. Verificar en HTML está en el orden correcto
# Debe ser ANTES de estudiante-dashboard.js

# 3. Hard refresh en navegador
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

### Problema: "undefined userId"

**Causa**: JWT no válido  
**Solución**:
```javascript
// En consola:
const token = localStorage.getItem('acomp_jwt_token_v1');
console.log(token); // Debe estar presente

// Decodificar en jwt.io y verificar
```

### Problema: "Empty reservas list"

**Causa**: API endpoint no responde o no hay datos  
**Solución**:
```bash
# 1. Verificar backend está corriendo
curl http://localhost:8080/estudiantes/reservas/estudiante/1

# 2. Verificar base de datos tiene datos
# Conectar a DB y ejecutar:
SELECT * FROM reservas WHERE estudiante_id = 1;

# 3. Verificar error en DevTools > Network
# Ver response status y body
```

### Problema: "CSS no se aplica"

**Causa**: CSS no cargó o conflicto de selectores  
**Solución**:
```bash
# 1. Verificar CSS está linkeado
grep "ui-components.css" frontend-web/public/estudiante.html

# 2. Verificar ruta es correcta
file frontend-web/public/css/ui-components.css

# 3. Hard refresh y borrar caché
# DevTools > Application > Clear storage
```

---

## 📊 Validación de Performance

### Métrica: Tiempo de Carga

```javascript
// Medir
performance.mark('start');
await dashboard.loadAllData();
performance.mark('end');
performance.measure('load', 'start', 'end');
performance.getEntriesByName('load')[0].duration
// Objetivo: < 2000ms
```

### Métrica: Bundle Size

```bash
# Verificar tamaño
wc -c frontend-web/public/js/ui-components.js
# Esperado: ~25KB (gzipped ~8KB)

wc -c frontend-web/public/css/ui-components.css
# Esperado: ~30KB (gzipped ~6KB)
```

### Métrica: Lighthouse Score

```bash
# Usar Chrome DevTools
# F12 > Lighthouse > Generate report
# Objetivo: 90+ Performance
```

---

## 🔐 Verificación de Seguridad

### ✓ Checklist

```bash
# 1. JWT no está expuesto en HTML
grep -i "token\|jwt" frontend-web/public/estudiante.html
# Resultado: Solo scripts que lo leen, no hardcoded

# 2. No hay datos sensibles en localStorage
# localStorage solo tiene: acomp_jwt_token_v1 (es normal)

# 3. API calls incluyen autenticación
grep "Authorization" frontend-web/public/js/ui-components.js
# Resultado: `Bearer ${token}` presente

# 4. CORS está configurado (backend)
# Verificar headers en response:
# Access-Control-Allow-Origin: http://localhost:3000
```

---

## 📈 Rollback Plan

Si algo falla, revertir es simple:

### Plan A: Restaurar Backup
```bash
cp frontend-web/public/estudiante.html.backup \
   frontend-web/public/estudiante.html
# Restaura versión anterior en 1 minuto
```

### Plan B: Git Revert
```bash
git revert HEAD --no-edit
git push
# Revierte cambios en GIT
```

### Plan C: Mantener Nueva Versión
```bash
# Si solo HTML falla pero JS/CSS funciona:
cp frontend-web/public/estudiante-mejorado.html \
   frontend-web/public/estudiante.html
# Usa versión alternativa
```

---

## 📞 Soporte Post-Deployment

### Documentación Disponible

1. **Para Usuarios**: Ninguna (UI es intuitiva)
2. **Para Desarrolladores**:
   - `STUDENT_DASHBOARD_IMPROVEMENTS.md` - Visión general
   - `COMPONENTS_QUICK_GUIDE.md` - Referencia rápida
   - `INTEGRATION_GUIDE.md` - Cómo agregar funcionalidad

### Canales de Soporte

```
❓ Preguntas sobre componentes:
   → COMPONENTS_QUICK_GUIDE.md

❓ Agregar nueva funcionalidad:
   → INTEGRATION_GUIDE.md

❓ Entender cambios:
   → STUDENT_DASHBOARD_IMPROVEMENTS.md

❓ Testing/validación:
   → VALIDATION_CHECKLIST.md
```

---

## 🎯 Success Criteria

Deployment es exitoso cuando:

- ✅ Página carga sin errores (DevTools > Console limpia)
- ✅ Usuario se carga desde JWT (header muestra datos)
- ✅ Datos cargan en < 2 segundos
- ✅ Todo funciona en desktop, tablet y mobile
- ✅ No hay memory leaks (heap crece luego se estabiliza)
- ✅ Lighthouse score > 90
- ✅ No hay diferencias vs versión anterior (funcionalidad)

---

## 📋 Checklist Final

### Antes de Ir a Producción
- [ ] Todos los archivos están en lugar correcto
- [ ] HTML linkea correctamente los CSS/JS
- [ ] Documentación está accesible
- [ ] Backend está corriendo y responde
- [ ] Testing manual completado
- [ ] Performance aceptable
- [ ] Seguridad verificada
- [ ] Team notificado del cambio

### Post-Deployment (Primeras 24h)
- [ ] Monitorear errores en consola
- [ ] Monitorear API response times
- [ ] Recolectar feedback de usuarios
- [ ] Verificar no hay reportes de bugs
- [ ] Documentar issues encontrados

### Semana 1
- [ ] Monitorear métricas de uso
- [ ] Recibir feedback de usuarios
- [ ] Hacer ajustes menores si es necesario
- [ ] Documentar lecciones aprendidas

---

## 🚀 Deployment Script Automatizado

```bash
#!/bin/bash
set -e

echo "🚀 Iniciando deployment..."

# 1. Copiar archivos
echo "📁 Copiando archivos..."
cp js/ui-components.js frontend-web/public/js/
cp js/estudiante-dashboard.js frontend-web/public/js/
cp css/ui-components.css frontend-web/public/css/
cp estudiante.html frontend-web/public/

# 2. Validar
echo "✓ Verificando integridad..."
test -f frontend-web/public/js/ui-components.js || exit 1
test -f frontend-web/public/js/estudiante-dashboard.js || exit 1
test -f frontend-web/public/css/ui-components.css || exit 1
test -f frontend-web/public/estudiante.html || exit 1

# 3. Commitear
echo "📝 Haciendo commit..."
cd frontend-web
git add -A
git commit -m "🚀 deploy: Panel del estudiante v2.0"
git push

echo "✅ Deployment completado!"
echo "📍 Próximo paso: Verificar en navegador http://localhost:3000/estudiante.html"
```

---

**Guía de Deployment**: Diciembre 2025  
**Versión**: 2.0  
**Última actualización**: [fecha]
