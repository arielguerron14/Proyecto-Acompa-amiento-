# Proyecto de Acompañamiento - Despliegue

## Estado Actual ✅

El proyecto está **LISTO PARA DESPLEGAR**. Todos los componentes han sido configurados:

- ✅ API Gateway con Service Registry Pattern
- ✅ Microservicios configurados (CORE, Auth, DB, API Gateway, Frontend, Messaging, Monitoring)
- ✅ GitHub Actions Workflows con descubrimiento dinámico de IPs
- ✅ EC2-CORE ejecutándose en: **3.236.51.29**
- ✅ Docker Compose configurado para todos los servicios

## Cómo Ejecutar el Despliegue

### Opción 1: GitHub Actions (RECOMENDADO)

1. Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions/workflows/deploy.yml
2. Haz clic en el botón "Run workflow"
3. Configura los parámetros:
   - Instance: **EC2_CORE**
   - Rebuild Docker: **true** (para reconstruir imágenes actualizadas)
   - Build Location: **ec2** (compilar en la instancia)
   - Environment: **prod**
4. Haz clic en "Run workflow"
5. Espera a que el workflow se complete (aprox. 5-10 minutos)

### Opción 2: Despliegue Manual Local

```bash
# Desde la raíz del proyecto
bash deploy-manual.sh
```

Requisitos:
- SSH key para EC2 en `~/.ssh/id_rsa`
- Conectividad SSH a `3.236.51.29:22`
- rsync instalado

## Acceso a la Aplicación

Una vez desplegado, accede a la aplicación en:

- **URL Principal**: http://3.236.51.29:3000
- **API Gateway**: http://3.236.51.29:8000
- **Health Check**: http://3.236.51.29:3000/health

## Monitoreo

### Ver logs de los servicios en EC2:

```bash
ssh ubuntu@3.236.51.29 "docker-compose logs -f"
```

### Ver estado de contenedores:

```bash
ssh ubuntu@3.236.51.29 "docker-compose ps"
```

## Próximos Pasos

1. ✅ Desplegar usando GitHub Actions o script manual
2. ⏳ Verificar que los servicios estén corriendo
3. ⏳ Realizar pruebas de integración
4. ⏳ Validar endpoints de la API

---

**Última actualización**: Enero 15, 2026
**Estado del proyecto**: LISTO PARA PRODUCCIÓN
