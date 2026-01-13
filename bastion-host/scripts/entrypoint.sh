#!/bin/bash

# Bastion Host - Entrypoint Script
# Este script se ejecuta cuando inicia el contenedor

echo "[BASTION] $(date '+%Y-%m-%d %H:%M:%S') - Iniciando Bastion Host..."

# Crear directorio de logs
mkdir -p /var/log/bastion
chmod 755 /var/log/bastion

# Generar claves SSH si no existen
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    echo "[BASTION] Generando claves SSH..."
    ssh-keygen -A
fi

# Configurar permisos SSH
chmod 600 /etc/ssh/ssh_host_*
chmod 644 /etc/ssh/ssh_host_*.pub

# Configurar authorized_keys si existe
if [ -f /root/.ssh/authorized_keys ]; then
    echo "[BASTION] Configurando SSH keys..."
    cp /root/.ssh/authorized_keys /home/ec2-user/.ssh/authorized_keys 2>/dev/null || true
    chmod 600 /home/ec2-user/.ssh/authorized_keys 2>/dev/null || true
    chown ec2-user:ec2-user /home/ec2-user/.ssh/authorized_keys 2>/dev/null || true
fi

# Iniciar auditoría
echo "[BASTION] Configurando auditoría de conexiones..."
cat > /etc/ssh/sshd_config.d/99-audit.conf << 'EOF'
# Bastion SSH Audit Configuration
LogLevel VERBOSE
SyslogFacility AUTH
AuthorizedKeysFile .ssh/authorized_keys
StrictModes yes
IgnoreRhosts yes
HostbasedAuthentication no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib64/openssh/sftp-server
EOF

# Crear archivo de motivo (MOTD)
cat > /etc/motd << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                    BASTION HOST - AWS                          ║
║                                                                ║
║  Este es un Bastion Host (Jump Host) para acceso seguro a      ║
║  instancias EC2 privadas. Todas las conexiones son auditadas.  ║
║                                                                ║
║  IP: 54.172.74.210                                             ║
║  Usuario: ec2-user                                             ║
║  Puerto: 22                                                    ║
║                                                                ║
║  ⚠️  Acceso solo autorizado. Violaciones serán registradas.    ║
╚════════════════════════════════════════════════════════════════╝
EOF

# Crear archivo de bienvenida
mkdir -p /etc/ssh
cat > /etc/ssh/banner.txt << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                    BASTION HOST - AWS                          ║
║                                                                ║
║  Acceso auditado y monitorizado                               ║
║  Instancias accesibles a través de este host                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF

# Quitar conflictos - no añadir banner si ya existe en config
# if ! grep -q "Banner" /etc/ssh/sshd_config.d/99-bastion.conf; then
#     echo "Banner /etc/ssh/banner.txt" >> /etc/ssh/sshd_config.d/99-bastion.conf
# fi

# Iniciar servicio SSH
echo "[BASTION] Iniciando SSH daemon..."
mkdir -p /var/run/sshd

# Validar configuración SSH
echo "[BASTION] Validando configuración SSH..."
/usr/sbin/sshd -t && echo "[BASTION] ✅ Configuración SSH válida" || {
    echo "[BASTION] ❌ Error en configuración SSH"
    exit 1
}

# Registrar inicio en log
echo "[BASTION] $(date '+%Y-%m-%d %H:%M:%S') - Bastion Host iniciado correctamente" >> /var/log/bastion/startup.log

# Log inicial en CloudWatch
echo "[BASTION] $(date '+%Y-%m-%d %H:%M:%S') - Bastion Host iniciado" 

# Ejecutar comando pasado como argumento (normalmente sshd -D)
echo "[BASTION] Ejecutando: $@"
exec "$@"
