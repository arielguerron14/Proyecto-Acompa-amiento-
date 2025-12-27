FROM ubuntu:22.04
LABEL maintainer="Ariel Guerrón <caguerronp@uce.edu.ec>"

# Minimal Dockerfile for databases service used by CI to validate build context.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

CMD ["/bin/bash", "-c", "echo 'databases container placeholder' && sleep infinity"]
