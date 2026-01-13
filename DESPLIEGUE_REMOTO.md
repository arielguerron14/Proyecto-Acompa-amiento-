╔════════════════════════════════════════════════════════════════════════════════╗
║          ⚠️  BASTION HOST: DESPLIEGUE REMOTO (Sin SSH Key)                     ║
╚════════════════════════════════════════════════════════════════════════════════╝

PROBLEMA: No tengo acceso directo SSH a la instancia (falta key-acompanamiento.pem)

SOLUCIONES DISPONIBLES:

────────────────────────────────────────────────────────────────────────────────
OPCIÓN 1: EC2 Instance Connect (RECOMENDADO - 3 minutos) ✅
────────────────────────────────────────────────────────────────────────────────

1. Abre: https://console.aws.amazon.com/ec2/

2. Busca instancia: i-0bd13b8e83e8679bb

3. Click en instancia → botón "Conectar" (esquina superior derecha)

4. Tab: "EC2 Instance Connect"
   └─ Usuario: ec2-user (preseleccionado)
   └─ Click: "Conectar"
   └─ Se abre terminal en navegador

5. En la terminal, pega este comando:

   bash -c "$(curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/DEPLOY_COPY_PASTE.sh)"

6. Presiona ENTER

7. Espera 2-3 minutos hasta ver: ✅ DESPLIEGUE COMPLETADO EXITOSAMENTE

────────────────────────────────────────────────────────────────────────────────
OPCIÓN 2: AWS Systems Manager (Requiere credenciales configuradas)
────────────────────────────────────────────────────────────────────────────────

Si tienes AWS CLI configurado con credenciales:

python.exe deploy_bastion_aws.py

Esto ejecutará el despliegue automáticamente via Systems Manager

────────────────────────────────────────────────────────────────────────────────
OPCIÓN 3: AWS CloudFormation / User Data (Para futuras instancias)
────────────────────────────────────────────────────────────────────────────────

Crear instancia con User Data Script que ejecute el despliegue automáticamente
al iniciar. Ver archivo: DEPLOY_COPY_PASTE.sh

────────────────────────────────────────────────────────────────────────────────
OPCIÓN 4: AWS Lambda + EventBridge (Automatización completa)
────────────────────────────────────────────────────────────────────────────────

Lambda Function que se dispare al crear nueva instancia y ejecute despliegue
automáticamente (setup one-time)

────────────────────────────────────────────────────────────────────────────────

⭐ RECOMENDACIÓN: Usa OPCIÓN 1 (EC2 Instance Connect)
   
   No necesita:
   ✓ Clave privada
   ✓ Configuración AWS CLI
   ✓ Credenciales especiales
   
   Funciona desde navegador en 3 minutos

────────────────────────────────────────────────────────────────────────────────

INFORMACIÓN PARA LA INSTANCIA

ID: i-0bd13b8e83e8679bb
IP: 3.87.155.74
Región: us-east-1b
Tipo: t3.small
Usuario: ec2-user
Key: key-acompanamiento

────────────────────────────────────────────────────────────────────────────────

SCRIPT DE DESPLIEGUE

Ubicación en GitHub:
https://github.com/arielguerron14/Proyecto-Acompa-amiento-/blob/main/bastion-host/DEPLOY_COPY_PASTE.sh

Comando directo:
bash -c "$(curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/DEPLOY_COPY_PASTE.sh)"

────────────────────────────────────────────────────────────────────────────────

STATUS: ✅ Código listo
        ⏳ Aguardando ejecución manual o con credenciales AWS
        
╔════════════════════════════════════════════════════════════════════════════════╗
║  Próximo Paso: Usa EC2 Instance Connect (OPCIÓN 1) para desplegar              ║
╚════════════════════════════════════════════════════════════════════════════════╝
