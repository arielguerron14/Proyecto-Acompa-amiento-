FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests from api-gateway
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy api-gateway source files
COPY . .

# Copiar configuración centralizada (desde raíz del proyecto)
COPY ../infrastructure.config.js /usr/src/
COPY ../scripts/ /usr/src/scripts/
COPY ../docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose gateway port
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
