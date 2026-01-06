FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests from api-gateway
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy api-gateway source files
COPY . .

# Copy entrypoint script (from repo root)
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose gateway port
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
