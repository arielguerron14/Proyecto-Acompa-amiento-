FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/frontend-web/package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY apps/frontend-web .

# Build Vite/React application if needed
RUN npm run build 2>/dev/null || true

# Expose port 5500 (server.js listens here)
EXPOSE 5500

# Start server
CMD ["node", "server.js"]
