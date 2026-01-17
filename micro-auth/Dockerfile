FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./

# Install dependencies (fail fast if there's a real issue)
RUN npm ci --only=production 2>&1 || npm install --production 2>&1

# Copy application source
COPY src ./src

# Copy fallback shared-config
COPY shared-config.js ../shared-config/index.js

ENV NODE_ENV=production
# Build version: 2025-01-17-v4
EXPOSE 3000

CMD ["node", "src/app.js"]
