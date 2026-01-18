# 🚀 GitHub Actions - Deploy via SSH (Sequential Jobs)

## 📋 Resumen Ejecutivo

Workflow de despliegue **production-ready** que despliega 10 instancias EC2 en secuencia usando SSH, con Docker build/pull configurables. Lee IPs dinámicamente desde `config/instance_ips.json` sin hardcodear valores.

---

## 🏗️ Arquitectura de Jobs

```
┌─────────────────────────────────────────────────────────────────┐
│                    load-config (1/11)                           │
│  ▪ Lee config/instance_ips.json                                 │
│  ▪ Exporta IPs públicas/privadas para todos los jobs            │
└────────────────┬────────────────────────────────────────────────┘
                 │
    ┌────────────┴──────────────┬──────────────┬──────────────┐
    │                           │              │              │
    ▼                           ▼              ▼              ▼
┌──────────────┐      ┌──────────────┐  ┌──────────────┐
│   Messaging  │      │   DB         │  │  Reportes    │
│   (2/11)     │      │   (3/11)     │  │  (5/11)      │
└──────┬───────┘      └──────┬───────┘  └──────┬───────┘
       │                     │                   │
       └─────────┬───────────┘                   │
                 ▼                               │
         ┌──────────────┐                        │
         │   Core       │                        │
         │   (4/11)     │◄───────────────────────┘
         └──────┬───────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌──────────┐┌──────────┐┌──────────┐
│API-GW    ││Notif.    ││Analytics │
│(6/11)    ││(7/11)    ││(8/11)    │
└────┬─────┘└──────────┘└──────────┘
     │
     ▼
┌──────────────┐
│  Monitoring  │
│  (9/11)      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Frontend    │
│  (10/11)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Bastion     │
│  (11/11)     │
└──────────────┘
       │
       ▼
┌──────────────┐
│ Verification │
│ (Summary)    │
└──────────────┘
```

---

## 📦 Jobs y Servicios Desplegados

### 1️⃣ **load-config** (Inicial)
- **Función**: Leer `config/instance_ips.json` y exportar IPs
- **Output**: 20 variables (público + privado para cada host)
- **Duración**: ~30 segundos

### 2️⃣ **deploy-messaging** → EC2-Messaging
| Servicio | Puerto | Comando |
|----------|--------|---------|
| Zookeeper | 2181 | `docker run ... proyecto-zookeeper:1.0` |
| Kafka | 9092 | `docker run ... proyecto-kafka:1.0` |
| RabbitMQ | 5672 | `docker run ... proyecto-rabbitmq:1.0` |

**Conexión**: SSH a `EC2-Messaging` (IP pública del config)

### 3️⃣ **deploy-db** → EC2-DB
| Servicio | Puerto | Comando |
|----------|--------|---------|
| MongoDB | 27017 | `docker pull mongo:latest` |
| PostgreSQL | 5432 | `docker pull postgres:latest` |
| Redis | 6379 | `docker pull redis:latest` |

**Dependencias**: Requiere `deploy-messaging` completado

### 4️⃣ **deploy-core** → EC2-CORE
| Servicio | Puerto | Env |
|----------|--------|-----|
| micro-auth | 3000 | `MONGODB_HOST=$DB_PRIVATE_IP` |
| micro-estudiantes | 3001 | `MONGODB_HOST=$DB_PRIVATE_IP` |
| micro-maestros | 3002 | `MONGODB_HOST=$DB_PRIVATE_IP` |
| micro-core | 3003 | `MONGODB_HOST=$DB_PRIVATE_IP` |

**Nota**: Usa IP privada de DB para comunicación interna

### 5️⃣ **deploy-api-gateway** → EC2-API-Gateway
| Servicio | Puerto | Env |
|----------|--------|-----|
| api-gateway | 8080 | `CORE_HOST=$CORE_PRIVATE_IP` |

**Dependencias**: Requiere `deploy-core` completado

