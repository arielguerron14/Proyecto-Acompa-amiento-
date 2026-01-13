# 🔐 Configurar Secrets en GitHub

Para que el workflow de GitHub Actions funcione, debes agregar los siguientes secrets al repositorio:

## Pasos para agregar los secrets:

1. **Ir a Settings del repositorio**
   - Ve a: `https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions`

2. **Click en "New repository secret"** para cada uno de estos:

### Secrets a agregar:

#### `AWS_ACCESS_KEY_ID`
- **Valor:** Tu Access Key ID de AWS STS
- Ejemplo: `ASIAXHQWIHKJYFMWIEDF`

#### `AWS_SECRET_ACCESS_KEY`
- **Valor:** Tu Secret Access Key
- Ejemplo: `pOVK19IIAir5pBeTEM9/XGbU0h8bfrCjSin276hh`

#### `AWS_SESSION_TOKEN`
- **Valor:** Tu Session Token de STS
- Ejemplo: `IQoJb3JpZ2luX2VjEDcaCXVzLXdlc3QtMiJIMEY...` (el token completo)

## ⚠️ IMPORTANTE

- Los tokens STS **expiran** (generalmente en 1 hora)
- Necesitarás **renovar los tokens regularmente**
- **NUNCA** commits los secrets al repositorio
- Guarda los tokens en un lugar seguro

## Cómo obtener nuevos tokens STS

1. Abre la AWS Console
2. Ve a **AWS STS (Seguridad)** o **AWS Identity Center**
3. Solicita credenciales temporales
4. Copia los 3 valores:
   - Access Key ID
   - Secret Access Key  
   - Session Token

5. Actualiza los secrets en GitHub con los nuevos valores

## Ejecutar el Workflow

Una vez agregados los secrets:

1. Ve a **Actions** en tu repositorio
2. Selecciona **"Deploy Infrastructure"**
3. Click en **"Run workflow"**
4. Selecciona la acción: `apply` (para deploy)
5. Click en **"Run workflow"**

El workflow hará automáticamente:
- ✅ Checkout del código
- ✅ Configurar credenciales AWS
- ✅ Terraform init
- ✅ Terraform validate
- ✅ Terraform plan
- ✅ Terraform apply
- ✅ Verificar instancias EC2
- ✅ Verificar health del ALB target group
- ✅ Generar reporte de salida

## Monitoreo

Durante la ejecución:
1. Ve a la pestaña **"Actions"**
2. Selecciona el workflow en ejecución
3. Verás los logs de cada step en tiempo real

## Resultado esperado

Después de ~2-3 minutos:
- ✅ 8 instancias EC2 corriendo
- ✅ Registradas en el ALB target group
- ✅ Health checks pasando
- ✅ ALB DNS disponible: `proyecto-acompanamiento-alb-160394874.us-east-1.elb.amazonaws.com`
