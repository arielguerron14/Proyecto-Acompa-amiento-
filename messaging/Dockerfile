FROM alpine:latest

LABEL description="Messaging services configuration (Kafka, RabbitMQ, Zookeeper, Mosquitto) - docker-compose based"

RUN apk add --no-cache docker-compose

WORKDIR /messaging

COPY docker-compose.yml .
COPY mosquitto.conf .

CMD ["echo", "Messaging services (Kafka, RabbitMQ, Zookeeper, Mosquitto) - use docker-compose.yml for deployment"]
