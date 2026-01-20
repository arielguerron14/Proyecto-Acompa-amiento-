# 🗂️ Estructura de Carpetas del Proyecto

Documentación de la función y contenido de cada carpeta crítica en el proyecto.

---

## 📁 `.venv/` - Python Virtual Environment

**Propósito:** Entorno aislado de Python para scripts de automatización y herramientas administrativas.

**Contenido:**
- `Include/` - Headers de paquetes Python compilados
- `Lib/` - Librerías Python instaladas
- `Scripts/` - Scripts ejecutables de Python
- `pyvenv.cfg` - Configuración del entorno virtual

**Uso en el Proyecto:**
- Scripts de deployment (`robust-deploy.sh`)
- Monitoreo de deployments (`deployment-monitor.py`)
- Tests automáticos (`auto-run-tests.py`)
- Sincronización de configuración

**⚠️ No versionado en Git (.gitignore)**

**Cómo recrear:**
```bash
# En Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# En Windows
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📁 `.ssh/` - SSH Configuration

**Propósito:** Configuración centralizada de acceso SSH a infraestructura AWS.

**Archivos:**
- `config` - Hosts SSH preconfigurados (bastion, frontend, core, db, etc.)

**Función Específica:**

### ProxyJump (Jump Host Pattern)
```ssh
# Acceso directo al bastion
ssh bastion

# Acceso a instancias privadas a través de bastion
ssh frontend              # conecta vía bastion automáticamente
ssh core                  # conecta vía bastion automáticamente
ssh db                    # conecta vía bastion automáticamente
```

### Port Forwarding
```bash
# Acceso local a puerto remoto (ej: aplicación en 3000)
ssh -L 3000:localhost:3000 frontend

# Luego accedes en: http://localhost:3000
```

### Configuración de Hosts
- **bastion**: Punto de entrada a infraestructura AWS
- **core, db, frontend, api-gateway, etc**: Instancias privadas accesibles solo vía bastion

**⚠️ Seguridad:**
- ✅ `config` está en git (es código de configuración)
- ❌ Las claves `.pem` NO deben estar en git
- ✅ Las claves se especifican en `~/.ssh/` local
- ✅ GitHub Secrets se usan para CI/CD

---

## 📁 `artifacts/` - AWS Infrastructure Inventory

**Propósito:** Cache local del estado de infraestructura AWS.

**Contenido:**
- `caller_identity.json` - Información de cuenta AWS
- `ec2_instances.json` - Instancias EC2 (IPs, tipos, tags)
- `s3_buckets.json` - Buckets S3 disponibles
- `vpcs.json` - VPCs y subnets
- `*.bak.json` - Backups versionados de cambios

**Función:**
- Source of truth local para IPs de instancias
- Base para generar `.env.generated`
- Tracking de cambios en infraestructura
- Cache para herramientas de deployment

**Generado por:**
```bash
# Terraform outputs
terraform output -json > artifacts/

