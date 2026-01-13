# 🚀 QUICK START: Sistema Idempotente en 5 minutos

## ✅ PARTE 1: Preparación Inicial (2 minutos)

### Requisitos previos
- [ ] Windows 10/11
- [ ] PowerShell 7.0+
- [ ] Git instalado
- [ ] AWS CLI instalado

### Verificar instalaciones
```powershell
# Abrir PowerShell y ejecutar:
pwsh --version           # Debería ser 7.0+
git --version            # Debería mostrar versión
aws --version            # Debería mostrar versión
terraform --version      # Debería mostrar 1.6.0+
```

## ✅ PARTE 2: Credenciales AWS (1 minuto)

### Obtener credenciales STS temporales

1. **Ir a AWS Console** → https://console.aws.amazon.com
2. **Click en tu usuario** (arriba a la derecha)
3. **Seleccionar "Security credentials"**
4. **Bajar a "Temporary security credentials"**
5. **Click "Create access key"**
6. **Seleccionar "Application running outside AWS"**
7. **Copiar 3 valores:**
   - Access Key ID
   - Secret Access Key
   - Session Token

### Guardar credenciales localmente

```powershell
aws configure --profile default

# Te pedirá:
# AWS Access Key ID: [PEGA_AQUI]
# AWS Secret Access Key: [PEGA_AQUI]
# Default region: us-east-1
# Default output format: json
```

**Verificar que funciona:**
```powershell
aws sts get-caller-identity --profile default
# Debería mostrar tu ARN de AWS
```

⚠️ **NOTA**: STS tokens expiran en ~1 hora. Obtén nuevos cuando sea necesario.

## ✅ PARTE 3: GitHub Secrets (1 minuto)

### Agregar secretos para CI/CD

1. **Ir a GitHub** → https://github.com/arielguerron14/Proyecto-Acompa-amiento-
2. **Settings** → **Secrets and Variables** → **Actions**
3. **Click "New repository secret"** (3 veces)

**Secret 1:**
```
Name: AWS_ACCESS_KEY_ID
Value: [TU_ACCESS_KEY_ID]
```

**Secret 2:**
```
Name: AWS_SECRET_ACCESS_KEY
Value: [TU_SECRET_ACCESS_KEY]
```

**Secret 3:**
```
Name: AWS_SESSION_TOKEN
Value: [TU_SESSION_TOKEN]
```

**Save each one** ✅

## ✅ PARTE 4: Deploy Local (1 minuto)

### Opción A: Ver estado actual

```powershell
cd "c:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-"

# Ver estado
.\deploy-idempotent.ps1 -Action status

# Debería mostrar:
# ✅ Instancias corriendo
# ✅ ALB health status
# ✅ URL del ALB
```

### Opción B: Ver cambios (sin aplicar)

```powershell
# Ver qué haría
.\deploy-idempotent.ps1 -Action plan

# Debería mostrar:
# Plan: 8 instances to create (si no existen)
# O
# Plan: No changes (si ya existen)
```

### Opción C: Crear infraestructura

```powershell
# Crear (con confirmación)
.\deploy-idempotent.ps1 -Action apply

# Pasos:
# 1. Genera plan
# 2. Pide confirmación (escribe 's')
# 3. Crea recursos (tarda ~5 min)
# 4. Espera estabilización
# 5. Muestra estado final
```

## ✅ PARTE 5: Validar Idempotencia (1 minuto)

### Test completo (opcional pero recomendado)

```powershell
# Ejecutar validación
.\validate-idempotence.ps1

# Simula:
# RUN 1: Crea todos los recursos
# RUN 2: Valida que NO crea cambios adicionales

# Resultado esperado:
# ✅ SISTEMA IDEMPOTENTE VALIDADO
```

---

## 🎯 Escenarios Típicos

### Escenario 1: Primer deploy (infraestructura nueva)

```powershell
# 1. Ver estado
.\deploy-idempotent.ps1 -Action status
# Resultado: 0 instancias

# 2. Ver cambios
.\deploy-idempotent.ps1 -Action plan
# Resultado: Plan: 8 instances to create

# 3. Crear
.\deploy-idempotent.ps1 -Action apply
# Resultado: 8 instances created

# 4. Verificar
.\deploy-idempotent.ps1 -Action status
# Resultado: 8 instances running, 8/8 healthy
```

