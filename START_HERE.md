🚀 WORKFLOWS DE DESPLIEGUE DOCKER - GUÍA DE INICIO

═══════════════════════════════════════════════════════════════════════════════

¡Bienvenido! Se han creado workflows automáticos para desplegar Docker en tus
instancias EC2. Aquí te muestro cómo empezar.

═══════════════════════════════════════════════════════════════════════════════

📋 ¿QUÉ SE HA CREADO?

✓ 10 workflows de GitHub Actions (en .github/workflows/)
✓ 13 scripts de despliegue bash (en deployment/scripts/)
✓ 1 orquestador Python inteligente
✓ 6 documentos de referencia
✓ Health checks y rollback automáticos

═══════════════════════════════════════════════════════════════════════════════

⚡ INICIO RÁPIDO (5 MINUTOS)

Opción 1: GitHub Actions (Sin CLI, Recomendado)
───────────────────────────────────────────────
1. Abre GitHub → Actions
2. Elige un workflow (ej: "deploy-core.yml")
3. Click "Run workflow"
4. Selecciona environment: dev/staging/prod
5. Click "Run workflow"
6. Mira los logs en vivo

Opción 2: Script Bash (Con AWS CLI)
───────────────────────────────────
chmod +x deployment/scripts/*.sh
./deployment/scripts/deploy-all-instances.sh dev

Opción 3: Python (Automatizado)
───────────────────────────────
pip install boto3
python3 deployment/orchestrator.py deploy-all --environment dev

═══════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTACIÓN

Lectura recomendada:
1. deployment/QUICK_START.md (5 min) - Opciones de uso
2. deployment/SETUP.md (10 min) - Configurar secretos
3. deployment/README.md (30 min) - Referencia completa
4. deployment/EXAMPLES.md (20 min) - Casos reales

═══════════════════════════════════════════════════════════════════════════════

🎯 INSTANCIAS SOPORTADAS

EC2-Bastion              bastion-host:latest
EC2-API-Gateway          api-gateway:latest
EC2-CORE                 4 microservicios
EC2-Reportes             2 servicios de reportes
EC2-Notificaciones       1 servicio
EC2-Messaging            Kafka, Zookeeper, RabbitMQ
EC2-DB                   MongoDB, PostgreSQL, Redis
EC2-Analytics            1 servicio
EC2-Monitoring           Prometheus, Grafana
EC2-Frontend             1 aplicación web

═══════════════════════════════════════════════════════════════════════════════

⚙️  ANTES DE EMPEZAR (Obligatorio)

1. GitHub Secrets
   Settings → Secrets and variables → Actions
   Agregar:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY

2. Instancias EC2
   Tag Name = EC2-Bastion, EC2-API-Gateway, etc.
   Systems Manager Agent activo
   Rol IAM con permisos SSM

Ver más detalles en: deployment/SETUP.md

═══════════════════════════════════════════════════════════════════════════════

✓ VERIFICACIÓN RÁPIDA

Después de desplegar, ejecuta:
  ./deployment/scripts/health-check.sh

Accede a dashboards:
  Grafana:     http://<EC2-Monitoring-IP>:3000
  Prometheus:  http://<EC2-Monitoring-IP>:9090

═══════════════════════════════════════════════════════════════════════════════

🗂️  ESTRUCTURA DE ARCHIVOS

Proyecto-Acompa-amiento-/
├── .github/workflows/
│   ├── deploy-bastion.yml
│   ├── deploy-api-gateway.yml
│   ├── deploy-core.yml
│   └── ... (10 workflows totales)
│
└── deployment/
    ├── README.md                 ← Documentación principal
    ├── QUICK_START.md            ← Guía rápida
    ├── SETUP.md                  ← Configuración
    ├── EXAMPLES.md               ← Casos de uso
    ├── DEPLOYMENT_MAP.md         ← Mapa completo
    ├── orchestrator.py           ← Herramienta Python
    │
    └── scripts/
        ├── deploy-all-instances.sh
        ├── deploy-*.sh (10 scripts)
        ├── health-check.sh
        └── rollback.sh

═══════════════════════════════════════════════════════════════════════════════

🆘 AYUDA

¿Primer despliegue?
  → Leer: deployment/QUICK_START.md

¿Problemas de setup?
  → Leer: deployment/SETUP.md

¿Casos específicos?
  → Leer: deployment/EXAMPLES.md

¿Documentación completa?
  → Leer: deployment/README.md

═══════════════════════════════════════════════════════════════════════════════

¡Listo para comenzar! 🚀

Próximo paso: deployment/QUICK_START.md
