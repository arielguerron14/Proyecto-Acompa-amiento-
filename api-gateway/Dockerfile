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

# Start server directly
CMD ["node", "simple-server.js"]
