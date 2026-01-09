# 🚀 GitHub Actions Workflow - Deployment Automation

## Workflow Disponible

### **deploy.yml** - Deploy Universal

Un único workflow universal para desplegar cualquier instancia con flexibilidad total.

**Características:**
- ✅ Despliega cualquiera de las 12 instancias
- ✅ Selecciona qué servicios desplegar
- ✅ Opción de reconstruir o usar imágenes existentes
- ✅ Elige ambiente (dev/staging/prod)
- ✅ Prueba automática de endpoints
- ✅ Validación de logs
- ✅ Reporte detallado

**Instancias soportadas:**
- EC2_CORE (api-gateway, micro-auth, micro-estudiantes, micro-maestros)
- EC2_DB
- EC2_API_GATEWAY
- EC2_AUTH
- EC2_ESTUDIANTES
- EC2_MAESTROS
- EC2_MESSAGING
- EC2_NOTIFICACIONES
- EC2_REPORTES
- EC2_SOAP_BRIDGE
- EC2_MONITORING
- EC2_KAFKA

**Cómo usar:**

1. Ve a: `Actions` → `Deploy Services`
2. Click en `Run workflow`
3. Completa los campos:
   - **Instance**: Selecciona instancia (dropdown con las 12)
   - **Services**: Servicios específicos o "all"
   - **Rebuild Docker**: true/false
   - **Environment**: dev/staging/prod
4. Click en `Run workflow`

**Duración estimada:**
- Con rebuild: 10-15 minutos
- Sin rebuild: 2-3 minutos

---

## 🔄 Flujo de Trabajo Típico

### Escenario: Deploy de nuevos cambios

1. **Realiza cambios en código**
   ```bash
   git commit -m "Update api-gateway"
   git push
   ```

2. **Ejecuta workflow manualmente**
   ```
   Actions → Deploy Core Services → Run workflow
   ```

3. **Espera completación**
   - Construcción de imágenes: ~5 min
   - Deployment: ~3 min
   - Testing: ~2 min

4. **Revisa resultados**
   - Artifacts → deployment-report-*.json

5. **Si todo OK, despliega otras instancias**
   ```
   Actions → Deploy Instance Suite
   ```

---

## 📋 Pre-requisitos

Para que los workflows funcionen, necesitas:

### 1. AWS Secrets Manager

Crear un secreto con tu SSH key privada:

```bash
aws secretsmanager create-secret \
  --name "AWS_EC2_SSH_PRIVATE_KEY" \
  --secret-string "$(cat ~/.ssh/id_rsa)"
```

### 2. GitHub Secrets

Agregar a tu repositorio (Settings → Secrets and variables → Actions):

```
AWS_ROLE_ARN: arn:aws:iam::ACCOUNT_ID:role/github-actions
```

### 3. AWS IAM Role

Crear un rol para GitHub Actions con permisos para:
- EC2 (acceso a instancias)
- Secrets Manager (leer SSH keys)
- CloudWatch (logs)

---

## 🔍 Monitorear Ejecución

### En tiempo real:

1. Ve a: `Actions`
2. Selecciona el workflow en ejecución
3. Verás el progreso paso a paso

### Logs detallados:

Cada paso del workflow genera logs:
- Build Docker images
- Deploy to EC2
- Test endpoints
- Check logs

### Artifacts:

Descarga los reportes generados:
1. Click en el workflow completado
2. Section "Artifacts"
3. Descarga los reportes JSON

---

## 🚨 Troubleshooting

### "SSH connection failed"

**Problema:** No se puede conectar a la instancia
**Solución:**
1. Verifica que AWS_EC2_SSH_PRIVATE_KEY está en Secrets Manager
2. Verifica que la instancia está en `running` state
3. Verifica security group permite puerto 22

```bash
# Verificar localmente
aws secretsmanager get-secret-value --secret-id "AWS_EC2_SSH_PRIVATE_KEY"
```

### "Docker build failed"

