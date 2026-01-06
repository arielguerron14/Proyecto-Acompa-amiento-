FROM node:18-slim

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy source files
COPY . .

# Expose gateway port
ENV PORT=9000
EXPOSE 9000

# Copy and use startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
