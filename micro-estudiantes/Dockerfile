FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package.json first for caching
COPY micro-estudiantes/package*.json ./

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent || true

# Copy application source
COPY micro-estudiantes/src ./src
COPY micro-estudiantes/.env* ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
