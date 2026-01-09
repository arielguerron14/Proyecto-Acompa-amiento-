# 🚀 Deployment Plan - Phase 1: Core Services

## Fase 1: Deploy EC2_CORE (En progreso)

### Paso 1: Ejecutar Deploy del Core
```powershell
.\deploy-core-now.ps1
```

**Lo que sucede:**
1. ✅ GitHub Actions workflow comienza a ejecutarse
2. ✅ Construye 4 imágenes Docker (api-gateway, micro-auth, micro-estudiantes, micro-maestros)
3. ✅ Transfiere imágenes a EC2_CORE
4. ✅ Inicia contenedores
5. ✅ Prueba endpoints (puertos 3000-3003)
6. ✅ Valida logs
7. ✅ Genera reporte

**Duración:** ~15 minutos

---

### Paso 2: Monitorear Progreso
```powershell
.\monitor-deployment.ps1
```

**Lo que hace:**
- Muestra estado en tiempo real
- Actualiza cada 10 segundos
- Notifica cuando se completa

---

### Paso 3: Verificar Resultados

Cuando el workflow se complete exitosamente:

#### a) Verificar desde GitHub Actions:
1. Ve a: `GitHub repo → Actions`
2. Selecciona: `Deploy Services`
3. Abre el último run
4. Revisa los logs de cada paso
5. Descarga el artifact `deployment-report.json`

#### b) Verificar manualmente en EC2_CORE:
```bash
# SSH a la instancia
ssh -i ~/.ssh/id_rsa ec2-user@EC2_CORE_IP

# Ver contenedores
docker ps

# Ver logs
docker-compose logs

# Probar endpoints
curl http://localhost:3000/health  # api-gateway
curl http://localhost:3001/health  # micro-auth
curl http://localhost:3002/health  # micro-estudiantes
curl http://localhost:3003/health  # micro-maestros
```

---

## Después del Core: Próximas Instancias

Una vez que EC2_CORE esté listo, desplegaremos en orden:

### Fase 2: Instancias Base
1. **EC2_DB** - Base de datos
2. **EC2_MESSAGING** - Sistema de mensajería
3. **EC2_MONITORING** - Monitoreo

### Fase 3: Microservicios Individuales
4. **EC2_API_GATEWAY** - API Gateway
5. **EC2_AUTH** - Autenticación
6. **EC2_ESTUDIANTES** - Servicio de estudiantes
7. **EC2_MAESTROS** - Servicio de maestros

### Fase 4: Servicios Especializados
8. **EC2_NOTIFICACIONES** - Notificaciones
9. **EC2_REPORTES** - Reportes
10. **EC2_SOAP_BRIDGE** - Bridge SOAP
11. **EC2_KAFKA** - Kafka

---

## Workflow Consolidado

El workflow `deploy.yml` soporta todas las instancias con:

```
Instance: (12 opciones)
Services: all / específicos
Rebuild Docker: true / false
Environment: dev / staging / prod
```

---

## Si algo falla:

### Error: SSH Connection
```
Solución: 
- Verifica que la instancia está en "running"
- Verifica SSH_PRIVATE_KEY en AWS Secrets Manager
- Verifica security group permite puerto 22
```

### Error: Docker Build
```
Solución:
- Revisa los logs en GitHub Actions
- Verifica que el Dockerfile existe
- Verifica que el código compila localmente
```

### Error: Endpoints No Responden
```
Solución:
- Revisa logs: docker logs CONTAINER_NAME
- Verifica puerto en security group
- Verifica variables de entorno en .env.prod
```

---

## Próximos pasos después de revisar:

1. ✅ Core deployment completo y funcionando
2. 📝 Revisar logs y reporte
3. ✅ Proceder con EC2_DB
4. ✅ Proceder con EC2_MESSAGING
5. ✅ ... y así el resto

---

**Fecha:** 2024-01-08
**Estado:** Listos para comenzar Fase 1
**Próximo:** Ejecutar `deploy-core-now.ps1`
