# 🚀 Guía de Configuración para Despliegue en AWS

## ⚠️ Problema Actual

```
Load key "/home/runner/.ssh/bastion-key.pem": error in libcrypto
Permission denied (publickey)
```

**Causa:** La clave privada SSH no está en el formato correcto o tiene problemas de encoding en el secret.

---

## ✅ Solución: Preparar la Clave SSH Correctamente

### Paso 1: Obtener tu clave privada AWS

Si usas vockey (AWS Academy):
```bash
# Ve a tu AWS Academy console y descarga el archivo .pem
# Guárdalo en una ubicación segura, ej: ~/aws-keys/vockey.pem
```

### Paso 2: Validar el formato de la clave

```bash
# Verifica que sea OpenSSH format
file ~/aws-keys/vockey.pem
# Debe mostrar: data

# Verifica que el contenido sea válido
head -1 ~/aws-keys/vockey.pem
# Debe mostrar: -----BEGIN RSA PRIVATE KEY-----  (o OPENSSH PRIVATE KEY)
```

### Paso 3: Preparar la clave para GitHub Secret

**OPCIÓN A: En Linux/Mac (Recomendado)**

```bash
# Lee el contenido de forma segura (sin líneas extra)
cat ~/aws-keys/vockey.pem | sed 's/$/\\n/' | tr -d '\n' > /tmp/pem-encoded.txt

# O de forma más simple:
cat ~/aws-keys/vockey.pem
```

**OPCIÓN B: En PowerShell (Windows)**

```powershell
# Lee la clave completa preservando saltos de línea
$pem_content = Get-Content "C:\path\to\vockey.pem" -Raw

# Cópiala al portapapeles
$pem_content | Set-Clipboard

# O muéstrala:
Write-Host $pem_content
```

**OPCIÓN C: Convertir a base64 (Si tienes problemas)**

```bash
# En Linux/Mac
cat ~/aws-keys/vockey.pem | base64 > /tmp/pem-base64.txt

# En PowerShell
$pem = Get-Content "C:\path\to\vockey.pem" -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($pem)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
```

---

## 🔐 Configurar GitHub Secrets

1. Ve a: **Repository → Settings → Secrets and variables → Actions**

2. Click **"New repository secret"** y agrega estos 6 secrets:

### Secret 1: AWS_BASTION_PRIVATE_KEY
```
Nombre: AWS_BASTION_PRIVATE_KEY
Valor: [CONTENIDO COMPLETO DEL ARCHIVO .pem]
```

⚠️ **IMPORTANTE:** 
- Copia EXACTAMENTE el contenido del archivo .pem
- Incluye `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`
- NO agregues comillas ni caracteres extras
- Los saltos de línea deben estar preservados

**Para pegar correctamente en GitHub Web UI:**
1. Abre el archivo .pem en un editor (VS Code, Notepad, etc.)
2. Selecciona TODO el contenido (Ctrl+A)
3. Cópialo (Ctrl+C)
4. En GitHub, en el campo "Secret", pega (Ctrl+V)
5. Click "Add secret"

### Secret 2: AWS_BASTION_PUBLIC_IP
```
Nombre: AWS_BASTION_PUBLIC_IP
Valor: 54.123.45.67  (tu IP pública real del Bastion)
```

### Secret 3: AWS_FRONTEND_PRIVATE_IP
```
Nombre: AWS_FRONTEND_PRIVATE_IP
Valor: 172.31.x.x  (IP privada de EC2-Frontend)
```

### Secret 4: AWS_APIGW_PRIVATE_IP
```
Nombre: AWS_APIGW_PRIVATE_IP
Valor: 172.31.x.x  (IP privada de EC2-APIGateway)
```

### Secret 5: AWS_CORE_PRIVATE_IP
```
Nombre: AWS_CORE_PRIVATE_IP
Valor: 172.31.x.x  (IP privada de EC2-CORE/Microservicios)
```

### Secret 6: AWS_DB_PRIVATE_IP
```
Nombre: AWS_DB_PRIVATE_IP
Valor: 172.31.x.x  (IP privada de EC2-DB)
```

---

## 🧪 Verificar la Clave SSH

Antes de ejecutar el workflow, prueba localmente:

```bash
# 1. Verifica que la clave sea válida
ssh-keygen -y -f ~/aws-keys/vockey.pem > /tmp/public-key.pub

# 2. Compara con la clave pública en AWS EC2
# Ve a AWS Console → EC2 → Key Pairs y descarga la clave pública
# Comprueba que coinciden (al menos el fingerprint)

# 3. Intenta conectar al Bastion
ssh -i ~/aws-keys/vockey.pem ubuntu@54.123.45.67

# Si funciona, verás:
# ubuntu@ip-172-31-x-x:~$

# 4. Desde el Bastion, prueba acceso a instancias privadas
ssh -i ~/.ssh/id_rsa ubuntu@172.31.x.x  # (si copiaste la clave al bastion)
```

---

## 📋 Checklist de Configuración

- [ ] Clave .pem descargada desde AWS Academy
- [ ] Clave validada localmente: `ssh -i key.pem ubuntu@bastion-ip`
- [ ] 6 secrets agregados en GitHub (ver arriba)
- [ ] GitHub secret `AWS_BASTION_PRIVATE_KEY` contiene EXACTAMENTE el contenido del .pem
- [ ] IPs privadas de instancias EC2 correctas
- [ ] Security groups permiten SSH (puerto 22) entre instancias
- [ ] EC2 instances tienen el usuario `ubuntu` disponible

---

## 🚀 Ejecutar el Workflow

Una vez todo esté configurado:

1. Ve a: **Actions → Deploy Project to AWS EC2 Instances**
2. Click **"Run workflow"**
3. Selecciona:
   - **environment**: staging (recomendado para pruebas)
   - **deploy_services**: all (o el componente específico)
4. Click **"Run workflow"**

---

## 🐛 Troubleshooting

### Error: "Load key error in libcrypto"
**Causa:** Archivo PEM corrupto o mal formateado
**Solución:**
1. Descarga nuevamente la clave desde AWS
2. Valida: `ssh-keygen -y -f key.pem`
3. Copia exactamente al secret (sin espacios extras)

### Error: "Permission denied (publickey)"
**Causa:** Clave no coincide o instancia no tiene acceso público
**Solución:**
1. Verifica que la clave .pem es la correcta para la instancia
2. Verifica que security group permite SSH (puerto 22)
3. Intenta conectar localmente: `ssh -i key.pem ubuntu@bastion-ip`

### Error: "Pseudo-terminal will not be allocated"
**Normal en GitHub Actions** - No afecta el deployment
Si necesitas PTY, agregar `-t` a ssh (pero puede causar problemas)

### Error: "npm: command not found"
**Causa:** Node.js/npm no están instalados en la instancia EC2
**Solución:** ✅ **Automática**

El workflow instala automáticamente en cada deploy:
- **Frontend/API Gateway:** Node.js, npm, git, curl
- **Microservices:** Node.js, npm, git, docker.io, docker-compose
- **Databases:** Node.js, npm, git, docker.io, docker-compose

Si aún ocurre este error:
1. Verifica que la instancia tenga acceso a internet
2. Verifica que el usuario `ubuntu` tiene permisos de sudo
3. Intenta manualmente: `ssh -i key.pem ubuntu@instance-ip "sudo apt-get update"`
4. Revisa logs: `docker-compose logs`

### Error: "Connection refused" o timeout
**Causa:** Bastion/instancias no corren o security group bloqueado
**Solución:**
1. Verifica que instancias están en estado "running" en AWS Console
2. Verifica security groups permiten el tráfico
3. Verifica que IPs en secrets son correctas

---

## 📚 Referencias

- [AWS EC2 Key Pairs Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [GitHub Actions SSH Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [SSH Bastion Host Guide](https://linux.die.net/man/1/ssh)

---

## 💡 Tips de Seguridad

1. **Nunca compartas tu clave privada** - El secret en GitHub es privado pero úsalo con cuidado
2. **Rota las claves regularmente** - En AWS, crea nuevas claves y elimina las viejas
3. **Usa bastion host** - El workflow usa SSH tunnel a través del bastion (muy seguro)
4. **Monitorea los logs** - Verifica los logs del workflow para detectar accesos no autorizados
5. **Usa IAM roles en EC2** - Para acceder a otros servicios AWS desde las instancias

---

## ✅ Deployment Exitoso

Una vez el workflow corre correctamente, verás:

```
✓ Testing Bastion host...
✓ Bastion host is reachable
✓ Testing API Gateway health...
✓ Health check endpoint not available yet (normal en primer deploy)

📊 DEPLOYMENT SUMMARY
Environment: staging
Services: all
Timestamp: 2026-01-20T21:00:00Z
Deployment Status: success
```

🎉 ¡Tu proyecto está desplegado en AWS!