**Problema:** Error al construir imagen
**Solución:**
1. Verifica que el Dockerfile existe
2. Verifica que tiene todas las dependencias
3. Revisa los logs en el workflow

### "Endpoint test failed"

**Problema:** Los endpoints no responden
**Solución:**
1. Verifica los logs del contenedor
2. Verifica que el puerto está abierto en security group
3. Verifica variables de entorno en .env

```bash
# Verificar localmente
ssh -i ~/.ssh/id_rsa ec2-user@IP
docker logs CONTAINER_NAME
```

---

## 📊 Ejemplo de Ejecución Completa

```
Workflow: Deploy Core Services
Start: 2024-01-08T19:45:00Z

Step 1: Checkout Code ✅ (2s)
Step 2: Configure AWS Credentials ✅ (3s)
Step 3: Build api-gateway ✅ (45s)
Step 4: Build micro-auth ✅ (38s)
Step 5: Build micro-estudiantes ✅ (42s)
Step 6: Build micro-maestros ✅ (40s)
Step 7: Save Docker Images ✅ (5s)
Step 8: Upload Images ✅ (2s)
Step 9: Download Images ✅ (1s)
Step 10: Setup SSH ✅ (2s)
Step 11: Get EC2_CORE IP ✅ (1s)
Step 12: Transfer Images ✅ (15s)
Step 13: Transfer .env File ✅ (2s)
Step 14: Deploy Services ✅ (30s)
Step 15: Wait for Services ✅ (10s)
Step 16: Check Logs ✅ (5s)
Step 17: Test Endpoints ✅ (8s)
Step 18: Deployment Summary ✅ (1s)

Total Duration: 15 minutes 22 seconds ✅

Result: ✅ SUCCESS
```

---

## 🎯 Casos de Uso

### Usar Case 1: Deploy después de cambios

```
1. Realizas cambios en micro-auth
2. git push a main
3. Actions → Deploy Core Services
4. Verifica que micro-auth funciona
5. Si todo OK, despliega en otras instancias
```

### Use Case 2: Deploy de una instancia específica

```
1. Necesitas actualizar EC2_DB
2. Actions → Deploy Instance Suite
3. Selecciona EC2_DB
4. Selecciona environment (prod)
5. Espera completación
```

### Use Case 3: Rebuild sin cambios

```
1. Necesitas actualizar imagen (cambio de dependencias)
2. Actions → Deploy Core Services
3. Click Run workflow
4. Las imágenes se reconstruyen
5. Se despliegan automáticamente
```

---

## 📈 Próximas Mejoras

Ideas para mejorar los workflows:

- [ ] Notificaciones por Slack
- [ ] Rollback automático si test falla
- [ ] Registry privado (ECR)
- [ ] Cleanup automático de imágenes viejas
- [ ] Health check periódico
- [ ] Report generation automático

---

## 🔐 Seguridad

### Mejores prácticas implementadas:

✅ Credenciales en AWS Secrets Manager (no hardcodeadas)
✅ OIDC para autenticación con AWS (sin access keys)
✅ SSH con `StrictHostKeyChecking=no` (recibe host con ssh-keyscan)
✅ Artifacts con retención limitada (1-30 días)
✅ Logs públicos (no contienen secretos)

### Recomendaciones adicionales:

- Rota SSH keys regularmente
- Usa roles IAM específicos por ambiente
- Audita los logs de workflows
- Limita quién puede ejecutar workflows

---

## 📞 Soporte

Para problemas:

1. Revisa los logs del workflow
2. Ejecuta localmente: `.\deploy-and-validate.ps1 -InstanceName "EC2_CORE"`
3. Revisa la documentación: `DEPLOY_AND_VALIDATE_SUITE.md`
4. Ejecuta diagnóstico: `.\debug-post-deployment.ps1 -InstanceName "EC2_CORE"`

---

**Versión:** 1.0
**Última actualización:** 2024-01-08
**Estado:** ✅ Production Ready
