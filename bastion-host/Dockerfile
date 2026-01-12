# Bastion Host - Jump Host para acceso seguro a todas las instancias
FROM amazonlinux:2

# Metadata
LABEL maintainer="Infrastructure Team"
LABEL description="Bastion Host - SSH Jump Host para acceso seguro a EC2 instances"
LABEL version="1.0"

# Configurar timezone y locale
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Actualizar sistema y instalar dependencias
RUN yum update -y && \
    yum install -y \
    openssh-server \
    openssh-clients \
    openssh-askpass \
    curl \
    wget \
    git \
    vim \
    nano \
    htop \
    net-tools \
    telnet \
    traceroute \
    nslookup \
    bind-utils \
    iputils \
    jq \
    aws-cli \
    awslogs \
    amazon-cloudwatch-agent \
    security-update-check \
    yum-cron \
    && \
    yum clean all && \
    rm -rf /var/cache/yum/*

# Crear directorio SSH
RUN mkdir -p /root/.ssh && \
    mkdir -p /var/run/sshd && \
    chmod 700 /root/.ssh

# Configuración de SSH para máxima seguridad
RUN echo "
# Bastion SSH Configuration
PermitRootLogin prohibit-password
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
X11Forwarding no
X11UseLocalhost yes
MaxAuthTries 3
MaxSessions 10
AllowAgentForwarding yes
AllowTcpForwarding yes
GatewayPorts no
PermitTTY yes
Compression delayed
ClientAliveInterval 300
ClientAliveCountMax 2
UsePAM yes
" > /etc/ssh/sshd_config.d/99-bastion.conf && \
    chmod 600 /etc/ssh/sshd_config.d/99-bastion.conf

# Agregar scripts de monitoreo y utilidades
RUN mkdir -p /opt/bastion/scripts

COPY scripts/health-check.sh /opt/bastion/scripts/health-check.sh
COPY scripts/bastion-monitor.sh /opt/bastion/scripts/bastion-monitor.sh
COPY scripts/audit-log.sh /opt/bastion/scripts/audit-log.sh
COPY scripts/entrypoint.sh /opt/bastion/scripts/entrypoint.sh

# Hacer ejecutables los scripts
RUN chmod +x /opt/bastion/scripts/*.sh

# Crear usuario para auditoría y logging
RUN mkdir -p /var/log/bastion && \
    chmod 755 /var/log/bastion

# Configurar AWS CLI para logging en CloudWatch
RUN mkdir -p /etc/amazon/amazon-cloudwatch-agent && \
    mkdir -p /opt/bastion/config

# Exponer puerto SSH
EXPOSE 22

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /opt/bastion/scripts/health-check.sh || exit 1

# Entrypoint
ENTRYPOINT ["/opt/bastion/scripts/entrypoint.sh"]

# Por defecto, iniciar SSH daemon
CMD ["/usr/sbin/sshd", "-D"]