# O AWS CLI
aws ec2 describe-instances > artifacts/ec2_instances.json
aws s3api list-buckets > artifacts/s3_buckets.json
```

**Consumido por:**
- `sync-ips-to-config.py` → Genera `.env.generated`
- Scripts de deployment
- Validadores de infraestructura

**⚠️ No versionado en Git (.gitignore)**

---

## 📁 `config/` - Application Configuration

**Propósito:** Configuración centralizada del proyecto.

**Archivos:**
- `api_routes.json` - Definición de rutas del API Gateway
- `instance_ips.json` - IPs de instancias (source of truth local)

### `instance_ips.json`
```json
{
  "bastion_ip": "52.6.170.44",
  "api_gateway_ip": "98.86.94.92",
  "frontend_ip": "52.72.57.10",
  "core_ip": "3.236.99.88",
  "db_ip": "13.217.220.8"
}
```

**Función:**
- Source of truth para IPs en desarrollo
- Sincronización entre diferentes configuraciones
- Base para generar `.env.generated`
- Validación de endpoints

**Consumido por:**
- `sync-ips-to-config.py`
- `infrastructure.config.js`
- Scripts de validación

**✅ Versionado en Git (source of truth)**

---

## 📁 `mqtt/` - MQTT Broker Configuration

**Propósito:** Configuración del broker MQTT para telemetría en tiempo real.

**Estructura Típica:**
```
mqtt/
├── mosquitto.conf          # Configuración del broker
├── topics/
│   ├── sensor-data.yml     # Tópicos de sensores
│   ├── metrics.yml         # Tópicos de métricas
│   └── alerts.yml          # Tópicos de alertas
├── acl/
│   └── acl.conf            # Listas de control de acceso
└── docker-compose.yml      # Orquestación local
```

**Función:**
- Configuración del broker MQTT
- Definición de tópicos (topics)
- ACLs y seguridad
- Persistencia de mensajes

**Servicios Consumidores:**
- `micro-analytics` - Recibe métricas
- `micro-notificaciones` - Envía alertas
- Dashboards - Consume datos en tiempo real

**✅ Versionado en Git (configuración)**

---

## 📁 `scripts/` - Automation & Tools

**Propósito:** Scripts para automatización de tareas del proyecto.

### Archivos Presentes

#### `auto-fix-endpoints.js`
- **Función:** Detecta y corrige endpoints faltantes en microservicios
- **Uso:** `npm run auto-fix`
- **Trigger:** GitHub Actions (en cada push)
- **Output:** Endpoints automáticamente documentados

#### `auto-run-tests.py`
- **Función:** Ejecuta tests automáticamente
- **Uso:** Post-commit hooks o CI/CD
- **Output:** Reporte de tests

#### `deployment-monitor.py`
- **Función:** Monitorea estado de deployment en AWS
- **Input:** AWS API, logs de contenedores
- **Output:** Reportes de estado, alertas

#### `generate-cqrs.js`
- **Función:** Genera estructura CQRS en microservicios
- **Uso:** `npm run cqrs:generate`
- **Output:** Carpetas y archivos de patrón CQRS
- **Refs:** [ARCHITECTURE_CQRS.md](./ARCHITECTURE_CQRS.md)

#### `robust-deploy.sh`
- **Función:** Deployment robusto de servicios
- **Tecnología:** Docker, Terraform, AWS CLI
- **Features:** Rollback automático, health checks, logging
- **Output:** Servicios desplegados en producción

#### `validate-cqrs.js`
- **Función:** Valida que estructura CQRS sea correcta
- **Uso:** `npm run cqrs:validate`
- **Output:** Reporte de validación

#### `validate-deployment.sh`
- **Función:** Verifica éxito del deployment
- **Checks:**
  - Servicios corriendo
  - Puertos abiertos
  - Health endpoints respondiendo
- **Output:** Reporte de validación

**✅ Versionado en Git (herramientas)**

---

## 📁 `test/` - Testing Framework

**Propósito:** Tests del proyecto (unitarios, integración, e2e).

**Estructura:**
```
test/
├── unit/                    # Tests unitarios de funciones
│   ├── auth/
│   ├── middlewares/
│   └── utils/
├── integration/             # Tests de integración entre servicios
│   ├── microservices/
│   ├── api-gateway/
│   └── databases/
└── e2e/                     # Tests end-to-end del sistema completo
    ├── auth-flow.test.js
    ├── user-creation-flow.test.js
    └── complete-workflow.test.js
```

**Función:**
- ✅ Validación de funcionalidad unitaria
- ✅ Verificación de integración entre microservicios
- ✅ Pruebas de flujos completos
- ✅ Detección de regresiones

**Ejecución:**
```bash
# Todos los tests
npm run test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests específicos
npm run test -- --testPathPattern=unit
```

**Integración:**
- Pre-commit hooks (verificación local)
- CI/CD (GitHub Actions - antes de merge)
- Manuales (desarrollo local)

**Objetivo:** Mantener > 80% code coverage

**✅ Versionado en Git (tests)**

---

## 📊 Resumen - Matriz de Manejo

| Carpeta | Criticidad | Versionada | Función |
|---------|-----------|-----------|---------|
| `.venv/` | Alta | ❌ (.gitignore) | Herramientas Python |
| `.ssh/` | Alta | ✅ (sin claves) | Acceso AWS |
| `artifacts/` | Alta | ❌ (.gitignore) | Inventory AWS |
| `config/` | Alta | ✅ | Configuración central |
| `mqtt/` | Media | ✅ | Telemetría |
| `scripts/` | Alta | ✅ | Automatización |
| `test/` | Media | ✅ | Quality assurance |

---

## 🔐 Consideraciones de Seguridad

### SSH Keys
- ✅ Configuración en git (`.ssh/config`)
- ❌ Claves privadas NO en git
- ✅ Claves en `~/.ssh/` local (fuera de repo)
- ✅ GitHub Secrets para CI/CD

### Credenciales AWS
- ❌ Nunca commitear AWS credentials
- ✅ Usar IAM roles en instancias EC2
- ✅ Usar GitHub Secrets para CI/CD
- ✅ Usar AWS SSO para acceso local

### Artifacts
- ❌ No versionados (pueden contener IPs dinámicas)
- ✅ Regenerados automáticamente desde Terraform

---

## 📖 Referencias

- [ARCHITECTURE_CQRS.md](./ARCHITECTURE_CQRS.md) - Patrón CQRS
- [TURBOREPO_DOCUMENTATION.md](./TURBOREPO_DOCUMENTATION.md) - Monorepo setup
- [.env.template](./.env.template) - Configuración de ambiente
- [README.md](./README.md) - Guía principal del proyecto

---

**Última actualización:** 20 Enero 2026