### 6️⃣ **deploy-reportes** → EC2-Reportes
| Servicio | Puerto | Env |
|----------|--------|-----|
| micro-reportes-estudiantes | 3005 | `MONGODB_HOST=$DB_PRIVATE_IP` |
| micro-reportes-maestros | 3006 | `MONGODB_HOST=$DB_PRIVATE_IP` |

**Dependencias**: Requiere `deploy-db` completado

### 7️⃣ **deploy-notificaciones** → EC2-Notificaciones
| Servicio | Puerto | Env |
|----------|--------|-----|
| micro-notificaciones | 5005 | `MONGODB_HOST=$DB_PRIVATE_IP`, `MQTT_HOST=$MSG_PRIVATE_IP` |

**Dependencias**: Requiere `deploy-db` + `deploy-messaging` completados

### 8️⃣ **deploy-analytics** → EC2-Analytics
| Servicio | Puerto | Env |
|----------|--------|-----|
| micro-analytics | 3004 | `MONGODB_HOST=$DB_PRIVATE_IP` |

**Dependencias**: Requiere `deploy-db` completado

### 9️⃣ **deploy-monitoring** → EC2-Monitoring
| Servicio | Puerto | Comando |
|----------|--------|---------|
| Prometheus | 9090 | `docker pull prom/prometheus:latest` |
| Grafana | 3000 | `docker pull grafana/grafana:latest` |

**Dependencias**: Requiere `deploy-core` completado

### 🔟 **deploy-frontend** → EC2-Frontend
| Servicio | Puerto | Env |
|----------|--------|-----|
| frontend-web | 5500 | `API_GATEWAY_HOST=$API_PRIVATE_IP` |

**Dependencias**: Requiere `deploy-api-gateway` completado

### 1️⃣1️⃣ **deploy-bastion** → EC-Bastion
| Servicio | Puerto | Comando |
|----------|--------|---------|
| bastion-host | 22 | `docker run ... bastion-host:latest` |

**Dependencias**: Requiere `deploy-frontend` completado (última instancia)

### ✅ **verification** (Final)
- **Función**: Mostrar resumen de despliegue
- **Output**: URLs de acceso a servicios
- **Duración**: ~10 segundos

---

## 🔌 Requisitos Previos

### GitHub Secrets Requeridos:
```yaml
EC2_SSH_KEY              # Clave privada SSH (PEM format)
DOCKER_USERNAME          # Usuario de Docker Registry
DOCKER_PASSWORD          # Password de Docker Registry (opcional)
```

### Archivo de Configuración:
```json
# config/instance_ips.json
{
    "EC-Bastion": {
        "PublicIpAddress": "52.6.170.44",
        "PrivateIpAddress": "172.31.77.22"
    },
    "EC2-API-Gateway": {
        "PublicIpAddress": "98.86.94.92",
        "PrivateIpAddress": "172.31.74.81"
    },
    // ... (resto de instancias)
}
```

---

## 🚀 Cómo Usar

### Opción 1: GitHub UI
1. Ve a **GitHub → Actions**
2. Busca **"Deploy via SSH (Sequential Jobs)"**
3. Click en **"Run workflow"**
4. Selecciona:
   - `rebuild_images`: `true` (build desde Dockerfile) o `false` (pull del registry)
5. Click en **"Run workflow"**

### Opción 2: GitHub CLI
```bash
gh workflow run deploy-ssh-sequential.yml \
  -f rebuild_images=true \
  --ref main
```

---

## ⏱️ Duración Esperada

| Fase | Duración |
|------|----------|
| load-config | ~30s |
| deploy-messaging | ~10m |
| deploy-db | ~10m |
| deploy-core | ~8m |
| deploy-api-gateway | ~5m |
| deploy-reportes | ~5m |
| deploy-notificaciones | ~5m |
| deploy-analytics | ~3m |
| deploy-monitoring | ~5m |
| deploy-frontend | ~3m |
| deploy-bastion | ~2m |
| verification | ~10s |
| **Total** | **~60-90 minutos** |

