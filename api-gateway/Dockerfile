FROM node:18-slim

WORKDIR /usr/src/app

# Copy package manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy source files
COPY . .

# Expose gateway port
ENV PORT=8080
EXPOSE 8080

# Start simple server
CMD ["node", "simple-server.js"]
