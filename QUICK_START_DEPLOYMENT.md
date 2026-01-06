# 🚀 QUICK START - Deploy EC2-DB Ahora

## ⚡ En 3 Pasos

### Paso 1: Verifica el Secret SSH en GitHub

```
GitHub → Settings → Secrets and variables → Actions
Busca: AWS_EC2_DB_SSH_PRIVATE_KEY
✅ Si existe, listo
❌ Si no existe, créalo con el contenido de tu .pem
```

### Paso 2: Ve a GitHub Actions

```
https://github.com/tu-usuario/Proyecto-Acompa-amiento-/actions
```

### Paso 3: Ejecuta el Workflow

```
1. Busca: "🚀 Deploy All Services (Full Stack)"
2. Click en "Run workflow"
3. Selecciona: skip_db = "false"
4. Click en "Run workflow"
5. ¡Listo! Observa el progreso
```

---

## 📊 Qué Pasará

```
⏱️  EC2-DB           (10 min)  ✅ MongoDB, PostgreSQL, Redis
⏱️  EC2-Messaging    (5 min)   ✅ Kafka, RabbitMQ
⏱️  EC2-CORE         (8 min)   ✅ Auth, Estudiantes, Maestros
⏱️  EC2-API-Gateway  (5 min)   ✅ API Gateway
⏱️  EC2-Frontend     (5 min)   ✅ Frontend Web
⏱️  EC2-Reportes     (3 min)   ✅ Reportes
⏱️  EC2-Notificaciones (3 min) ✅ Notificaciones

Total: ~45 minutos
```

---

## 🎯 Después de Completar

Tu aplicación estará disponible en:

```
🌐 Frontend:      http://107.21.124.81
🌐 API Gateway:   http://52.71.188.181:8080
📊 Monitoring:    http://54.198.235.28:3000 (Grafana)
```

---

## 📞 Soporte

Si algo falla:

1. **Revisa los logs** en GitHub Actions (verás exactamente qué pasó)
2. **Verifica el secret** SSH en GitHub
3. **Verifica instancias EC2** estén running en AWS
4. **Verifica security groups** permitan SSH (puerto 22)

---

## ✅ Ya Está Todo Listo

No necesitas hacer nada más. Solo:

1. Asegúrate que el secret existe
2. Haz click en "Run workflow"
3. ¡Espera!

**Todo el resto es automático en GitHub Actions.**
