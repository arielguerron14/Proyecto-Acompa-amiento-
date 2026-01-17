FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package.json first for caching
COPY micro-maestros/package*.json ./

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent || true

# Copy application source
COPY micro-maestros/src ./src
COPY micro-maestros/.env* ./

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "src/app.js"]
