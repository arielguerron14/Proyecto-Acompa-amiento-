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
    chmod 700 /root/.ssh && \
    echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC60SOhcAV4q637KCupB3JTFHJifqqz1b4lmQriNI841pzBgs+z+YQCJAiX3gubq/1TXIv7q7jELA9EY8/+76MNnVLh/iI0azmcqpfqIv73cpF8WMMMsoRRW2KFZm1tUi6ctzZ/ZfW8HaDkntC2pQ6Pr5w9dWhaKuIJX2azht2uwWjKgql3qTcsT8Um8llA3BhWXRxlqRCKcC+8YOVs6gcL/oREL7VfiliKRapbvod2vMaruKmqUKLvQnfu+fTngwGx5cBsrZpfGMN6F3O7RFchMfXjgInrge6TjlfNXvMhmwd9ilTKEuMoq1Fvlo3SweodoXAPuR58nx2+IyWj+tZf' > /root/.ssh/authorized_keys && \
    chmod 600 /root/.ssh/authorized_keys

# Configuración de SSH para máxima seguridad
RUN mkdir -p /etc/ssh/sshd_config.d && \
    printf '%s\n' \
    '# Bastion SSH Configuration' \
    'PermitRootLogin yes' \
    'PubkeyAuthentication yes' \
    'PasswordAuthentication no' \
    'PermitEmptyPasswords no' \
    'X11Forwarding no' \
    'X11UseLocalhost yes' \
    'MaxAuthTries 3' \
    'MaxSessions 10' \
    'AllowAgentForwarding yes' \
    'AllowTcpForwarding yes' \
    'GatewayPorts no' \
    'PermitTTY yes' \
    'Compression delayed' \
    'ClientAliveInterval 300' \
    'ClientAliveCountMax 2' \
    'UsePAM yes' \
    'LogLevel VERBOSE' \
    > /etc/ssh/sshd_config.d/99-bastion.conf && \
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
    chmod 755 /var/log/bastion && \
    mkdir -p /etc/sudoers.d && \
    useradd -m -s /bin/bash ec2-user || true && \
    mkdir -p /home/ec2-user/.ssh && \
    chmod 700 /home/ec2-user/.ssh && \
    chown -R ec2-user:ec2-user /home/ec2-user/.ssh && \
    echo "ec2-user ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ec2-user && \
    chmod 440 /etc/sudoers.d/ec2-user

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
