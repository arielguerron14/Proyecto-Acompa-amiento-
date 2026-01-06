FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests from api-gateway
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy api-gateway source files
COPY . .

# Copy entrypoint script (from repo root)
COPY docker-entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

# Expose gateway port
ENV PORT=8080
EXPOSE 8080

WORKDIR /usr/src/app
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["node", "server.js"]
