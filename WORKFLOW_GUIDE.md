# 🚀 CÓMO DISPARAR EL WORKFLOW SETUP-DEPLOY-ALL

## Opción 1: Desde GitHub (Más fácil) ✅ RECOMENDADO

1. Ve a tu repositorio en GitHub:
   ```
   https://github.com/arielguerron14/Proyecto-Acompa-amiento-
   ```

2. Click en la pestaña **"Actions"**

3. En la lista de workflows a la izquierda, busca:
   ```
   Setup & Deploy Everything
   ```

4. Click en ese workflow

5. Click en el botón **"Run workflow"**

6. Selecciona las opciones (déjalo con los valores por defecto):
   - setup_db: `true` ✅
   - deploy_core: `true` ✅

7. Click en **"Run workflow"** (el botón verde)

8. ¡Listo! El workflow se ejecutará automáticamente

---

## Opción 2: Usando cURL desde terminal

Si tienes un GitHub Personal Access Token:

```bash
GITHUB_TOKEN="tu_token_aqui"
REPO="arielguerron14/Proyecto-Acompa-amiento-"

curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{
    "ref": "main",
    "inputs": {
      "setup_db": "true",
      "deploy_core": "true"
    }
  }' \
  https://api.github.com/repos/$REPO/actions/workflows/setup-deploy-all.yml/dispatches
```

---

## ⏱️ Tiempo de ejecución esperado

- **Setup MongoDB**: ~2-3 minutos
- **Espera a MongoDB**: 15 segundos
- **Download de imágenes**: ~2-3 minutos
- **Deploy de servicios**: ~2 minutos
- **Total**: ~7-10 minutos

---

## 📊 Qué verás

### Paso a paso en el workflow:

1. ✅ **Checkout code** - Descargar código
2. ✅ **Install dependencies** - Instalar paramiko
3. ✅ **Setup EC2-DB MongoDB** - Configurar MongoDB con credenciales
4. ✅ **Wait for MongoDB** - Esperar 15 segundos
5. ✅ **Diagnose EC2-DB** - Verificar que MongoDB esté corriendo
6. ✅ **Deploy to EC2-CORE** - Descargar y ejecutar microservicios
7. ✅ **Final verification** - Verificar que todo esté corriendo

---

## ✅ Resultado esperado

Si todo funciona correctamente, verás:

```
✅ Conectado a EC2-CORE
📋 Creando network core-net...
📋 Descargando micro-auth...
✅ micro-auth descargado
📋 Descargando micro-estudiantes...
✅ micro-estudiantes descargado
📋 Descargando micro-maestros...
✅ micro-maestros descargado
📋 Iniciando contenedores...
✅ micro-auth: abcd1234...
✅ micro-estudiantes: efgh5678...
✅ micro-maestros: ijkl9012...
📊 ESTADO FINAL DE EC2-CORE
✅ TODOS LOS CONTENEDORES ESTÁN RUNNING!
```

---

## 🔍 Si algo falla

1. Revisa los logs del workflow en GitHub Actions
2. Busca mensajes de error en la sección que falló
3. Los logs de Docker están disponibles en cada paso

---

## 🎯 Próximos pasos después del deployment exitoso

Una vez que todo esté corriendo:

1. **Verificar conectividad**:
   ```bash
   curl http://3.226.242.64:3000/health  # micro-auth
   curl http://3.226.242.64:3001/health  # micro-estudiantes
   curl http://3.226.242.64:3002/health  # micro-maestros
   ```

2. **Ver logs en tiempo real**:
   ```bash
   ssh -i ~/.ssh/labsuser.pem ubuntu@3.226.242.64
   docker logs -f micro-auth
   ```

3. **Monitorear recursos**:
   ```bash
   docker ps
   docker stats
   ```

---

**Estado**: ✅ Listo para ser disparado  
**Fecha**: 17 de Enero 2026
