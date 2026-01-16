FROM node:18-slim

WORKDIR /usr/src

# Install curl for container healthcheck
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy shared modules

# Copy api-gateway code
COPY api-gateway/ /usr/src/app/

# Copy infrastructure config

# Install production dependencies for shared modules first

WORKDIR /usr/src/app
RUN npm ci --only=production --silent || npm install --production --silent

# Verify required files and dependencies
RUN if [ ! -f "server.js" ]; then echo "ERROR: server.js not found!"; ls -la /usr/src/app/; exit 1; fi && echo "✓ server.js found"
RUN if [ ! -d "node_modules/express" ]; then echo "ERROR: express not found in node_modules!"; ls -la /usr/src/app/node_modules/ | head -20; exit 1; fi && echo "✓ express found"

# Create symlinks for shared dependencies
RUN mkdir -p node_modules && \
	ln -sf /usr/src/shared-auth node_modules/shared-auth && \
	mkdir -p node_modules/@proyecto && \
	ln -sf /usr/src/shared-monitoring node_modules/@proyecto/shared-monitoring

ENV NODE_ENV=production
EXPOSE 8080

# Create a startup wrapper to help debug
# Create a startup wrapper to help debug and start the real server
RUN echo '#!/bin/sh\necho "=== Container starting ==="\necho "PWD: $(pwd)"\necho "Files: $(ls -la)"\necho "node_modules: $(ls -la node_modules | head -10)"\necho "Starting: node server.js"\nexec node server.js\n' > /usr/src/app/start.sh && chmod +x /usr/src/app/start.sh

# Use shell form CMD to ensure proper signal handling
CMD ["sh", "-c", "cd /usr/src/app && exec node server.js"]

