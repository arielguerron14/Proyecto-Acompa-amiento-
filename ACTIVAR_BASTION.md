## 🚀 ACTIVAR BASTION HOST - INSTRUCCIONES PARA USUARIO

### MÉTODO RECOMENDADO: EC2 Instance Connect (3 minutos)

1. **Abre AWS Console**
   - Ve a: https://console.aws.amazon.com/ec2/
   - Selecciona instancia: `i-0bd13b8e83e8679bb`
   - Estado debe ser: "En ejecución" ✓

2. **Usa EC2 Instance Connect (No necesita clave)**
   - Click botón: **"Conectar"**
   - Selecciona tab: **"EC2 Instance Connect"**
   - Usuario: `ec2-user` (debe estar preseleccionado)
   - Click: **"Conectar"**
   - Se abrirá una terminal en el navegador

3. **Copia y pega el comando de despliegue**
   ```bash
   bash -c "$(curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/DEPLOY_COPY_PASTE.sh)"
   ```

4. **Presiona ENTER**
   - Espera a que complete (toma 2-3 minutos)
   - Verás mensajes como: `✓ Docker instalado`, `✓ Contenedor desplegado`
   - Al final verás: `✅ DESPLIEGUE COMPLETADO EXITOSAMENTE`

---

### ALTERNATIVA: SSH remoto (si tienes la clave key-acompanamiento.pem)

```bash
ssh -i key-acompanamiento.pem ec2-user@3.87.155.74 \
  'bash -c "$(curl -fsSL https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/bastion-host/DEPLOY_COPY_PASTE.sh)"'
```

---

### VERIFICAR QUE FUNCIONA (después del despliegue)

En la misma terminal de la instancia (o después de conectar):

```bash
# Ver que bastion-host está corriendo
docker ps | grep bastion-host

# Ver logs (debe mostrar "✅ Configuración SSH válida")
docker logs bastion-host | tail -5

# Ver puerto (debe mostrar 0.0.0.0:2222->22/tcp)
docker port bastion-host
```

---

### PROBAR CONEXIÓN SSH

Desde tu máquina local (PowerShell/Linux/Mac):

```bash
ssh -p 2222 -i bastion-key.pem root@3.87.155.74
```

Deberías ver:
```
root@[container-id]:/# 
```

Si conecta exitosamente → **BASTION HOST FUNCIONANDO ✅**

---

### TROUBLESHOOTING

**Si dice "Connection refused":**
```bash
# Revisar logs
docker logs bastion-host

# Reiniciar contenedor
docker-compose restart

# Ver puertos
docker port bastion-host
```

**Si Docker no está disponible:**
```bash
# Instalar manualmente
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -aG docker ec2-user
```

---

## Estado Actual

✅ Código en GitHub (branch main)
✅ Dockerfile optimizado
✅ Scripts de despliegue listos
⏳ Aguardando ejecución en instancia EC2

**Próximo paso:** Ejecutar el comando de despliegue arriba
