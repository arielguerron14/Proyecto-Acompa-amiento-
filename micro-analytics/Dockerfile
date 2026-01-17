FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package.json and package-lock.json first for better caching
COPY micro-analytics/package*.json ./

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent

# Copy source code
COPY micro-analytics/src ./src
COPY micro-analytics/.env* ./

ENV NODE_ENV=production
EXPOSE 5007
CMD ["node", "src/app.js"]
