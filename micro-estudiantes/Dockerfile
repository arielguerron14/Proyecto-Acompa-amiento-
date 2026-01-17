FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package.json first for caching
COPY package*.json ./

# Install dependencies (fail fast if there's a real issue)
RUN npm ci --only=production 2>&1 || npm install --production 2>&1

# Copy application source
COPY src ./src

ENV NODE_ENV=production
# Build version: 2025-01-17-v3
EXPOSE 3001

CMD ["node", "src/app.js"]
