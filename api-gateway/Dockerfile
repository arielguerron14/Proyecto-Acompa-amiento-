FROM node:18-slim

WORKDIR /usr/src/app

# Install curl for container healthcheck
RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy package manifests from the build context (api-gateway/ when built by compose)
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy source files from the build context
COPY . .

# Expose and use port 8080 to match docker-compose configuration
ENV PORT=8080
EXPOSE 8080

# Start server directly
CMD ["node", "server.js"]
