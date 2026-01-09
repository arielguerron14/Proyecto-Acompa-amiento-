FROM node:18-slim

WORKDIR /usr/src

# Install curl for container healthcheck
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy shared modules
COPY shared-config/ /usr/src/shared-config/
COPY shared-auth/ /usr/src/shared-auth/
COPY shared-monitoring/ /usr/src/shared-monitoring/

# Copy api-gateway code
COPY api-gateway/ /usr/src/app/

# Copy infrastructure config
COPY infrastructure.config.js /usr/src/

# Install production dependencies for shared modules first
WORKDIR /usr/src/shared-auth
RUN npm ci --only=production --silent || npm install --production --silent

WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

# Verify required files and dependencies
RUN if [ ! -f "simple-server.js" ]; then echo "ERROR: simple-server.js not found!"; ls -la /usr/src/app/; exit 1; fi && echo "✓ simple-server.js found"
RUN if [ ! -d "node_modules/express" ]; then echo "ERROR: express not found in node_modules!"; ls -la /usr/src/app/node_modules/ | head -20; exit 1; fi && echo "✓ express found"

# Create symlinks for shared dependencies
RUN mkdir -p node_modules && \
	ln -sf /usr/src/shared-auth node_modules/shared-auth && \
	mkdir -p node_modules/@proyecto && \
	ln -sf /usr/src/shared-monitoring node_modules/@proyecto/shared-monitoring

ENV NODE_ENV=production
EXPOSE 8080

# Create a startup wrapper to help debug
RUN echo '#!/bin/sh\necho "=== Container starting ==="\necho "PWD: $(pwd)"\necho "Files: $(ls -la)"\necho "node_modules: $(ls -la node_modules | head -10)"\necho "Starting: node simple-server.js"\nexec node simple-server.js\n' > /usr/src/app/start.sh && chmod +x /usr/src/app/start.sh

# Use shell form CMD to ensure proper signal handling
CMD ["sh", "-c", "cd /usr/src/app && exec node simple-server.js"]

