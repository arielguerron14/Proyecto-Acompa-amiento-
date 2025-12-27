# Use the latest stable Grafana image; pin to a concrete tag if you have a specific supported version
FROM grafana/grafana:latest
# Use default upstream image. Provisioning files are provided at runtime via
# docker-compose mounts (see `monitoring/docker-compose.yml`). If you prefer
# to bake provisioning files into the image, add a `provisioning/` directory
# alongside this Dockerfile and update the build context accordingly.
