FROM prom/prometheus:latest
COPY ./prometheus/prometheus.yml /etc/prometheus/prometheus.yml
USER root
RUN chmod 644 /etc/prometheus/prometheus.yml || true
EXPOSE 9090
