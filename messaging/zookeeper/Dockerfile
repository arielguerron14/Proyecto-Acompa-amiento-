FROM confluentinc/cp-zookeeper:7.5.0

LABEL maintainer="Proyecto Acompañamiento"
LABEL description="Zookeeper container for Kafka coordination"

ENV ZOOKEEPER_CLIENT_PORT=2181
ENV ZOOKEEPER_TICK_TIME=2000
ENV ZOOKEEPER_SYNC_LIMIT=5
ENV ZOOKEEPER_INIT_LIMIT=10

EXPOSE 2181

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD echo srvr | nc -w 2 localhost 2181 || exit 1
