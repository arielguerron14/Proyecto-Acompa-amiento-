FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent || npm install --production --silent || true

# Copy application source
COPY src ./src
COPY .env* ./ || true

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/app.js"]
