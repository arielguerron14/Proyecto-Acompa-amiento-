# SSH Connection Error - Troubleshooting Guide

## Error Recibido
```
ubuntu@44.222.110.85: Permission denied (publickey).
scp: Connection closed
Error: Process completed with exit code 255.
```

---

## Causas Comunes

| # | Causa | Síntoma | Solución |
|---|-------|--------|----------|
| 1 | Clave SSH incorrecta en GitHub Secrets | `Permission denied (publickey)` | Verificar que `EC2_SSH_KEY` sea la clave **privada** correcta |
| 2 | Clave SSH malformateada | Connection closed | Asegurar que se copió el archivo `.pem` completo sin editar |
| 3 | Permisos de archivo SSH incorrectos | Permission denied | `chmod 600 ~/.ssh/id_rsa` |
| 4 | Security Group bloquea puerto 22 | Cannot establish connection | Verificar que `0.0.0.0/0` pueda acceder al puerto 22 |
| 5 | Clave pública no en authorized_keys | Permission denied | SSH manual a EC2 y agregar clave pública |

---

## Diagnóstico Paso a Paso

### 1. Verificar Que EC2_SSH_KEY Es Correcta

La clave debe ser la **privada** (archivo `.pem` descargado de AWS), no la pública.

**En GitHub:**
1. Ve a Settings → Secrets and variables → Actions
2. Busca `EC2_SSH_KEY`
3. Click "Update"
4. Verifica que comience con:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   ```
   O:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   ```

**Si está mal formateada:**
- Copia el archivo `.pem` COMPLETO desde tu computadora
- No agregues ni elimines líneas
- GitHub debe mostrar el valor completo

---

### 2. Verificar Security Group de EC2

El security group debe permitir SSH (puerto 22) desde cualquier IP.

**En AWS Console:**
1. EC2 → Instances → Selecciona la instancia (44.222.110.85)
2. Ve a Security tab
3. Click en el security group
4. Verifica que haya una regla:
   ```
   Type: SSH
   Protocol: TCP
   Port: 22
   Source: 0.0.0.0/0 (allow all)
   ```

Si no está, agrega la regla:
- Type: SSH
- Source: 0.0.0.0/0 (o tu IP de GitHub Actions)

---

### 3. Verificar Que La Clave Pública Está en EC2

**Conectar SSH manualmente:**
```bash
# Desde tu computadora
ssh -i ~/path/to/your-key.pem ubuntu@44.222.110.85

# Luego ver la clave autorizada
cat ~/.ssh/authorized_keys
```

Si no ves tu clave, debe estar en:
```bash
~/.ssh/authorized_keys
```

---

### 4. Probar Localmente Primero

Antes de usar el workflow de GitHub, prueba SSH desde tu computadora:

```bash
# 1. Dar permisos correctos a la clave
chmod 600 ~/.ssh/tu-clave.pem

# 2. Probar SSH
ssh -i ~/.ssh/tu-clave.pem ubuntu@44.222.110.85

# 3. Si funciona, probar SCP
scp -i ~/.ssh/tu-clave.pem docker-compose.messaging.yml ubuntu@44.222.110.85:/tmp/

# 4. Si funciona SCP, el workflow debería funcionar
```

---

### 5. Usar Script de Diagnóstico

Ejecuta el script incluido:

```bash
chmod +x diagnose-ssh.sh
./diagnose-ssh.sh
```

Este script verificará:
- ✓ Que la clave SSH existe
- ✓ Que los permisos son correctos (600)
- ✓ Conectividad SSH
- ✓ Que pueda copiar archivos con SCP

---

## Soluciones Rápidas

### Opción A: Regenerar La Clave SSH

Si sospechas que la clave está corrupta:

**En AWS:**
1. EC2 Dashboard → Instances
2. Click en la instancia que no conecta
3. Connect → EC2 Instance Connect (browser-based)
4. Edita `~/.ssh/authorized_keys`
5. Agrega la clave pública nueva

**En tu computadora:**
```bash
# Generar nueva clave (si es necesario)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/nueva-clave

# Copiar la pública a GitHub Secrets (la privada)
cat ~/.ssh/nueva-clave
# Copiar TODO el contenido a EC2_SSH_KEY en GitHub Secrets
```

---

### Opción B: Verificar Conectividad desde GitHub Actions

Agrega un paso de diagnóstico al workflow:

```yaml
- name: Diagnose SSH Connectivity
  run: |
    mkdir -p ~/.ssh
    echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/id_rsa
    chmod 600 ~/.ssh/id_rsa
    
    # Verificar que la clave existe
    ls -la ~/.ssh/id_rsa
    
    # Ver el fingerprint
    ssh-keygen -l -f ~/.ssh/id_rsa
    
    # Intentar conexión con verbose output
    ssh -vvv -o ConnectTimeout=10 -i ~/.ssh/id_rsa ubuntu@44.222.110.85 "echo 'Connected!'"
```

---

### Opción C: Usar Session Manager (Sin SSH)

Si no puedes hacer SSH funcionar, usa AWS Systems Manager Session Manager:

```yaml
- name: Install AWS CLI
  run: pip install boto3

- name: Deploy Using SSM
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    INSTANCE_ID: i-0b0de88edecb142fb
  run: |
    aws ssm start-session --target $INSTANCE_ID \
      --document-name "AWS-StartInteractiveCommand" \
      --parameters '{"command":"cd /tmp && docker-compose -f docker-compose.messaging.yml up -d"}'
```

---

## Checklist de Verificación

- [ ] EC2_SSH_KEY contiene la clave **privada** (comienza con `-----BEGIN`)
- [ ] La clave tiene exactamente 600 permisos: `chmod 600`
- [ ] Security Group permite SSH (puerto 22) desde 0.0.0.0/0
- [ ] La clave pública está en `~/.ssh/authorized_keys` de la instancia EC2
- [ ] Probé SSH manualmente desde mi computadora y funciona
- [ ] La IP de la instancia (44.222.110.85) es correcta
- [x] El usuario es `ubuntu` (confirmado)

---

## Comandos Útiles

```bash
# Ver logs del workflow
gh run view <RUN_ID> --log

# Ver detalles de un job específico
gh run view <RUN_ID> -j deploy-messaging --log

# Conectar SSH a la instancia (para debugging manual)
ssh -i ~/.ssh/tu-clave.pem ubuntu@44.222.110.85

# Ver que servicios están corriendo
docker ps -a

# Ver logs de un contenedor
docker logs messaging

# Ver docker-compose status
docker-compose -f docker-compose.messaging.yml ps
```

---

## Contacto/Escalamiento

Si nada de esto funciona:

1. Regenera las claves SSH en AWS
2. Descarga la nueva clave `.pem`
3. Actualiza `EC2_SSH_KEY` en GitHub Secrets
4. Reinicia los workflows

---

*Última actualización: 2026-01-18*
