FROM node:18-alpine

WORKDIR /app

# First, copy EVERYTHING from the build context (which should be the repo root)
# Then set up the working directory structure that package.json expects
COPY package*.json ./
COPY src ./src

# Copy shared modules to a parent directory level so npm can find them via file: references
# This assumes docker build is run from the REPO ROOT with: docker build -f micro-auth/Dockerfile .
COPY shared-auth ../shared-auth
COPY shared-monitoring ../shared-monitoring
COPY message-broker ../message-broker

# Create fallback config
COPY shared-config.js ../shared-config.js

# Install dependencies
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]
