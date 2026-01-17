FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent || true

# Copy application source
COPY src ./src

ENV NODE_ENV=production
# Build version: 2025-01-17-v2
EXPOSE 3002

CMD ["node", "src/app.js"]
