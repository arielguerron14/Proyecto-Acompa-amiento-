FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent

# Copy source code
COPY src ./src

ENV NODE_ENV=production
# Build version: 2025-01-17-v2
EXPOSE 5007
CMD ["node", "src/app.js"]
