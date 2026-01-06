FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --production 2>&1 | tail -20

# Copy source files
COPY . .

# Expose gateway port
ENV PORT=8080
EXPOSE 8080

# Start simple server with debugging
CMD ["sh", "-c", "echo '=== Starting API Gateway ===' && node simple-server.js"]