**Tiempo total:** ~7 minutos (5 min terraform + 2 min health checks)

### Escenario 2: Re-ejecutar deploy (validar idempotencia)

```powershell
# 1. Ver cambios
.\deploy-idempotent.ps1 -Action plan
# Resultado: No changes

# 2. Ejecutar
.\deploy-idempotent.ps1 -Action apply
# Resultado: No changes, 0 instances created

# 3. Verificar
.\deploy-idempotent.ps1 -Action status
# Resultado: 8 instances running (sin cambios)
```

**Tiempo total:** ~2 minutos

### Escenario 3: Agregar instancia

```powershell
# 1. Editar terraform/variables.tf
#    Agregar "EC2-NewService" a instance_names

# 2. Ver cambios
.\deploy-idempotent.ps1 -Action plan
# Resultado: Plan: 1 instance to create

# 3. Crear
.\deploy-idempotent.ps1 -Action apply
# Resultado: 1 instance created (8 existentes no se tocan)

# 4. Verificar
.\deploy-idempotent.ps1 -Action status
# Resultado: 9 instances running
```

### Escenario 4: Ejecutar desde GitHub Actions

```
1. Ir a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-
2. Click en: Actions
3. Seleccionar: Deploy Infrastructure
4. Click: Run workflow
5. Seleccionar action: apply
6. Click: Run workflow

Resultado: Monitorea en tiempo real cómo se crea infraestructura
```

### Escenario 5: Destruir todo (⚠️ cuidado)

```powershell
# ADVERTENCIA: Esto eliminará TODAS las instancias

.\deploy-idempotent.ps1 -Action destroy

# Te pedirá confirmación escribiendo "confirmar"
# Resultado: 8 instances deleted
```

---

## 🐛 Troubleshooting Rápido

### Error: "Credenciales inválidas"

```powershell
# Solución:
aws sts get-caller-identity
# Si falla: obtener nuevas credenciales STS

# Actualizar:
aws configure --profile default
```

### Error: "Terraform init falla"

```powershell
# Solución:
cd terraform
rm -r .terraform
terraform init
cd ..
```

### Error: "No se encuentran instancias existentes"

```powershell
# Verificar qué hay en AWS:
aws ec2 describe-instances --region us-east-1

# Si nada existe:
.\deploy-idempotent.ps1 -Action apply
```

### Error: "ALB targets no healthy"

```powershell
# Esperar 2-3 minutos después de crear
# Verificar con:
.\deploy-idempotent.ps1 -Action status

# Si sigue fallando:
# - SSH a una instancia
# - Verificar: docker ps
# - Ver logs: docker logs
```

---

## 📊 Checklist Final

- [ ] PowerShell 7.0+ instalado
- [ ] AWS CLI configurado (`aws configure`)
- [ ] Credenciales STS obtenidas
- [ ] GitHub Secrets configurados (3)
- [ ] `.\deploy-idempotent.ps1 -Action status` funciona
- [ ] `.\deploy-idempotent.ps1 -Action plan` muestra cambios
- [ ] `.\deploy-idempotent.ps1 -Action apply` crea infraestructura
- [ ] AWS Console muestra 8 instancias running
- [ ] ALB muestra 8 targets healthy
- [ ] Segunda ejecución NO crea cambios (idempotente)

## 📚 Documentos Relacionados

- **DEPLOYMENT_IDEMPOTENT_GUIDE.md** - Guía completa
- **ARCHITECTURE_IDEMPOTENT.md** - Diagramas y arquitectura
- **DEPLOYMENT_SUMMARY.md** - Resumen ejecutivo

## 🎓 Próximos Pasos

Una vez que tengas infraestructura:

1. **Desplegar aplicaciones:**
   - Usar Docker en instancias
   - Ejecutar servicios desde `docker-compose`

2. **Automatizar despliegue de apps:**
   - Workflow adicional en GitHub
   - Despliega código automáticamente

3. **Monitoreo:**
   - CloudWatch metrics
   - Health checks avanzados

---

**Versión:** 1.0
**Tiempo estimado:** 5 minutos
**Nivel:** Intermedio
**Estado:** ✅ Listo para producción
