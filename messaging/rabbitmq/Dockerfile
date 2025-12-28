FROM rabbitmq:3.12-management

LABEL maintainer="Proyecto Acompañamiento"
LABEL description="RabbitMQ message broker with management plugin"

ENV RABBITMQ_DEFAULT_USER=guest
ENV RABBITMQ_DEFAULT_PASS=guest
ENV RABBITMQ_DEFAULT_VHOST=/
ENV RABBITMQ_HEARTBEAT=60
ENV RABBITMQ_MAX_CONNECTIONS=100

EXPOSE 5672 15672

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD rabbitmq-diagnostics -q ping || exit 1
