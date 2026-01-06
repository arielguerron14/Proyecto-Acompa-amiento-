FROM prom/prometheus:latest
COPY monitoring/prometheus/prometheus.yml /etc/prometheus/prometheus.yml
USER root
RUN chmod 644 /etc/prometheus/prometheus.yml || true