**Nota**: Con `rebuild_images=false`, reduce a ~30-40 minutos

---

## 🔐 Seguridad

✅ **No hardcodea IPs**
- Lee desde `config/instance_ips.json` dinámicamente
- Cada job obtiene sus IPs del job `load-config`

✅ **SSH seguro**
- Clave privada desde GitHub Secrets
- `ssh-keyscan` agrega el host a `known_hosts`
- No usa `-o StrictHostKeyChecking=no` (más seguro)

✅ **Credenciales Docker**
- Se cargan desde GitHub Secrets
- No se exponen en logs

---

## 📊 Monitoreo

### Verificar un job específico:
```bash
gh run view <run-id> -j deploy-core
```

### Ver logs de un job:
```bash
gh run view <run-id> --log -j deploy-messaging
```

### Listar runs recientes:
```bash
gh run list --workflow=deploy-ssh-sequential.yml
```

---

## 🛠️ Troubleshooting

### "SSH connection refused"
- Verifica que la clave SSH en Secrets sea válida
- Confirma que el security group de EC2 permite SSH (puerto 22)
- Verifica que las IPs en `config/instance_ips.json` sean correctas

### "Docker build failed"
- Si `rebuild_images=true`, verifica que el Dockerfile exista
- Si falla, el workflow hace fallback a `docker pull`
- Revisa que DOCKER_USERNAME tenga acceso al registry

### "Timeout"
- Cada job tiene timeout de 30 minutos
- Si algún servicio tarda más, aumenta `timeout-minutes`
- Revisa logs del job para ver qué está lento

### "Job X requires job Y but it does not exist"
- Verifica que los `needs` en el YAML apunten a jobs existentes
- Ejemplo: `deploy-core` requiere `deploy-db`

---

## 📝 Customización

### Agregar un nuevo job:
```yaml
deploy-nuevo:
  name: "🆕 Deploy New Service"
  needs: [load-config, deploy-db]  # Dependencies
  runs-on: ubuntu-latest
  timeout-minutes: 30
  
  steps:
    - name: Checkout
      uses: actions/checkout@v3
    
    - name: Configure SSH
      run: |
        mkdir -p ~/.ssh
        echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/id_rsa
        chmod 600 ~/.ssh/id_rsa
        ssh-keyscan -H ${{ needs.load-config.outputs.nuevo-public }} >> ~/.ssh/known_hosts
    
    - name: Deploy
      run: |
        ssh -i ~/.ssh/id_rsa ec2-user@${{ needs.load-config.outputs.nuevo-public }} << 'DEPLOY'
        # Your deployment commands here
        DEPLOY
```

### Cambiar orden de ejecución:
Modifica los `needs:` en cada job. Por ejemplo, si quieres que `deploy-frontend` y `deploy-analytics` se ejecuten en paralelo después de `load-config`:

```yaml
deploy-frontend:
  needs: load-config  # Ejecución directa
  
deploy-analytics:
  needs: load-config  # Ejecución directa (paralelo con frontend)
```

---

## 📚 Referencias

- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
- [SSH Actions](https://github.com/actions/setup-node)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## ✅ Checklist Previo al Deploy

- [ ] Verificar que `config/instance_ips.json` esté actualizado
- [ ] Confirmar que GitHub Secrets tienen las claves correctas
- [ ] Probar SSH manual a una instancia
- [ ] Verificar que Docker Registry es accesible
- [ ] Confirmar que los Dockerfiles existen en el repo
- [ ] Revisar logs de un deployment anterior
- [ ] Tener lista una estrategia de rollback

---

## 🎯 Próximos Pasos

1. **Ejecutar workflow**: Ir a GitHub Actions y disparar manualmente
2. **Monitorear**: Revisar logs en tiempo real
3. **Verificar**: Acceder a los servicios con las URLs del summary
4. **Documentar**: Guardar las IPs y URLs de acceso

---

*Workflow creado: 2026-01-18*
*Estado: Production-Ready*
