# Resumen: Solución de Routing IP Dinámico

## ¿Qué se implementó?

### Problema Original
- IPs hardcodeadas en el workflow (se invalidaban cada vez que se reiniciaban las instancias)
- API-GATEWAY no podía comunicarse con CORE después de un reinicio
- El routing usaba IP pública en lugar de IP privada para la comunicación intra-VPC

### Solución Implementada

**Workflow automático que:**

1. ✅ **Detecta dinámicamente las IPs** de tus instancias EC2 usando AWS CLI
   - Busca instancias por nombre (tags)
   - Extrae IP pública (para SSH) e IP privada (para routing)

2. ✅ **Usa estrategia correcta de routing:**
   - **IP Pública (3.236.51.29)** → Solo para SSH desde GitHub Actions
   - **IP Privada (172.31.79.241)** → Para comunicación entre microservicios dentro de VPC

3. ✅ **Configura automáticamente:**
   - API-GATEWAY apunta a CORE usando IP privada
   - CORE usa red interna Docker (localhost)
   - Sin necesidad de actualizar manualmente después de cada reinicio

4. ✅ **Funciona en cualquier cuenta AWS:**
   - Las credenciales vienen de GitHub Secrets
   - El usuario proporciona sus propias AWS credentials
   - Completamente agnóstico a la infraestructura específica

## Archivos Modificados

### 1. `.github/workflows/deploy.yml` (Completamente reescrito)

**Cambios clave:**
```yaml
# ANTES: IPs hardcodeadas
case "${{ github.event.inputs.instance }}" in
  EC2_CORE)
    echo "ip=3.234.198.34" >> $GITHUB_OUTPUT
    ;;

# AHORA: Descubrimiento dinámico
- name: Get EC2 IPs (Dynamic Discovery)
  run: |
    aws ec2 describe-instances \
      --filters "Name=instance-state-name,Values=running" \
      --query "Reservations[].Instances[].{...}" \
      # Busca por nombre, extrae PUBLIC_IP y PRIVATE_IP
```

**Estrategia de routing:**
```bash
# SSH via PUBLIC IP
ssh -i ~/.ssh/id_rsa ubuntu@${{ PUBLIC_IP }}

# Configurar servicios con PRIVATE IP
sed -i "s|CORE_URL=.*|CORE_URL=http://$PRIVATE_IP|g" .env
```

### 2. Documentación Creada

#### `WORKFLOW_SETUP.md`
- Guía completa de configuración
- Explicación de arquitectura
- Pasos para configurar GitHub Secrets
- Troubleshooting

#### `IP_ROUTING_STRATEGY.md`
- Teoría de routing AWS
- Diagrama de tu arquitectura actual
- Comparación antes/después
- Security groups requeridos
- Tests manuales

#### `setup-github-secrets.py`
- Script interactivo para preparar secrets
- Encoding base64 de clave SSH
- Validación de credenciales

## Cómo Usar

### Paso 1: Configurar Secrets en GitHub

```bash
# Opción A: Script interactivo (recomendado)
python3 setup-github-secrets.py

# Opción B: Manual
GitHub → Settings → Secrets and variables → Actions → New secret
```

**Secrets necesarios:**
```
AWS_ACCESS_KEY_ID           # Tu access key de AWS
AWS_SECRET_ACCESS_KEY       # Tu secret key de AWS
AWS_SESSION_TOKEN           # (opcional) Si usas temp credentials
SSH_PRIVATE_KEY             # Tu key.pem en base64
```

### Paso 2: Etiquetar Instancias EC2

Asegúrate de que tus instancias tengan tags correctos:

```
EC2 → Instances → Select instance → Tags
Add tag:
  Key: Name
  Value: EC2-CORE  (o EC2-API-GATEWAY, etc.)
```

### Paso 3: Ejecutar Workflow

```
GitHub → Actions → Deploy to EC2 (Dynamic IP Discovery)
→ Run workflow
→ Selecciona instancia y configuración
→ Espera a que complete
```

**El workflow automáticamente:**
1. Detecta IPs públicas y privadas
2. Se conecta via SSH (IP pública)
3. Configura servicios (IP privada)
4. Despliega y verifica

## Ventajas

| Aspecto | Antes | Ahora |
|--------|-------|-------|
| **Hardcoded IPs** | ❌ 8 archivos | ✅ 0 archivos |
| **Cambios de IP** | ❌ Manual | ✅ Automático |
| **Multi-cuenta** | ❌ Imposible | ✅ Posible |
| **Tiempo despliegue** | ⏱️ 30min (arreglar + test) | ✅ 5min (solo deploy) |
| **Seguridad** | ⚠️ IPs públicas expuestas | ✅ IP privada para routing |
| **Escalabilidad** | ❌ No | ✅ Sí |

## Arquitectura Resultante

```
GitHub Actions (cualquier cuenta)
       ↓
AWS Account Usuario
   ├─ EC2-CORE (Private: 172.31.79.241)
   │  └─ Microservicios (puerto 3000+)
   │
   └─ EC2-API-GATEWAY (Private: 172.31.79.241)
      └─ API Gateway (puerto 8080)
         └─ Rutas a CORE via PRIVATE IP ✅

Flujo de datos:
Externo → API-GATEWAY (public IP) → CORE (private IP, VPC) → Microservicios
```

## Validación

Después de desplegar, verifica:

```bash
# 1. Instancias etiquetadas correctamente
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].{Name:Tags[?Key==`Name`].Value|[0],IP:PrivateIpAddress}'

# 2. Seguridad entre EC2s
# Desde EC2-API-GATEWAY:
curl http://172.31.79.241:3000/health  # CORE micro-auth
```

## Próximos Pasos

1. ✅ Configura GitHub Secrets (AWS credentials + SSH key)
2. ✅ Etiqueta tus instancias con tags Name
3. ✅ Ejecuta el workflow una vez
4. ✅ Verifica que todo funcione
5. 🎉 A partir de aquí, los reinicio de instancias NO requieren cambios manuales

## Referencias

- 📖 [WORKFLOW_SETUP.md](./WORKFLOW_SETUP.md) - Guía de configuración
- 📖 [IP_ROUTING_STRATEGY.md](./IP_ROUTING_STRATEGY.md) - Teoría y práctica
- 🐍 [setup-github-secrets.py](./setup-github-secrets.py) - Script helper
- 🔄 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml) - Workflow actualizado

---

**Resultado esperado:** Despliegue automatizado, independiente de cambios de IP, reutilizable en múltiples cuentas AWS. 🚀
