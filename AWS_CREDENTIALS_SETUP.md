# 🔐 AWS Credentials Setup for GitHub Actions

El workflow `update-ips.yml` necesita credenciales de AWS para obtener las IPs de las instancias EC2.

## 📋 Pasos para configurar:

### 1. Obtener credenciales de AWS

En la consola de AWS:
1. Ve a **IAM** → **Users** → Tu usuario
2. Ve a **Security credentials** → **Access keys**
3. Crea una **Access Key** (si no tienes una activa)
4. Copia:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN` (opcional, si usas sesiones temporales)

### 2. Configurar secrets en GitHub

1. Ve a tu repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Crea 3 nuevos secrets:
   - `AWS_ACCESS_KEY_ID` → Pega tu Access Key ID
   - `AWS_SECRET_ACCESS_KEY` → Pega tu Secret Access Key
   - `AWS_SESSION_TOKEN` → Pega el token de sesión (si aplica)

### 3. Verificar que funciona

```bash
# Ejecuta el workflow manualmente
gh workflow run "update-ips.yml" --repo arielguerron14/Proyecto-Acompa-amiento-

# Monitorea el progreso
gh run list --repo arielguerron14/Proyecto-Acompa-amiento- --limit 5
```

## 🐛 Si sigue sin funcionar:

### Opción A: Usar script local (más seguro)

Si no quieres configurar credenciales en GitHub, puedes ejecutar localmente:

```bash
# Asegúrate que AWS CLI esté instalado y configurado
aws configure

# Luego ejecuta
python update-ips-local.py

# O actualiza manualmente
python manual-update-ips.py
```

### Opción B: Revisar permisos IAM

El usuario/credencial de AWS necesita estos permisos:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📍 Cómo funcionan las actualizaciones de IPs:

```
1. update-ips.yml (GitHub Actions)
   ├─ Fetch IPs desde AWS
   ├─ Update config/instance_ips.json
   ├─ Ejecuta sync-ips-to-config.py
   └─ Commit y push

2. deploy-ec2-frontend.yml y deploy-ec2-api-gateway.yml
   ├─ Ejecutan sync-ips-to-config.py antes de build
   └─ Generan .env con IPs actualizadas

3. Resultado: Todos los servicios usan IPs correctas 🎯
```

## ✅ Verificar que está funcionando

Después de que se ejecute `update-ips.yml`:

```bash
# Ver último commit
git log --oneline | head -1

# Revisar si instance_ips.json se actualizó
git diff HEAD^ config/instance_ips.json

# Ver si los .env se sincronizaron
git diff HEAD^ api-gateway/.env
git diff HEAD^ .env.prod.frontend
```

---

**Nota**: Sin credenciales de AWS, el workflow `update-ips.yml` no puede obtener las IPs automáticamente. En ese caso, usa los scripts locales.
