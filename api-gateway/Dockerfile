FROM node:18-alpine

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

CMD ["node", "server.js"]
