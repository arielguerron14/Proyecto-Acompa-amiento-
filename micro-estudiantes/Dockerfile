FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package*.json ./
COPY src ./src

# Copy shared modules to parent directory level so npm can find them via file: references
COPY shared-auth ../shared-auth
COPY shared-monitoring ../shared-monitoring
COPY message-broker ../message-broker

# Create fallback config
COPY shared-config.js ../shared-config.js

# Install dependencies
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/app.js"]
