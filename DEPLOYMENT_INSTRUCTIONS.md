# 🚀 INSTRUCCIONES PARA DESPLEGAR EN EC2

## EJECUTA ESTO EN TU INSTANCIA EC2 (en la terminal SSH):

```bash
# Paso 1: Descargar el script
curl -s https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/DEPLOY_NOW.sh -o ~/deploy.sh

# Paso 2: Hacer ejecutable
chmod +x ~/deploy.sh

# Paso 3: Ejecutar
bash ~/deploy.sh
```

## ¿QUÉ HACE EL SCRIPT?

1. ✅ Clona el repositorio desde GitHub
2. ✅ Compila Docker images (micro-auth, micro-estudiantes, micro-maestros, micro-core)
3. ✅ Copia docker-compose.yml
4. ✅ Inicia servicios con `docker-compose up -d`
5. ✅ Verifica que estén corriendo
6. ✅ Muestra logs de inicio

## TIEMPO ESTIMADO

- Compilación: 15-20 minutos (en paralelo)
- Inicio servicios: 2-5 minutos
- **Total: ~20-25 minutos**

## VERIFICACIÓN

Después de ejecutar, verás:

```
✅ DESPLIEGUE COMPLETADO

📊 Estado de servicios:
NAME                 STATUS              PORTS
micro-auth           Up 2 minutes        3000/tcp
micro-estudiantes    Up 2 minutes        3001/tcp
micro-maestros       Up 2 minutes        3002/tcp
micro-core           Up 2 minutes        5000/tcp
```

Si ves `Up X minutes` en todos, ¡está funcionando! ✅

## TROUBLESHOOTING

### Si falla la compilación:
```bash
# Ver qué pasó:
docker logs [nombre-del-contenedor]

# Intentar compilación manual:
cd /tmp/proyecto
docker build -t micro-auth:latest -f ./micro-auth/Dockerfile .
```

### Si los servicios no inician:
```bash
# SSH a la instancia y revisa:
cd ~/app
docker-compose logs -f
```

### Si necesitas limpiar y reintentar:
```bash
cd ~/app
docker-compose down
docker system prune -af --volumes
bash ~/deploy.sh
```

---

**IMPORTANTE:** El script está optimizado para EC2-CORE. Si necesitas desplegar otras instancias (API Gateway, Reportes, etc.), avísame.
